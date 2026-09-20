import { prisma } from '../prisma';
import { broadcastEvent } from '../events/websocket.gateway';
import { WS_EVENTS } from '@resqgrid/types';

export class NotificationsService {
  static async createNotification(params: {
    userId?: string | null;
    incidentId?: string | null;
    type: string;
    title: string;
    message: string;
  }) {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId || null,
        incidentId: params.incidentId || null,
        type: params.type,
        title: params.title,
        message: params.message,
      },
    });

    broadcastEvent(WS_EVENTS.NOTIFICATION_CREATED, notification, params.incidentId || undefined);
    return notification;
  }

  static async getNotifications(userId?: string, limit = 30) {
    return prisma.notification.findMany({
      where: userId ? { OR: [{ userId }, { userId: null }] } : undefined,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        incident: {
          select: { id: true, incidentCode: true, title: true, severity: true },
        },
      },
    });
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead() {
    return prisma.notification.updateMany({
      data: { isRead: true },
    });
  }
}
