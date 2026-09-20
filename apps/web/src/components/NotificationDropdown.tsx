import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertCircle, Radio, Check } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket, WS_EVENTS } from '../lib/socket';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.data.filter((n: any) => !n.isRead).length);
      }
    } catch (e) {
      console.warn('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    loadNotifications();

    const socket = getSocket();
    const handleNew = (notif: any) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on(WS_EVENTS.NOTIFICATION_CREATED, handleNew);
    return () => {
      socket.off(WS_EVENTS.NOTIFICATION_CREATED, handleNew);
    };
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.warn('Failed to mark all as read');
    }
  };

  const markOneAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[1050]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-surface-card border border-slate-700/80 shadow-2xl z-[1100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-surface-200/50">
              <div className="flex items-center gap-2">
                <Radio size={16} className="text-red-400 animate-pulse" />
                <span className="font-semibold text-sm text-slate-200">Live Operation Alerts</span>
                {unreadCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">No notifications recorded</div>
              ) : (
                notifications.slice(0, 15).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3.5 transition-colors hover:bg-slate-800/40 flex items-start gap-3 ${
                      !notif.isRead ? 'bg-blue-950/20' : ''
                    }`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <AlertCircle
                        size={16}
                        className={
                          notif.type.includes('ALERT')
                            ? 'text-red-400'
                            : notif.type.includes('DISPATCH')
                            ? 'text-amber-400'
                            : notif.type.includes('RESOLVED')
                            ? 'text-emerald-400'
                            : 'text-blue-400'
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-200 truncate">{notif.title}</p>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                    {!notif.isRead && (
                      <button
                        onClick={(e) => markOneAsRead(notif.id, e)}
                        className="text-slate-500 hover:text-slate-300 p-1 rounded"
                        title="Mark read"
                      >
                        <Check size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
