import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bell, 
  TrendingUp, 
  AlertTriangle,
  Check,
  CheckCheck,
  Loader2
} from 'lucide-react';
import { notificationsAPI } from '../services/api';
import { format, formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getAll();
      setNotifications(res.data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'price_rise':
        return <TrendingUp size={20} className="text-green-600" />;
      case 'high_demand':
        return <AlertTriangle size={20} className="text-yellow-600" />;
      default:
        return <Bell size={20} className="text-blue-600" />;
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="text-primary-600" />
          {t('notifications.title')}
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-sm px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <CheckCheck size={18} />
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t('common.all')}
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t('notifications.unread')}
        </button>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`card cursor-pointer transition-all hover:shadow-md ${
                !notification.isRead ? 'border-l-4 border-l-primary-500' : ''
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  handleMarkAsRead(notification.id);
                }
                if (notification.marketName) {
                  // Could navigate to market
                }
              }}
            >
              <div className="flex gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg h-fit">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className={`font-semibold ${!notification.isRead ? '' : 'text-gray-600 dark:text-gray-400'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title={t('notifications.markAsRead')}
                      >
                        <Check size={16} className="text-primary-600" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <span>
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                    {notification.marketName && (
                      <>
                        <span>•</span>
                        <span>{notification.marketName}</span>
                      </>
                    )}
                    {notification.cropName && (
                      <>
                        <span>•</span>
                        <span>{notification.cropName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Bell size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('notifications.noNotifications')}</h3>
          <p className="text-gray-500">
            {filter === 'unread' 
              ? t('notifications.allCaughtUp')
              : t('notifications.alertsInfo')}
          </p>
        </div>
      )}
    </div>
  );
}
