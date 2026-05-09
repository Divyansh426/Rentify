import { useEffect, useState, useRef } from 'react';
import { Bell, CheckCheck, Home, IndianRupee, UserCheck, AlertCircle, X } from 'lucide-react';
import api from '../api/axios';

const iconMap = {
  rent_due:     { icon: IndianRupee, bg: '#fef9c3', color: '#a16207' },
  rent_paid:    { icon: CheckCheck,  bg: '#dcfce7', color: '#15803d' },
  rent_overdue: { icon: AlertCircle, bg: '#fee2e2', color: '#dc2626' },
  tenant_added: { icon: UserCheck,   bg: '#dbeafe', color: '#1d4ed8' },
  welcome:      { icon: Home,        bg: '#ede9fe', color: '#6d28d9' },
};

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('notifications/');
      setNotifications(data);
      setUnread(data.filter(n => !n.is_read).length);
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    await api.post('notifications/read-all/');
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnread(0);
  };

  const markRead = async (id) => {
    await api.patch(`notifications/${id}/read/`);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnread(prev => Math.max(0, prev - 1));
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl transition"
        style={{ color: 'rgba(255,255,255,0.8)', background: open ? 'rgba(255,255,255,0.15)' : 'transparent' }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
            style={{ background: '#ef4444', fontSize: '10px' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid #f1f5f9' }}>
            <h3 className="font-semibold text-gray-800 text-sm"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Notifications {unread > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: '#fee2e2', color: '#dc2626' }}>
                  {unread}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="text-xs font-medium transition"
                  style={{ color: 'var(--primary)' }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = iconMap[n.type] || iconMap.welcome;
                const Icon = config.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className="flex gap-3 px-4 py-3 cursor-pointer transition hover:bg-gray-50"
                    style={{
                      borderBottom: '1px solid #f8fafc',
                      background: n.is_read ? 'transparent' : '#fafbff',
                    }}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: config.bg }}>
                      <Icon size={14} color={config.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 leading-tight">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && (
                      <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                        style={{ background: 'var(--primary)' }} />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
