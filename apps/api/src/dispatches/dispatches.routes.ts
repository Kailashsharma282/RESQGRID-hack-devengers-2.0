import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { broadcastEvent } from '../events/websocket.gateway';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WS_EVENTS, DispatchStatus, ResourceStatus, IncidentStatus } from '@resqgrid/types';

export const dispatchesRouter = Router();

// GET /api/dispatches - List all dispatches
dispatchesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, resourceId, incidentId } = req.query;

    const where: any = {};
    if (status) where.status = String(status);
    if (resourceId) where.resourceId = String(resourceId);
    if (incidentId) where.incidentId = String(incidentId);

    const dispatches = await prisma.dispatch.findMany({
      where,
      orderBy: { assignedAt: 'desc' },
      include: {
        incident: true,
        resource: true,
        assigner: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, data: dispatches });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dispatches.' });
  }
});

// PATCH /api/dispatches/:id/status - Update dispatch status (Responder workflow)
dispatchesRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, responderNotes } = req.body;

    const current = await prisma.dispatch.findUnique({
      where: { id },
      include: { incident: true, resource: true },
    });

    if (!current) {
      return res.status(404).json({ success: false, message: 'Dispatch not found.' });
    }

    const data: any = { status };
    if (responderNotes) data.notes = responderNotes;

    let resourceStatus = current.resource.status;
    let incidentStatus = current.incident.status;

    if (status === DispatchStatus.ACCEPTED) {
      data.acceptedAt = new Date();
      broadcastEvent(WS_EVENTS.RESPONDER_ACCEPTED, { dispatchId: id, resourceId: current.resourceId });
      await AuditService.log({
        action: 'responder_accepted',
        entityType: 'DISPATCH',
        entityId: id,
        metadata: { resourceName: current.resource.name, incidentCode: current.incident.incidentCode },
      });
      await NotificationsService.createNotification({
        incidentId: current.incidentId,
        type: 'STATUS_UPDATE',
        title: `${current.resource.name} Accepted Assignment`,
        message: `Unit confirmed dispatch to ${current.incident.title}. Preparing departure.`,
      });
    } else if (status === DispatchStatus.EN_ROUTE) {
      resourceStatus = ResourceStatus.EN_ROUTE;
      await prisma.resource.update({ where: { id: current.resourceId }, data: { status: resourceStatus } });
      broadcastEvent(WS_EVENTS.RESOURCE_UPDATED, { id: current.resourceId, status: resourceStatus });
    } else if (status === DispatchStatus.ON_SCENE) {
      data.arrivedAt = new Date();
      resourceStatus = ResourceStatus.ON_SCENE;
      incidentStatus = IncidentStatus.ON_SCENE;

      await prisma.resource.update({ where: { id: current.resourceId }, data: { status: resourceStatus } });
      await prisma.incident.update({ where: { id: current.incidentId }, data: { status: incidentStatus } });

      broadcastEvent(WS_EVENTS.RESPONDER_ARRIVED, { dispatchId: id, resourceId: current.resourceId });
      broadcastEvent(WS_EVENTS.RESOURCE_UPDATED, { id: current.resourceId, status: resourceStatus });
      broadcastEvent(WS_EVENTS.INCIDENT_UPDATED, { id: current.incidentId, status: incidentStatus });

      await AuditService.log({
        action: 'responder_arrived',
        entityType: 'DISPATCH',
        entityId: id,
        metadata: { resourceName: current.resource.name, incidentCode: current.incident.incidentCode },
      });
      await NotificationsService.createNotification({
        incidentId: current.incidentId,
        type: 'STATUS_UPDATE',
        title: `${current.resource.name} Arrived On Scene`,
        message: `First responders are active on scene at ${current.incident.address}.`,
      });
    } else if (status === DispatchStatus.COMPLETED) {
      data.completedAt = new Date();
      resourceStatus = ResourceStatus.AVAILABLE;
      await prisma.resource.update({ where: { id: current.resourceId }, data: { status: resourceStatus } });
      broadcastEvent(WS_EVENTS.RESOURCE_UPDATED, { id: current.resourceId, status: resourceStatus });
    }

    const updated = await prisma.dispatch.update({
      where: { id },
      data,
      include: { incident: true, resource: true },
    });

    broadcastEvent(WS_EVENTS.DISPATCH_UPDATED, updated);

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[Dispatches] Error updating dispatch status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update dispatch status.' });
  }
});
