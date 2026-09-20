import { prisma } from '../prisma';
import { IncidentCategory, DuplicateDetectionResult } from '@resqgrid/types';

/**
 * Calculate Haversine distance between two coordinates in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // round to 2 decimal places
}

/**
 * Calculate token similarity between two texts using token set + 4-char stem roots
 */
export function calculateSemanticSimilarity(text1: string, text2: string): number {
  const cleanTokens = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const tokensA = cleanTokens(text1);
  const tokensB = cleanTokens(text2);

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  // Root stems (first 4 characters if word is >= 4 chars)
  const stemsA = new Set(tokensA.map((t) => (t.length >= 4 ? t.slice(0, 4) : t)));
  const stemsB = new Set(tokensB.map((t) => (t.length >= 4 ? t.slice(0, 4) : t)));

  const intersection = new Set([...stemsA].filter((x) => stemsB.has(x)));
  const union = new Set([...stemsA, ...stemsB]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

export class DeduplicationService {
  /**
   * Evaluates if a new incoming report is duplicate of an active incident
   */
  static async checkDuplicate(
    newReportText: string,
    category: IncidentCategory,
    lat: number,
    lon: number,
    time: Date = new Date()
  ): Promise<DuplicateDetectionResult & { explanation: string }> {
    // Look for active incidents within 12 hours
    const twelveHoursAgo = new Date(time.getTime() - 12 * 60 * 60 * 1000);

    const activeIncidents = await prisma.incident.findMany({
      where: {
        status: {
          in: ['REPORTED', 'VERIFYING', 'VERIFIED', 'DISPATCHING', 'RESPONDING', 'ON_SCENE'],
        },
        createdAt: { gte: twelveHoursAgo },
      },
      include: {
        reports: { take: 3 },
      },
    });

    let bestMatch: {
      incidentId: string;
      similarity: number;
      distanceKm: number;
      timeDeltaMinutes: number;
      categoryMatch: boolean;
      semanticScore: number;
    } | null = null;

    for (const incident of activeIncidents) {
      // 1. Spatial distance
      const distanceKm = calculateHaversineDistance(lat, lon, incident.latitude, incident.longitude);

      // Skip if beyond 2.5 km (unless extreme category/time match)
      if (distanceKm > 2.5) continue;

      // 2. Temporal difference
      const timeDeltaMinutes = Math.abs((time.getTime() - new Date(incident.createdAt).getTime()) / (1000 * 60));

      // 3. Category match
      const categoryMatch = incident.category === category;

      // 4. Semantic similarity against incident title + description + recent reports
      const combinedIncidentText = `${incident.title} ${incident.description} ${incident.reports.map((r: any) => r.text).join(' ')}`;
      const semanticScore = calculateSemanticSimilarity(newReportText, combinedIncidentText);

      // Weighted similarity score (0 - 100)
      // Geo score: 1.0 at 0km, 0.5 at 1km, 0.0 at 2km
      const geoScore = Math.max(0, 1 - distanceKm / 2.0);
      // Time score: 1.0 within 30 min, decay to 0 over 360 min
      const timeScore = Math.max(0, 1 - timeDeltaMinutes / 360);
      // Category score
      const catScore = categoryMatch ? 1.0 : 0.2;

      // Combined formula
      const similarityPercentage = Math.round(
        (geoScore * 0.35 + semanticScore * 0.35 + catScore * 0.2 + timeScore * 0.1) * 100
      );

      if (!bestMatch || similarityPercentage > bestMatch.similarity) {
        bestMatch = {
          incidentId: incident.id,
          similarity: similarityPercentage,
          distanceKm,
          timeDeltaMinutes: Math.round(timeDeltaMinutes),
          categoryMatch,
          semanticScore: Math.round(semanticScore * 100),
        };
      }
    }

    if (bestMatch && bestMatch.similarity >= 65) {
      const explanation = `Duplicate detected: ${bestMatch.similarity}% confidence based on ${bestMatch.distanceKm} km proximity, ${bestMatch.timeDeltaMinutes}-min temporal gap, and ${bestMatch.semanticScore}% semantic signal overlap.`;

      return {
        isDuplicate: true,
        primaryIncidentId: bestMatch.incidentId,
        confidence: bestMatch.similarity / 100,
        similarityPercentage: bestMatch.similarity,
        reasons: {
          spatialDistanceKm: bestMatch.distanceKm,
          temporalDeltaMinutes: bestMatch.timeDeltaMinutes,
          categoryMatch: bestMatch.categoryMatch,
          semanticSimilarity: bestMatch.semanticScore,
        },
        explanation,
      };
    }

    return {
      isDuplicate: false,
      confidence: 0,
      similarityPercentage: 0,
      reasons: {
        spatialDistanceKm: 0,
        temporalDeltaMinutes: 0,
        categoryMatch: false,
        semanticSimilarity: 0,
      },
      explanation: 'No duplicate incidents identified. Unique incident signal.',
    };
  }
}
