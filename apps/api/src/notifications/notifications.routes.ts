import { Router, Request, Response } from 'express';
import { NotificationsService } from './notifications.service';

export const notificationsRouter = Router();

notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { userId, limit } = req.query;
    const notifications = await NotificationsService.getNotifications(
      userId ? String(userId) : undefined,
      limit ? parseInt(String(limit), 10) : 30
    );
    return res.json({ success: true, data: notifications });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

notificationsRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await NotificationsService.markAsRead(id);
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
});

notificationsRouter.post('/read-all', async (_req: Request, res: Response) => {
  try {
    await NotificationsService.markAllAsRead();
    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
});
