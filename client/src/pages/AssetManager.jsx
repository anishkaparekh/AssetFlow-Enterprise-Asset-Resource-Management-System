import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft, Plus, Filter, MoreVertical, Loader2, ShieldAlert, 
  CheckCircle2, AlertCircle, Server, RefreshCw
} from 'lucide-react';

const STATUS_OPTIONS = [
  'Available',
  'Allocated',
  'Reserved',
  'Under Maintenance',
  'Lost',
  'Retired',
  'Disposed'
];

const CATEGORIES = [
  'Laptops',
  'Servers',
  'Networking',
  'Mobile Devices',
  'Monitors',
  'Peripherals',
  'Other'
];

export default function AssetManager() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [form, setForm] = useState({ assetTag: '', name: '', category: CATEGORIES[0] });
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      
      const res = await axios.get(`/api/assets?${queryParams.toString()}`);
      setAssets(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err.response?.data?.message || 'Failed to fetch assets.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user && (user.role === 'Admin' || user.role === 'Asset Manager')) {
      fetchAssets();
    }
  }, [fetchAssets, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.assetTag || !form.name || !form.category) {
      setError('Please fill in all fields.');
      return;
    }
    
    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);
    
    try {
      const res = await axios.post('/api/assets', form);
      setSuccessMsg(res.data.message || 'Asset registered successfully!');
      setForm({ assetTag: '', name: '', category: CATEGORIES[0] });
      fetchAssets();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error registering asset:', err);
      setError(err.response?.data?.message || 'Failed to register asset.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setActiveMenuId(null);
    try {
      await axios.put(`/api/assets/${id}/status`, { status: newStatus });
      setSuccessMsg(`Asset status updated to '${newStatus}'`);
      fetchAssets();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const isAuthorized = user && (user.role === 'Admin' || user.role === 'Asset Manager');

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

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-dark-950 bg-mesh flex items-center justify-center px-6 relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-primary/5 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-brand-secondary/5 blur-[100px] pointer-events-none"></div>
        
        <div className="glass max-w-md w-full p-8 rounded-2xl border border-red-500/10 text-center relative z-10">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">
            Your account ({user.role}) does not have permissions to access the Asset Engine portal. Please contact your system administrator if this is an error.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold text-white border border-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Allocated':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'Reserved':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Under Maintenance':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Lost':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Retired':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      case 'Disposed':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh relative overflow-x-hidden pb-16">
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none"></div>

      <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/5 cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="h-6 w-px bg-white/10"></div>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              Asset<span className="text-brand-secondary">Manager</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
              Role: <span className="text-brand-secondary font-semibold">{user.role}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {error && (
          <div className="glass p-4 rounded-xl border border-red-500/20 bg-red-950/20 flex items-start gap-3 mb-6 animate-pulse-slow">
            <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div className="text-sm text-red-200">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="glass p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex items-start gap-3 mb-6">
            <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-200">{successMsg}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
              <h2 className="font-display text-lg font-bold text-white mb-1">Register New Asset</h2>
              <p className="text-xs text-slate-400 mb-6">Create a unique inventory tag for tracking hardware.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="assetTag" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Asset Tag / Serial Number
                  </label>
                  <input
                    id="assetTag"
                    type="text"
                    required
                    placeholder="e.g. AF-LAP-2026-004"
                    value={form.assetTag}
                    onChange={(e) => setForm({ ...form, assetTag: e.target.value.toUpperCase() })}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-all font-mono"
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Asset Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="e.g. MacBook Pro M4 Max"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                    Asset Category
                  </label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-dark-950 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-brand-primary/20"
                >
                  {submitLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Register Asset</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="glass p-6 rounded-2xl border border-white/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-lg font-bold text-white mb-0.5">Asset Directory</h2>
                  <p className="text-xs text-slate-400">Total items: {assets.length}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                    <Filter size={12} />
                    <span>Filters:</span>
                  </div>

                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-dark-950 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status} className="bg-dark-950 text-white">
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="w-full overflow-x-auto rounded-xl border border-white/5">
                {loading ? (
                  <div className="py-16 flex flex-col items-center justify-center gap-3">
                    <Loader2 size={32} className="animate-spin text-brand-secondary" />
                    <span className="text-slate-400 text-sm">Loading assets from secure vault...</span>
                  </div>
                ) : assets.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 text-slate-400">
                      <Server size={20} />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">No assets found</p>
                    <p className="text-xs text-slate-500 mt-1">Try modifying your query filters or register a new hardware device.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                        <th className="py-3.5 px-4">Asset Code</th>
                        <th className="py-3.5 px-4">Name</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                      {assets.map((asset) => (
                        <tr key={asset._id} className="hover:bg-white/1 transition-all group">
                          <td className="py-4 px-4 font-mono font-semibold text-white select-all text-xs">{asset.assetTag}</td>
                          <td className="py-4 px-4 font-medium text-slate-100">{asset.name}</td>
                          <td className="py-4 px-4 text-slate-400 text-xs">{asset.category}</td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide whitespace-nowrap ${getStatusBadge(asset.status)}`}>
                              {asset.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === asset._id ? null : asset._id);
                              }}
                              className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>

                            {activeMenuId === asset._id && (
                              <div
                                ref={menuRef}
                                className="absolute right-4 mt-1 w-48 rounded-xl bg-dark-900 border border-white/10 shadow-2xl py-1.5 z-50 text-left"
                              >
                                <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1">
                                  Modify Status
                                </div>
                                {STATUS_OPTIONS.map((status) => {
                                  if (status === asset.status) return null;
                                  return (
                                    <button
                                      key={status}
                                      onClick={() => handleStatusUpdate(asset._id, status)}
                                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-brand-primary/10 hover:text-white transition-all cursor-pointer"
                                    >
                                      Mark as {status}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
