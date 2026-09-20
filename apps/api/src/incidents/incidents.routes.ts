import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { MatchingService } from '../matching/matching.service';
import { AIService } from '../ai/ai.service';
import { broadcastEvent } from '../events/websocket.gateway';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WS_EVENTS, IncidentStatus, ResourceStatus, DispatchStatus } from '@resqgrid/types';

export const incidentsRouter = Router();

// GET /api/incidents - List incidents with filtering & search
incidentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { category, severity, status, search, limit = '50' } = req.query;

    const where: any = {};
    if (category) where.category = String(category);
    if (severity) where.severity = String(severity);
    if (status) where.status = String(status);
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { incidentCode: { contains: String(search) } },
        { address: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    const incidents = await prisma.incident.findMany({
      where,
      take: parseInt(String(limit), 10),
      orderBy: [{ priorityScore: 'desc' }, { createdAt: 'desc' }],
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        dispatches: {
          include: {
            resource: true,
          },
        },
      },
    });

    return res.json({ success: true, data: incidents });
  } catch (error: any) {
    console.error('[Incidents] Error listing incidents:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch incidents.' });
  }
});

// GET /api/incidents/:id - Get incident details with candidate recommendations
incidentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          include: { reporter: { select: { id: true, name: true, role: true } } },
        },
        dispatches: {
          include: {
            resource: true,
            assigner: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    // Determine required resource types based on category
    let requiredTypes: any[] = [];
    if (incident.category === 'FIRE') requiredTypes = ['FIRE_TEAM', 'FIRE_TRUCK', 'AMBULANCE'];
    else if (incident.category === 'FLOOD') requiredTypes = ['RESCUE_BOAT', 'VOLUNTEER_TEAM', 'MEDICAL_TEAM'];
    else if (incident.category === 'MEDICAL') requiredTypes = ['AMBULANCE', 'MEDICAL_TEAM'];
    else if (incident.category === 'HAZMAT') requiredTypes = ['FIRE_TEAM', 'AMBULANCE', 'POLICE_TEAM'];
    else requiredTypes = ['AMBULANCE', 'POLICE_TEAM', 'VOLUNTEER_TEAM'];

    const recommendations = await MatchingService.matchResourcesForIncident(
      incident.id,
      incident.latitude,
      incident.longitude,
      requiredTypes
    );

    return res.json({
      success: true,
      data: {
        ...incident,
        recommendations,
      },
    });
  } catch (error: any) {
    console.error('[Incidents] Error fetching incident:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch incident details.' });
  }
});

// POST /api/incidents/:id/verify - Operator verifies incident
incidentsRouter.post('/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operatorId, notes } = req.body;

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.VERIFIED,
      },
      include: {
        reports: true,
        dispatches: { include: { resource: true } },
      },
    });

    await AuditService.log({
      userId: operatorId,
      action: 'incident_verified',
      entityType: 'INCIDENT',
      entityId: id,
      metadata: { notes, incidentCode: updated.incidentCode },
    });

    await NotificationsService.createNotification({
      incidentId: id,
      type: 'STATUS_UPDATE',
      title: `Incident Verified: ${updated.incidentCode}`,
      message: `Command Center operator verified incident "${updated.title}". Ready for resource dispatch.`,
    });

    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updated, id);

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to verify incident.' });
  }
});

// POST /api/incidents/:id/dispatch - Dispatch resources to incident
incidentsRouter.post('/:id/dispatch', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resourceIds, operatorId, notes } = req.body;

    if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one resourceId is required.' });
    }

    const incident = await prisma.incident.findUnique({ where: { id } });
    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const createdDispatches: any[] = [];

    for (const resId of resourceIds) {
      const resource = await prisma.resource.findUnique({ where: { id: resId } });
      if (!resource) continue;

      // Calculate distance and ETA
      const distanceKm = Math.round(
        (Math.hypot(incident.latitude - resource.latitude, incident.longitude - resource.longitude) * 111) * 10
      ) / 10;
      const etaMinutes = Math.max(3, Math.round(distanceKm * 2.5 + 2));

      // 1. Create dispatch record
      const dispatch = await prisma.dispatch.create({
        data: {
          incidentId: id,
          resourceId: resId,
          assignedBy: operatorId || null,
          status: DispatchStatus.ASSIGNED,
          distanceKm: distanceKm || 1.4,
          etaMinutes: etaMinutes || 5,
          notes: notes || 'Dispatched via Command Center',
        },
        include: {
          resource: true,
          incident: true,
        },
      });

      // 2. Mark resource ASSIGNED
      await prisma.resource.update({
        where: { id: resId },
        data: { status: ResourceStatus.ASSIGNED },
      });

      createdDispatches.push(dispatch);

      // WebSocket broadcast for each resource assignment
      broadcastEvent(WS_EVENTS.RESOURCE_ASSIGNED, { resourceId: resId, incidentId: id });
      broadcastEvent(WS_EVENTS.DISPATCH_CREATED, dispatch);
    }

    // 3. Update incident status
    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.RESPONDING,
      },
      include: {
        reports: true,
        dispatches: { include: { resource: true } },
      },
    });

    // 4. Audit & Notifications
    await AuditService.log({
      userId: operatorId,
      action: 'dispatch_created',
      entityType: 'INCIDENT',
      entityId: id,
      metadata: {
        resourceIds,
        dispatchCount: createdDispatches.length,
      },
    });

    await NotificationsService.createNotification({
      incidentId: id,
      type: 'DISPATCH_ASSIGNED',
      title: `Units Dispatched to ${incident.incidentCode}`,
      message: `${createdDispatches.length} emergency unit(s) dispatched to "${incident.title}".`,
    });

    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updatedIncident, id);

    return res.status(201).json({
      success: true,
      message: `${createdDispatches.length} resource(s) dispatched successfully.`,
      data: {
        incident: updatedIncident,
        dispatches: createdDispatches,
      },
    });
  } catch (error: any) {
    console.error('[Incidents] Error dispatching resources:', error);
    return res.status(500).json({ success: false, message: 'Failed to dispatch resources.' });
  }
});

// POST /api/incidents/:id/resolve - Resolve incident
incidentsRouter.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { operatorId, resolutionNotes } = req.body;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { dispatches: { include: { resource: true } } },
    });

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    // Free all assigned resources back to AVAILABLE
    for (const disp of incident.dispatches) {
      await prisma.dispatch.update({
        where: { id: disp.id },
        data: {
          status: DispatchStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await prisma.resource.update({
        where: { id: disp.resourceId },
        data: { status: ResourceStatus.AVAILABLE },
      });

      broadcastEvent(WS_EVENTS.RESOURCE_UPDATED, { id: disp.resourceId, status: ResourceStatus.AVAILABLE });
    }

    // Mark incident RESOLVED
    const resolvedIncident = await prisma.incident.update({
      where: { id },
      data: {
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: {
        reports: true,
        dispatches: { include: { resource: true } },
      },
    });

    await AuditService.log({
      userId: operatorId,
      action: 'incident_resolved',
      entityType: 'INCIDENT',
      entityId: id,
      metadata: {
        resolutionNotes: resolutionNotes || 'Incident fully controlled and resolved.',
        incidentCode: incident.incidentCode,
      },
    });

    await NotificationsService.createNotification({
      incidentId: id,
      type: 'INCIDENT_RESOLVED',
      title: `Incident Resolved: ${incident.incidentCode}`,
      message: `${incident.title} has been resolved. All dispatched units released.`,
    });

    broadcastEvent(WS_EVENTS.INCIDENT_RESOLVED, resolvedIncident, id);
    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, resolvedIncident, id);

    return res.json({
      success: true,
      message: 'Incident marked as resolved. Dispatched resources returned to Available.',
      data: resolvedIncident,
    });
  } catch (error: any) {
    console.error('[Incidents] Error resolving incident:', error);
    return res.status(500).json({ success: false, message: 'Failed to resolve incident.' });
  }
});

// POST /api/incidents/:id/merge - Merge another incident into this one
incidentsRouter.post('/:id/merge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sourceIncidentId, operatorId } = req.body;

    if (!sourceIncidentId) {
      return res.status(400).json({ success: false, message: 'sourceIncidentId is required.' });
    }

    const primary = await prisma.incident.findUnique({ where: { id }, include: { reports: true } });
    const source = await prisma.incident.findUnique({ where: { id: sourceIncidentId }, include: { reports: true } });

    if (!primary || !source) {
      return res.status(404).json({ success: false, message: 'Primary or source incident not found.' });
    }

    // Re-link all reports from source to primary
    await prisma.incidentReport.updateMany({
      where: { incidentId: sourceIncidentId },
      data: { incidentId: id },
    });

    // Close source incident
    await prisma.incident.update({
      where: { id: sourceIncidentId },
      data: {
        status: IncidentStatus.CLOSED,
        resolvedAt: new Date(),
        aiReasoning: `Merged into primary incident ${primary.incidentCode}`,
      },
    });

    // Update primary counts
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        affectedPeople: Math.max(primary.affectedPeople, source.affectedPeople),
        vulnerablePeople: Math.max(primary.vulnerablePeople, source.vulnerablePeople),
        confidenceScore: Math.min(0.99, primary.confidenceScore + 0.05),
      },
      include: { reports: true, dispatches: { include: { resource: true } } },
    });

    await AuditService.log({
      userId: operatorId,
      action: 'incident_merged',
      entityType: 'INCIDENT',
      entityId: id,
      metadata: {
        mergedIncidentCode: source.incidentCode,
        primaryIncidentCode: primary.incidentCode,
      },
    });

    broadcastEvent(WS_EVENTS.INCIDENT_MERGED, { primaryId: id, sourceId: sourceIncidentId });
    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updated, id);

    return res.json({ success: true, message: 'Incidents merged successfully.', data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to merge incidents.' });
  }
});

// POST /api/incidents/:id/reanalyze - Force AI reanalysis
incidentsRouter.post('/:id/reanalyze', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { reports: true },
    });

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Incident not found.' });
    }

    const combinedText = `${incident.description} ${incident.reports.map((r: any) => r.text).join(' ')}`;
    const analysis = await AIService.analyzeIncidentReport(combinedText, incident.category, incident.address);

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        category: analysis.category,
        severity: analysis.severity,
        priorityScore: analysis.priorityScore,
        aiSummary: analysis.summary,
        aiReasoning: analysis.reasoning,
        confidenceScore: analysis.confidenceScore,
        affectedPeople: Math.max(incident.affectedPeople, analysis.affectedPeople),
        vulnerablePeople: Math.max(incident.vulnerablePeople, analysis.vulnerablePeople),
      },
      include: { reports: true, dispatches: { include: { resource: true } } },
    });

    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updated, id);

    return res.json({ success: true, data: updated, aiAnalysis: analysis });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to reanalyze incident.' });
  }
});
