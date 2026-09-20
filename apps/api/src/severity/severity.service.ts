import { IncidentCategory, IncidentSeverity } from '@resqgrid/types';

export interface SeverityFactors {
  category: IncidentCategory;
  affectedPeople: number;
  vulnerablePeople: number;
  hasImmediateLifeThreat?: boolean;
  hasTrappedIndividuals?: boolean;
  hasHazardPresence?: boolean;
  hasStructuralDanger?: boolean;
  confidenceScore?: number;
}

export interface CalculatedSeverityResult {
  severity: IncidentSeverity;
  priorityScore: number; // 0 to 100
  factorsBreakdown: {
    lifeThreatScore: number;
    casualtyScaleScore: number;
    hazardMultipliers: number;
    confidenceWeight: number;
  };
  explanation: string;
}

export class SeverityService {
  /**
   * Deterministic priority score and severity calculation
   */
  static calculateSeverity(factors: SeverityFactors): CalculatedSeverityResult {
    let baseScore = 20;

    // 1. Life threat & trapped status (0 - 35 points)
    let lifeThreatScore = 0;
    if (factors.hasImmediateLifeThreat) {
      lifeThreatScore += 25;
    }
    if (factors.hasTrappedIndividuals) {
      lifeThreatScore += 15;
    }
    if (factors.vulnerablePeople > 0) {
      lifeThreatScore += Math.min(factors.vulnerablePeople * 5, 20);
    }
    lifeThreatScore = Math.min(lifeThreatScore, 40);

    // 2. Casualty scale (0 - 25 points)
    let casualtyScaleScore = 0;
    if (factors.affectedPeople >= 20) {
      casualtyScaleScore = 25;
    } else if (factors.affectedPeople >= 10) {
      casualtyScaleScore = 20;
    } else if (factors.affectedPeople >= 5) {
      casualtyScaleScore = 15;
    } else if (factors.affectedPeople >= 2) {
      casualtyScaleScore = 8;
    } else if (factors.affectedPeople === 1) {
      casualtyScaleScore = 4;
    }

    // 3. Category Hazard Multipliers (0 - 25 points)
    let hazardScore = 5;
    switch (factors.category) {
      case IncidentCategory.HAZMAT:
      case IncidentCategory.FIRE:
        hazardScore = 25;
        break;
      case IncidentCategory.STRUCTURAL:
      case IncidentCategory.FLOOD:
      case IncidentCategory.MEDICAL:
        hazardScore = 20;
        break;
      case IncidentCategory.ACCIDENT:
      case IncidentCategory.SECURITY:
      case IncidentCategory.ELECTRICAL:
        hazardScore = 15;
        break;
      case IncidentCategory.MISSING_PERSON:
        hazardScore = factors.vulnerablePeople > 0 ? 20 : 12;
        break;
      default:
        hazardScore = 5;
    }

    // 4. Confidence weighting
    const confidence = factors.confidenceScore ?? 0.9;
    const confidenceWeight = Math.max(0.7, Math.min(confidence, 1.0));

    // Total Priority Score (0 - 100)
    const rawScore = baseScore + lifeThreatScore + casualtyScaleScore + hazardScore;
    const priorityScore = Math.min(Math.round(rawScore * confidenceWeight), 99);

    // Determine normalized severity tier
    let severity: IncidentSeverity;
    if (priorityScore >= 80 || factors.hasImmediateLifeThreat || (factors.hasTrappedIndividuals && hazardScore >= 20)) {
      severity = IncidentSeverity.CRITICAL;
    } else if (priorityScore >= 60 || factors.affectedPeople >= 5 || hazardScore >= 20) {
      severity = IncidentSeverity.HIGH;
    } else if (priorityScore >= 40 || factors.affectedPeople >= 2) {
      severity = IncidentSeverity.MEDIUM;
    } else {
      severity = IncidentSeverity.LOW;
    }

    const explanation = `Score ${priorityScore}/100 (${severity}). Factors: Life threat/vulnerability (${lifeThreatScore} pts), Casualty impact (${casualtyScaleScore} pts), Hazard class (${hazardScore} pts) weighted by ${Math.round(confidenceWeight * 100)}% confidence.`;

    return {
      severity,
      priorityScore,
      factorsBreakdown: {
        lifeThreatScore,
        casualtyScaleScore,
        hazardMultipliers: hazardScore,
        confidenceWeight,
      },
      explanation,
    };
  }
}
