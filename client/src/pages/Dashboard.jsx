import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Layers, User, Mail, Shield, ShieldCheck, Database, Server, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

  // Determine badge styling based on user role
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Asset Manager':
        return 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20';
      case 'Department Head':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh relative overflow-x-hidden">
      
      {/* Glow Orbs */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-primary/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-secondary/5 blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-bold">
              <Layers size={16} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Asset<span className="text-brand-secondary">Flow</span>
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Welcome Banner */}
        <div className="glass p-8 rounded-2xl border border-white/5 mb-8 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-brand-primary/5 to-transparent pointer-events-none"></div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back, {user.name}!</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            You are logged into the AssetFlow enterprise panel. Below are your account credentials and system authorization permissions.
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* User Profile */}
          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 mb-4">
                <User size={20} />
              </div>
              <h3 className="font-semibold text-white mb-1">User Profile</h3>
              <p className="text-xs text-slate-400 mb-4">Your registered user name</p>
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-2">{user.name}</div>
          </div>

          {/* Email Address */}
          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 mb-4">
                <Mail size={20} />
              </div>
              <h3 className="font-semibold text-white mb-1">Registered Email</h3>
              <p className="text-xs text-slate-400 mb-4">Email used for communication</p>
            </div>
            <div className="text-sm font-semibold text-slate-200 mt-2 truncate font-mono">{user.email}</div>
          </div>

          {/* Authorization Role */}
          <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 mb-4">
                <Shield size={20} />
              </div>
              <h3 className="font-semibold text-white mb-1">System Authorization</h3>
              <p className="text-xs text-slate-400 mb-4">Role-based access permissions</p>
            </div>
            <div className="mt-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadge(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>

        </div>

        {/* Asset Management Portal Access */}
        {(user.role === 'Admin' || user.role === 'Asset Manager') && (
          <div className="glass-accent p-6 rounded-2xl border border-brand-primary/20 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Database size={20} className="text-brand-secondary" />
                <h3 className="font-semibold text-white font-display text-lg">Asset Engine Portal</h3>
              </div>
              <p className="text-sm text-slate-400 max-w-xl">
                As an authorized {user.role}, you have access to register new hardware assets, view the complete inventory directory, and modify their lifecycle states.
              </p>
            </div>
            <button
              onClick={() => navigate('/assets')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-lg hover:shadow-brand-primary/20 shrink-0 cursor-pointer"
            >
              Manage Assets
            </button>
          </div>
        )}

        {/* API Details Panel */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Server size={18} className="text-brand-secondary" />
            <h3 className="font-semibold text-white">Secure Session Metadata</h3>
          </div>
          <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5 font-mono text-xs text-slate-400 space-y-2 overflow-x-auto">
            <div><span className="text-slate-500">API Endpoint:</span> http://localhost:5000/api/auth/me</div>
            <div><span className="text-slate-500">User ID:</span> {user._id}</div>
            <div><span className="text-slate-500">Session Role:</span> {user.role}</div>
            <div><span className="text-slate-500">Token Status:</span> <span className="text-emerald-400 font-semibold">Active (24h JWT)</span></div>
          </div>
        </div>

      </main>

    </div>
  );
}
