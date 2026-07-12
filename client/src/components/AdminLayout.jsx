import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Building2, Tags, Users, Shield, Laptop, 
  BarChart3, LogOut, Settings, Bell, Activity
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { id: 'departments', label: 'Departments', path: '/admin/departments', icon: Building2 },
    { id: 'categories', label: 'Asset Categories', path: '/admin/categories', icon: Tags },
    { id: 'directory', label: 'Employee Directory', path: '/admin/directory', icon: Users },
    { id: 'role-management', label: 'Role Management', path: '/admin/role-management', icon: Shield },
    { id: 'assets', label: 'Assets', path: '/admin/assets', icon: Laptop },
    { id: 'reports', label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-dark-950 flex relative overflow-hidden">
      
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none"></div>

      {/* 1. SIDEBAR */}
      <aside className="w-64 glass border-r border-white/5 flex flex-col justify-between z-20 shrink-0 sticky top-0 h-screen font-sans">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold">
              <Shield size={16} />
            </div>
            <span className="font-display text-xl font-bold text-white tracking-tight">
              Asset<span className="text-brand-secondary">Flow Admin</span>
            </span>
          </div>

          {/* Nav Items */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2 px-2 py-3 mb-2">
            <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
              {(user?.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user?.name || 'System Administrator'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email || 'admin@assetflow.com'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 hover:border-red-500/40 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut size={12} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-dark-950/40 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <Activity size={14} className="text-brand-secondary animate-pulse" />
            <span className="text-xs text-slate-400 font-mono">System Status: <span className="text-emerald-400 font-bold">Online</span></span>
          </div>
          
          <div className="flex items-center gap-5">
            {/* Notifications Bell */}
            <button className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all cursor-pointer">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-brand-primary rounded-full"></span>
            </button>

            {/* Profile menu details */}
            <div className="flex items-center gap-3 pl-4 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white leading-tight">{user?.name || 'System Administrator'}</div>
                <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">{user?.role || 'Admin'}</div>
              </div>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold text-sm shadow-md shadow-brand-primary/10">
                {(user?.name || 'Admin').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </main>
      </div>

    </div>
  );
}
