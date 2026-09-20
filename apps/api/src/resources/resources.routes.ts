import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { calculateHaversineDistance } from '../deduplication/deduplication.service';
import { broadcastEvent } from '../events/websocket.gateway';
import { WS_EVENTS, ResourceStatus, ResourceType } from '@resqgrid/types';
import { safeJsonParse } from '../common/json';

export const resourcesRouter = Router();

// GET /api/resources - List all resources with optional filters
resourcesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { type, status, organization } = req.query;

    const where: any = {};
    if (type) where.type = String(type);
    if (status) where.status = String(status);
    if (organization) where.organization = { contains: String(organization) };

    const resources = await prisma.resource.findMany({
      where,
      orderBy: [{ status: 'asc' }, { type: 'asc' }],
      include: {
        dispatches: {
          where: { status: { in: ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SCENE'] } },
          include: { incident: { select: { id: true, incidentCode: true, title: true, severity: true } } },
        },
      },
    });

    const parsed = resources.map((r: any) => ({
      ...r,
      capabilities: safeJsonParse(r.capabilities, []),
      metadata: safeJsonParse(r.metadata, null),
    }));

    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch resources.' });
  }
});

// GET /api/resources/nearby - Find resources within radius
resourcesRouter.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lon, radiusKm = '10', type } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ success: false, message: 'lat and lon are required.' });
    }

    const latitude = parseFloat(String(lat));
    const longitude = parseFloat(String(lon));
    const radius = parseFloat(String(radiusKm));

    const where: any = {};
    if (type) where.type = String(type);

    const resources = await prisma.resource.findMany({
      where,
      include: {
        dispatches: {
          where: { status: { in: ['ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ON_SCENE'] } },
        },
      },
    });

    const nearby = resources
      .map((r: any) => {
        const distanceKm = calculateHaversineDistance(latitude, longitude, r.latitude, r.longitude);
        return {
          ...r,
          capabilities: safeJsonParse(r.capabilities, []),
          metadata: safeJsonParse(r.metadata, null),
          distanceKm,
          etaMinutes: Math.max(2, Math.round((distanceKm / 40) * 60 + 2)),
        };
      })
      .filter((r: any) => r.distanceKm <= radius)
      .sort((a: any, b: any) => a.distanceKm - b.distanceKm);

    return res.json({ success: true, data: nearby });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to query nearby resources.' });
  }
});

// POST /api/resources - Create resource
resourcesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, capacity = 1, latitude, longitude, organization, contact, capabilities = [] } = req.body;

    const resource = await prisma.resource.create({
      data: {
        name,
        type: type || ResourceType.AMBULANCE,
        status: ResourceStatus.AVAILABLE,
        capacity: parseInt(String(capacity), 10),
        latitude: parseFloat(String(latitude)),
        longitude: parseFloat(String(longitude)),
        organization: organization || 'Metro Emergency Services',
        contact: contact || '+1 (555) 019-2831',
        capabilities: JSON.stringify(capabilities),
      },
    });

    broadcastEvent(WS_EVENTS.RESOURCE_UPDATED, resource);

    return res.status(201).json({ success: true, data: resource });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to create resource.' });
  }
});

// PATCH /api/resources/:id - Update resource status or position
resourcesRouter.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, latitude, longitude, contact, capacity } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (latitude !== undefined) data.latitude = parseFloat(String(latitude));
    if (longitude !== undefined) data.longitude = parseFloat(String(longitude));
    if (contact) data.contact = contact;
    if (capacity !== undefined) data.capacity = parseInt(String(capacity), 10);

    const updated = await prisma.resource.update({
      where: { id },
      data,
    });

    broadcastEvent(WS_EVENTS.RESOURCE_UPDATED, updated);

    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to update resource.' });
  }
});
