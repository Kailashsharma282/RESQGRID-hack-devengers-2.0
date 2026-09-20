import { prisma } from '../prisma';
import { calculateHaversineDistance } from '../deduplication/deduplication.service';
import { ResourceType, ResourceStatus, ResourceMatchCandidate, Resource } from '@resqgrid/types';
import { safeJsonParse } from '../common/json';

export class MatchingService {
  /**
   * Find and rank best candidate resources for an incident based on multi-factor scoring
   */
  static async matchResourcesForIncident(
    incidentId: string,
    incidentLat: number,
    incidentLon: number,
    requiredTypes: ResourceType[]
  ): Promise<ResourceMatchCandidate[]> {
    // Fetch all resources with active dispatches
    const allResources = await prisma.resource.findMany({
      include: {
        dispatches: {
          where: {
            status: { in: ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SCENE'] },
          },
        },
      },
    });

    const candidates: ResourceMatchCandidate[] = [];

    for (const res of allResources) {
      const capabilities: string[] = safeJsonParse(res.capabilities, []);
      const distanceKm = calculateHaversineDistance(incidentLat, incidentLon, res.latitude, res.longitude);

      // Estimate speed: average 40 km/h emergency transit + 2 min prep
      const etaMinutes = Math.max(2, Math.round((distanceKm / 40) * 60 + 2));

      // 1. Capability match score (0 - 35 pts)
      const isRequiredType = requiredTypes.includes(res.type as ResourceType);
      let capabilityMatchPercentage = isRequiredType ? 100 : 30;

      // Special capability bonus
      if (capabilities.includes('HAZMAT') || capabilities.includes('ADVANCED_LIFE_SUPPORT') || capabilities.includes('EXTRICATION')) {
        capabilityMatchPercentage = Math.min(100, capabilityMatchPercentage + 15);
      }

      const capabilityScore = (capabilityMatchPercentage / 100) * 35;

      // 2. Availability score (0 - 30 pts)
      let availabilityScore = 0;
      if (res.status === ResourceStatus.AVAILABLE) {
        availabilityScore = 30;
      } else if (res.status === ResourceStatus.ASSIGNED) {
        availabilityScore = 12; // can be re-routed if severe
      } else if (res.status === ResourceStatus.EN_ROUTE || res.status === ResourceStatus.ON_SCENE) {
        availabilityScore = 5;
      } else {
        availabilityScore = 0; // UNAVAILABLE or MAINTENANCE
      }

      // 3. Proximity score (0 - 25 pts)
      // Closer = higher. Full 25 points within 1km, down to 0 at 15km
      const proximityScore = Math.max(0, (1 - distanceKm / 15) * 25);

      // 4. Capacity score (0 - 10 pts)
      const capacityScore = Math.min(10, (res.capacity / 4) * 10);

      // Total Matching Score (0 - 100)
      const matchingScore = Math.min(100, Math.round(capabilityScore + availabilityScore + proximityScore + capacityScore));

      const recommended = isRequiredType && res.status === ResourceStatus.AVAILABLE && distanceKm <= 8;

      let reasoning = `${res.name} (${res.type}): `;
      if (recommended) {
        reasoning += `High priority match (${matchingScore}%). ${distanceKm} km away, ETA ${etaMinutes} mins. 100% capability fit and immediately available.`;
      } else if (res.status !== ResourceStatus.AVAILABLE) {
        reasoning += `Currently ${res.status.toLowerCase()} on another operation. ${distanceKm} km away.`;
      } else {
        reasoning += `${distanceKm} km away. Standby secondary reserve unit.`;
      }

      const formattedResource: Resource = {
        id: res.id,
        name: res.name,
        type: res.type as ResourceType,
        status: res.status as ResourceStatus,
        capacity: res.capacity,
        latitude: res.latitude,
        longitude: res.longitude,
        organization: res.organization,
        contact: res.contact,
        capabilities,
        metadata: safeJsonParse(res.metadata, null),
        createdAt: res.createdAt,
        updatedAt: res.updatedAt,
      };

      candidates.push({
        resource: formattedResource,
        matchingScore,
        distanceKm,
        etaMinutes,
        capabilityMatchPercentage,
        availabilityScore,
        recommended,
        reasoning,
      });
    }

    // Sort by matching score descending
    return candidates.sort((a, b) => b.matchingScore - a.matchingScore);
  }
}
