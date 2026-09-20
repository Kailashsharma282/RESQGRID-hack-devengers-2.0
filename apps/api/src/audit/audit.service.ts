import { prisma } from '../prisma';
import { broadcastEvent } from '../events/websocket.gateway';
import { WS_EVENTS } from '@resqgrid/types';
import { safeJsonParse } from '../common/json';

export interface CreateAuditLogParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export class AuditService {
  static async log(params: CreateAuditLogParams) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: params.metadata ? (JSON.stringify(params.metadata) as any) : undefined,
        },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      broadcastEvent(WS_EVENTS.AUDIT_CREATED, {
        ...log,
        metadata: params.metadata || null,
      });

      return log;
    } catch (err) {
      console.error('[AuditService] Failed to create audit log:', err);
      return null;
    }
  }

  static async getRecentLogs(limit = 50) {
    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return logs.map((log) => ({
      ...log,
      metadata: safeJsonParse(log.metadata, null),
    }));
  }
}
