import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { broadcastEvent } from '../events/websocket.gateway';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WS_EVENTS, IncidentCategory, IncidentSeverity, IncidentStatus, ResourceStatus, DispatchStatus } from '@resqgrid/types';

export const demoRouter = Router();

// Run the complete Campus Chemical Building Fire Simulation
demoRouter.post('/run-scenario', async (_req: Request, res: Response) => {
  try {
    const demoCode = 'RQ-2026-0042';

    // 1. Clean up any previous instance of this demo incident
    const prev = await prisma.incident.findUnique({ where: { incidentCode: demoCode } });
    if (prev) {
      await prisma.incident.delete({ where: { id: prev.id } });
    }

    // Coords near Chemistry Hall (Tech Campus: 37.7749, -122.4194)
    const chemLat = 37.7758;
    const chemLon = -122.4182;

    // Step 1: Initial Report arrives
    const incident = await prisma.incident.create({
      data: {
        incidentCode: demoCode,
        title: 'Campus Chemical Building Fire',
        description: 'Heavy smoke and fire detected near Chemistry Building Block C. Students trapped inside laboratory.',
        category: IncidentCategory.FIRE,
        severity: IncidentSeverity.CRITICAL,
        status: IncidentStatus.REPORTED,
        latitude: chemLat,
        longitude: chemLon,
        address: 'Chemistry Building Block C, East Campus Way',
        affectedPeople: 12,
        vulnerablePeople: 3,
        confidenceScore: 0.94,
        priorityScore: 96.0,
        source: 'CITIZEN_REPORT',
        aiSummary: 'Major chemical structure fire with hazardous solvent ignition. 12 students reported trapped on 2nd floor lab.',
        aiReasoning: 'CRITICAL severity due to active fire in chemical lab, trapped students, and toxic vapor risk.',
        reports: {
          create: [
            {
              text: 'Smoke and fire detected near Chemistry Building. Students may be trapped inside.',
              latitude: chemLat,
              longitude: chemLon,
              confidenceScore: 0.94,
              source: 'VOICE_TRANSCRIPT',
            },
          ],
        },
      },
      include: { reports: true, dispatches: true },
    });

    broadcastEvent(WS_EVENTS.INCIDENT_CREATED, incident);
    await NotificationsService.createNotification({
      incidentId: incident.id,
      type: 'INCIDENT_ALERT',
      title: `CRITICAL Fire: ${demoCode}`,
      message: 'Campus Chemical Building Fire detected! 12 people affected, 3 trapped.',
    });

    await AuditService.log({
      action: 'incident_created',
      entityType: 'INCIDENT',
      entityId: incident.id,
      metadata: { incidentCode: demoCode, scenario: 'Campus Chemical Building Fire' },
    });

    return res.status(201).json({
      success: true,
      message: 'Demo scenario initialized. Incident RQ-2026-0042 created with AI extraction.',
      data: incident,
    });
  } catch (error: any) {
    console.error('[Demo] Error running scenario:', error);
    return res.status(500).json({ success: false, message: 'Failed to trigger demo scenario.' });
  }
});

// Step 2: Simulate Duplicate Crowd Signal
demoRouter.post('/step-duplicate', async (_req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { incidentCode: 'RQ-2026-0042' },
      include: { reports: true },
    });

    if (!incident) {
      return res.status(404).json({ success: false, message: 'Run scenario first.' });
    }

    // Add duplicate report #2
    const report2 = await prisma.incidentReport.create({
      data: {
        incidentId: incident.id,
        text: 'Huge black smoke pouring from chemistry labs, 2nd floor windows! Send fire engines immediately!',
        latitude: incident.latitude + 0.0003,
        longitude: incident.longitude - 0.0002,
        confidenceScore: 0.96,
        source: 'MOBILE_APP',
      },
    });

    // Update confidence score to 0.98
    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: {
        confidenceScore: 0.98,
        affectedPeople: 14,
      },
      include: { reports: true, dispatches: true },
    });

    await NotificationsService.createNotification({
      incidentId: incident.id,
      type: 'DUPLICATE_REPORT',
      title: 'Duplicate Signal Fused (94% Match)',
      message: 'Second citizen report corroborates active fire on 2nd floor. Confidence elevated to 98%.',
    });

    await AuditService.log({
      action: 'incident_merged',
      entityType: 'INCIDENT',
      entityId: incident.id,
      metadata: { similarity: 94, duplicateReport: report2.text },
    });

    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updated, incident.id);
    broadcastEvent(WS_EVENTS.REPORT_RECEIVED, { incidentId: incident.id, isDuplicate: true });

    return res.json({
      success: true,
      message: 'Duplicate report fused into RQ-2026-0042. Confidence updated.',
      data: updated,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to simulate duplicate.' });
  }
});

// Step 3: Operator Verification
demoRouter.post('/step-verify', async (_req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({ where: { incidentCode: 'RQ-2026-0042' } });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: { status: IncidentStatus.VERIFIED },
      include: { reports: true, dispatches: true },
    });

    await AuditService.log({
      action: 'incident_verified',
      entityType: 'INCIDENT',
      entityId: incident.id,
      metadata: { operator: 'Commander Sarah Jenkins' },
    });

    await NotificationsService.createNotification({
      incidentId: incident.id,
      type: 'STATUS_UPDATE',
      title: 'Incident Verified by Command',
      message: 'Operator verified chemical fire report. Matching response teams.',
    });

    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updated, incident.id);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to verify incident.' });
  }
});

// Step 4: Dispatch Recommended Resources
demoRouter.post('/step-dispatch', async (_req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({ where: { incidentCode: 'RQ-2026-0042' } });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

    // Find Fire Team #02, Ambulance #04, and Medical Team #07
    const units = await prisma.resource.findMany({
      where: {
        OR: [
          { name: { contains: 'Fire Team #02' } },
          { name: { contains: 'Ambulance #04' } },
          { name: { contains: 'Medical Team #07' } },
          { type: 'FIRE_TEAM' },
          { type: 'AMBULANCE' },
          { type: 'MEDICAL_TEAM' },
        ],
      },
      take: 3,
    });

    const dispatches: any[] = [];
    for (const unit of units) {
      const d = await prisma.dispatch.create({
        data: {
          incidentId: incident.id,
          resourceId: unit.id,
          status: DispatchStatus.ASSIGNED,
          etaMinutes: 4,
          distanceKm: 1.4,
          notes: 'Emergency Code 3 Dispatch — Hazardous fire intervention',
        },
        include: { resource: true },
      });

      await prisma.resource.update({
        where: { id: unit.id },
        data: { status: ResourceStatus.ASSIGNED },
      });

      dispatches.push(d);
      broadcastEvent(WS_EVENTS.RESOURCE_ASSIGNED, { resourceId: unit.id });
      broadcastEvent(WS_EVENTS.DISPATCH_CREATED, d);
    }

    const updatedIncident = await prisma.incident.update({
      where: { id: incident.id },
      data: { status: IncidentStatus.RESPONDING },
      include: { reports: true, dispatches: { include: { resource: true } } },
    });

    await NotificationsService.createNotification({
      incidentId: incident.id,
      type: 'DISPATCH_ASSIGNED',
      title: '3 Units Dispatched: Fire #02, Amb #04, Med #07',
      message: 'Units en route with estimated arrival in 4-6 minutes.',
    });

    await AuditService.log({
      action: 'dispatch_created',
      entityType: 'INCIDENT',
      entityId: incident.id,
      metadata: { dispatchedUnits: units.map((u: any) => u.name) },
    });

    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updatedIncident, incident.id);

    return res.json({ success: true, incident: updatedIncident, dispatches });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to dispatch units.' });
  }
});

// Step 5: Responder Accepts and Arrives
demoRouter.post('/step-arrived', async (_req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { incidentCode: 'RQ-2026-0042' },
      include: { dispatches: true },
    });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

    for (const disp of incident.dispatches) {
      await prisma.dispatch.update({
        where: { id: disp.id },
        data: {
          status: DispatchStatus.ON_SCENE,
          arrivedAt: new Date(),
        },
      });

      await prisma.resource.update({
        where: { id: disp.resourceId },
        data: { status: ResourceStatus.ON_SCENE },
      });

      broadcastEvent(WS_EVENTS.RESPONDER_ARRIVED, { dispatchId: disp.id });
    }

    const updated = await prisma.incident.update({
      where: { id: incident.id },
      data: { status: IncidentStatus.ON_SCENE },
      include: { reports: true, dispatches: { include: { resource: true } } },
    });

    await NotificationsService.createNotification({
      incidentId: incident.id,
      type: 'STATUS_UPDATE',
      title: 'First Responders Active On Scene',
      message: 'Fire suppression in progress. Evacuation of 2nd floor initiated.',
    });

    await AuditService.log({
      action: 'responder_arrived',
      entityType: 'INCIDENT',
      entityId: incident.id,
      metadata: { message: 'Fire and Medic units on scene' },
    });

    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, updated, incident.id);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update to arrived.' });
  }
});

// Step 6: Incident Resolved
demoRouter.post('/step-resolve', async (_req: Request, res: Response) => {
  try {
    const incident = await prisma.incident.findUnique({
      where: { incidentCode: 'RQ-2026-0042' },
      include: { dispatches: true },
    });
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found.' });

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

    const resolved = await prisma.incident.update({
      where: { id: incident.id },
      data: {
        status: IncidentStatus.RESOLVED,
        resolvedAt: new Date(),
      },
      include: { reports: true, dispatches: { include: { resource: true } } },
    });

    await NotificationsService.createNotification({
      incidentId: incident.id,
      type: 'INCIDENT_RESOLVED',
      title: 'Incident RQ-2026-0042 Resolved',
      message: 'Chemical fire fully contained. All 14 individuals evacuated safely.',
    });

    await AuditService.log({
      action: 'incident_resolved',
      entityType: 'INCIDENT',
      entityId: incident.id,
      metadata: { peopleAssisted: 14, resolutionTimeMinutes: 18 },
    });

    broadcastEvent(WS_EVENTS.INCIDENT_RESOLVED, resolved, incident.id);
    broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, resolved, incident.id);

    return res.json({ success: true, message: 'Incident resolved successfully.', data: resolved });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to resolve demo incident.' });
  }
});
