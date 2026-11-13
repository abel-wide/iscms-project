import { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useLanguage } from '../context/useLanguage';

export default function NotificationBell() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 1. Fetch notifications
  useEffect(() => {
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const res = await API.get('/notifications/my');
        if (!cancelled) {
          const data = res.data.notifications || res.data || [];
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // 2. Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Mark as read
  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  // 4. Mark all as read
  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* የማሳወቂያ ደወል */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">{t('notifications') || 'Notifications'}</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {t('markAllRead') || 'Mark all as read'}
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                {t('noNotifications') || 'No notifications'}
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => !n.isRead && markAsRead(n._id)}
                  className={`p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition ${
                    !n.isRead ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm ${!n.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                      {n.title}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      n.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      n.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {n.priority || 'normal'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}