import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Bell, 
  Check, 
  Trash2, 
  Loader2, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Calendar, 
  AlertTriangle, 
  RefreshCw 
} from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('All');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? res.data : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setActionLoading(true);
      await axios.put('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Maps notifications to Lucide icons
  const getIcon = (type) => {
    switch (type) {
      case 'Asset Assigned':
        return <Cpu className="text-brand-secondary" size={18} />;
      case 'Asset Returned':
        return <Check className="text-emerald-400" size={18} />;
      case 'Maintenance Approved':
        return <Activity className="text-brand-primary" size={18} />;
      case 'Booking Confirmed':
        return <Calendar className="text-indigo-400" size={18} />;
      case 'Transfer Approved':
        return <ShieldCheck className="text-purple-400" size={18} />;
      case 'Overdue Return':
        return <AlertTriangle className="text-brand-accent" size={18} />;
      default:
        return <Bell className="text-slate-400" size={18} />;
    }
  };

  // Filter list
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.isRead;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw size={24} className="animate-spin text-brand-secondary" />
          <span className="text-slate-400 text-sm">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh relative overflow-x-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-brand-primary/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-secondary/5 blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all border border-white/5 cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Notifications
            </span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-primary/10 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Mark All Read
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        
        {/* Title Block */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Inbox Notifications</h1>
            <p className="text-slate-400 text-xs mt-1">Receive system alerts, approval logs, and compliance messages.</p>
          </div>
          <div className="px-3 py-1.5 rounded-xl glass-accent text-xs font-bold text-brand-secondary border border-brand-secondary/15 flex items-center gap-2">
            <Bell size={14} className="animate-bounce" />
            {unreadCount} Unread
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
          {['All', 'Unread', 'Asset Assigned', 'Asset Returned', 'Maintenance Approved', 'Booking Confirmed', 'Transfer Approved', 'Overdue Return'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                filter === tab 
                  ? 'bg-brand-secondary/10 border-brand-secondary/30 text-brand-secondary' 
                  : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="glass p-12 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
            <Loader2 size={24} className="animate-spin text-brand-secondary" />
            <span className="text-slate-400 text-xs">Syncing notifications...</span>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="glass p-12 rounded-2xl border border-white/5 text-center text-slate-500 text-xs">
            No notifications in this filter category.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                className={`glass p-5 rounded-xl border flex gap-4 items-start transition-all cursor-pointer ${
                  notif.isRead 
                    ? 'border-white/5 opacity-70 hover:opacity-100' 
                    : 'border-brand-primary/20 bg-brand-primary/5 hover:bg-brand-primary/10 shadow-[0_0_15px_rgba(99,102,241,0.05)]'
                }`}
              >
                {/* Icon wrapper */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.isRead ? 'bg-white/5 text-slate-400' : 'bg-white/10 text-white'
                }`}>
                  {getIcon(notif.type)}
                </div>

                {/* Msg text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className={`text-xs font-semibold truncate ${notif.isRead ? 'text-slate-300' : 'text-white'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-normal">
                    {notif.message}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-primary shrink-0 mt-2 animate-pulse"></span>
                )}
              </div>
            ))}
          </div>
        )}

      </main>

    </div>
  );
}
