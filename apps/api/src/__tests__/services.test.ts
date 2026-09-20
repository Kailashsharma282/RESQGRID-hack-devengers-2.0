import { SeverityService } from '../severity/severity.service';
import { AIService } from '../ai/ai.service';
import { calculateHaversineDistance, calculateSemanticSimilarity } from '../deduplication/deduplication.service';
import { IncidentCategory, IncidentSeverity } from '@resqgrid/types';
import { safeJsonParse } from '../common/json';

describe('ResQGrid Backend Engine Tests', () => {
  describe('Haversine Distance & Semantic Similarity', () => {
    it('should accurately calculate distance between coordinates', () => {
      // Distance between two points in San Francisco (~1.2 km)
      const dist = calculateHaversineDistance(37.7749, -122.4194, 37.785, -122.415);
      expect(dist).toBeGreaterThan(1.0);
      expect(dist).toBeLessThan(1.5);
    });

    it('should compute high semantic similarity for related emergency texts', () => {
      const text1 = 'Chemical building on fire students trapped on second floor';
      const text2 = 'Smoke and fire near chemistry laboratory building';
      const similarity = calculateSemanticSimilarity(text1, text2);
      expect(similarity).toBeGreaterThan(0.2);
    });

    it('should compute low semantic similarity for unrelated texts', () => {
      const text1 = 'Chemical building fire students trapped';
      const text2 = 'Water pipe burst in dorm basement laundry room';
      const similarity = calculateSemanticSimilarity(text1, text2);
      expect(similarity).toBeLessThan(0.1);
    });
  });

  describe('Deterministic AI Analysis Service', () => {
    it('should extract structured incident data from raw fire report with trapped victims', () => {
      const report = 'Smoke and fire near the chemistry building. 12 students are trapped inside. Need firefighters and ambulance.';
      const result = AIService.deterministicAnalysis(report, undefined, 'Campus Chemistry Hall');

      expect(result.category).toBe(IncidentCategory.FIRE);
      expect(result.severity).toBe(IncidentSeverity.CRITICAL);
      expect(result.affectedPeople).toBe(12);
      expect(result.vulnerablePeople).toBeGreaterThanOrEqual(2);
      expect(result.requiredResources).toContain('FIRE_TEAM');
      expect(result.requiredResources).toContain('AMBULANCE');
      expect(result.priorityScore).toBeGreaterThanOrEqual(85);
    });

    it('should extract flood emergency with vulnerable elderly individuals', () => {
      const report = 'Water has entered Block C and two elderly people are trapped on the first floor.';
      const result = AIService.deterministicAnalysis(report);

      expect(result.category).toBe(IncidentCategory.FLOOD);
      expect(result.affectedPeople).toBe(2);
      expect(result.vulnerablePeople).toBe(2);
      expect(result.requiredResources).toContain('RESCUE_BOAT');
    });
  });

  describe('Severity Engine', () => {
    it('should score high-casualty trapped hazard incident as CRITICAL', () => {
      const result = SeverityService.calculateSeverity({
        category: IncidentCategory.FIRE,
        affectedPeople: 12,
        vulnerablePeople: 3,
        hasImmediateLifeThreat: true,
        hasTrappedIndividuals: true,
      });

      expect(result.severity).toBe(IncidentSeverity.CRITICAL);
      expect(result.priorityScore).toBeGreaterThanOrEqual(80);
    });

    it('should score minor isolated outdoor event as LOW', () => {
      const result = SeverityService.calculateSeverity({
        category: IncidentCategory.ACCIDENT,
        affectedPeople: 0,
        vulnerablePeople: 0,
        hasImmediateLifeThreat: false,
        hasTrappedIndividuals: false,
      });
      expect(result.severity).toBe(IncidentSeverity.LOW);
      expect(result.priorityScore).toBeLessThan(50);
    });
  });

  describe('Dual-Database Resilience: safeJsonParse', () => {
    it('should parse JSON strings correctly (SQLite format)', () => {
      const parsed = safeJsonParse('["HAZMAT", "EXTRICATION"]', []);
      expect(parsed).toEqual(['HAZMAT', 'EXTRICATION']);
    });

    it('should return native arrays/objects untouched (PostgreSQL / Neon DB format)', () => {
      const nativeArray = ['HAZMAT', 'EXTRICATION'];
      const parsed = safeJsonParse(nativeArray, []);
      expect(parsed).toBe(nativeArray);

      const nativeObj = { role: 'paramedic', certLevel: 4 };
      expect(safeJsonParse(nativeObj, null)).toBe(nativeObj);
    });

    it('should return fallback on null, undefined, or empty string', () => {
      expect(safeJsonParse(null, [])).toEqual([]);
      expect(safeJsonParse(undefined, null)).toBeNull();
      expect(safeJsonParse('', ['default'])).toEqual(['default']);
    });

    it('should return fallback on malformed JSON string without throwing', () => {
      expect(safeJsonParse('{invalid_json:', { fallback: true })).toEqual({ fallback: true });
    });
  });
});
