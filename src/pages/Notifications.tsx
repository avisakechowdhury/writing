import React, { useEffect, useState } from 'react';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { notificationsAPI } from '../services/api';
import { AppNotification } from '../types';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getList(1, 10);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    const destination = notification.url || '/notifications';

    if (!notification.isRead) {
      await handleMarkRead(notification._id);
    }

    if (destination !== '/notifications') {
      navigate(destination);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await notificationsAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map((item) =>
          item._id === notificationId ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {
      toast.error('Failed to update notification');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notifications:updated'));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-neutral-600">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl shadow-soft border border-neutral-200 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
              <p className="text-sm text-neutral-600">
                {unreadCount} unread
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-10 text-center text-neutral-500">No notifications yet.</div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {notifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                onClick={() => void handleNotificationClick(notification)}
                className={`w-full text-left p-5 transition-colors hover:bg-neutral-50 ${notification.isRead ? 'bg-white' : 'bg-primary-50/40'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900">{notification.title}</p>
                    <p className="text-neutral-700 text-sm mt-1">{notification.body}</p>
                    <div className="mt-2 flex items-center space-x-2 text-xs text-neutral-500">
                      <Clock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {!notification.isRead && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-primary-100 text-primary-700">
                      Unread
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;

