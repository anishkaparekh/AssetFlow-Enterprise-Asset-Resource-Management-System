import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft, Plus, Filter, MoreVertical, Loader2, ShieldAlert, 
  CheckCircle2, AlertCircle, Server, RefreshCw, ClipboardList, 
  Shuffle, Calendar, Check, X, Layers
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
  
  const [activeTab, setActiveTab] = useState('inventory');
  
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnAllocId, setReturnAllocId] = useState(null);
  const [returnCondition, setReturnCondition] = useState('');

  const [assetForm, setAssetForm] = useState({ assetTag: '', name: '', category: CATEGORIES[0] });
  const [allocForm, setAllocForm] = useState({ assetId: '', employeeId: '', expectedReturnDate: '' });
  const [transferForm, setTransferForm] = useState({ assetId: '', targetHolderId: '', requestReason: '' });
  const [bookingForm, setBookingForm] = useState({ assetId: '', employeeId: '', startTime: '', endTime: '' });
  
  const [filters, setFilters] = useState({ status: '', category: '' });

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
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      
      const res = await axios.get(`/api/assets?${queryParams.toString()}`);
      setAssets(res.data);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError(err.response?.data?.message || 'Failed to fetch assets.');
    }
  }, [filters]);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchAllocations = async () => {
    try {
      const res = await axios.get('/api/allocations');
      setAllocations(res.data);
    } catch (err) {
      console.error('Error fetching allocations:', err);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await axios.get('/api/transfers');
      setTransfers(res.data);
    } catch (err) {
      console.error('Error fetching transfers:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('/api/bookings');
      setBookings(res.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  const loadTabContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'inventory') {
        await fetchAssets();
      } else if (activeTab === 'allocations') {
        await Promise.all([fetchAssets(), fetchUsers(), fetchAllocations()]);
      } else if (activeTab === 'transfers') {
        await Promise.all([fetchAssets(), fetchUsers(), fetchTransfers()]);
      } else if (activeTab === 'bookings') {
        await Promise.all([fetchAssets(), fetchUsers(), fetchBookings()]);
      }
    } catch (err) {
      setError('Failed to load page modules.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchAssets]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'asset_manager')) {
      loadTabContent();
    }
  }, [activeTab, filters, user, loadTabContent]);

  const handleAssetRegister = async (e) => {
    e.preventDefault();
    if (!assetForm.assetTag || !assetForm.name || !assetForm.category) {
      setError('All fields are required.');
      return;
    }
    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await axios.post('/api/assets', assetForm);
      setSuccessMsg('Asset registered successfully!');
      setAssetForm({ assetTag: '', name: '', category: CATEGORIES[0] });
      await fetchAssets();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register asset.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAssetAllocate = async (e) => {
    e.preventDefault();
    if (!allocForm.assetId || !allocForm.employeeId || !allocForm.expectedReturnDate) {
      setError('All fields are required.');
      return;
    }
    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await axios.post('/api/allocations', allocForm);
      setSuccessMsg('Asset allocated successfully!');
      setAllocForm({ assetId: '', employeeId: '', expectedReturnDate: '' });
      await Promise.all([fetchAssets(), fetchAllocations()]);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate asset.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleAssetTransferRequest = async (e) => {
    e.preventDefault();
    if (!transferForm.assetId || !transferForm.targetHolderId || !transferForm.requestReason) {
      setError('All fields are required.');
      return;
    }
    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await axios.post('/api/transfers', transferForm);
      setSuccessMsg('Transfer request submitted successfully!');
      setTransferForm({ assetId: '', targetHolderId: '', requestReason: '' });
      await fetchTransfers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit transfer request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResourceBook = async (e) => {
    e.preventDefault();
    if (!bookingForm.assetId || !bookingForm.employeeId || !bookingForm.startTime || !bookingForm.endTime) {
      setError('All fields are required.');
      return;
    }
    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await axios.post('/api/bookings', bookingForm);
      setSuccessMsg('Resource booked successfully!');
      setBookingForm({ assetId: '', employeeId: '', startTime: '', endTime: '' });
      await fetchBookings();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book resource.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    setActiveMenuId(null);
    try {
      await axios.put(`/api/assets/${id}/status`, { status: newStatus });
      setSuccessMsg(`Asset status updated to '${newStatus}'`);
      await fetchAssets();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const triggerReturnAsset = (allocId) => {
    setReturnAllocId(allocId);
    setReturnCondition('');
    setShowReturnModal(true);
  };

  const submitReturnAsset = async () => {
    if (!returnAllocId) return;
    try {
      await axios.put(`/api/allocations/${returnAllocId}/return`, { returnCondition });
      setSuccessMsg('Asset returned successfully!');
      setShowReturnModal(false);
      await Promise.all([fetchAssets(), fetchAllocations()]);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process return.');
    }
  };

  const handleTransferApproval = async (id, action) => {
    try {
      await axios.put(`/api/transfers/${id}/action`, { action });
      setSuccessMsg(`Transfer request ${action.toLowerCase()}d successfully!`);
      await Promise.all([fetchAssets(), fetchTransfers()]);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process transfer.');
    }
  };

  const handleBookingCancel = async (id) => {
    try {
      await axios.put(`/api/bookings/${id}/cancel`);
      setSuccessMsg('Booking cancelled successfully!');
      await fetchBookings();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const isAuthorized = user && (user.role === 'admin' || user.role === 'asset_manager');

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
      case 'Available': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Allocated': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'Reserved': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Under Maintenance': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Lost': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Retired': return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      case 'Disposed': return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const getBookingStatusBadge = (status) => {
    switch (status) {
      case 'Upcoming': return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Ongoing': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Completed': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
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
              Asset<span className="text-brand-secondary">Flow ERP</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
              Role: <span className="text-brand-secondary font-semibold">{user.role}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-8">
        <div className="flex items-center gap-2 border-b border-white/5 p-1 bg-white/2 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'inventory' ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Layers size={14} />
            <span>Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('allocations')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'allocations' ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <ClipboardList size={14} />
            <span>Allocations & Returns</span>
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'transfers' ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Shuffle size={14} />
            <span>Transfers</span>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === 'bookings' ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
          >
            <Calendar size={14} />
            <span>Bookings</span>
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="glass p-4 rounded-xl border border-red-500/20 bg-red-950/20 flex items-start gap-3 mb-6">
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

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-brand-secondary" />
            <span className="text-slate-400 text-sm">Loading secure data module...</span>
          </div>
        ) : (
          <>
            {activeTab === 'inventory' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                    <h2 className="font-display text-lg font-bold text-white mb-1">Register New Asset</h2>
                    <p className="text-xs text-slate-400 mb-6 font-sans">Enter detailed hardware details to track.</p>
                    <form onSubmit={handleAssetRegister} className="space-y-5">
                      <div>
                        <label htmlFor="assetTag" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Asset Tag / Serial Number</label>
                        <input
                          id="assetTag"
                          type="text"
                          required
                          placeholder="e.g. AF-LAP-2026-004"
                          value={assetForm.assetTag}
                          onChange={(e) => setAssetForm({ ...assetForm, assetTag: e.target.value.toUpperCase() })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="name" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Asset Name</label>
                        <input
                          id="name"
                          type="text"
                          required
                          placeholder="e.g. MacBook Pro M4 Max"
                          value={assetForm.name}
                          onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="category" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Asset Category</label>
                        <select
                          id="category"
                          value={assetForm.category}
                          onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="bg-dark-950 text-white">{cat}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                      >
                        {submitLoading ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /><span>Register Asset</span></>}
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
                        <select
                          value={filters.category}
                          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                          className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary transition-all cursor-pointer font-sans"
                        >
                          <option value="">All Categories</option>
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="bg-dark-950 text-white">{cat}</option>
                          ))}
                        </select>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                          className="bg-dark-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-primary transition-all cursor-pointer font-sans"
                        >
                          <option value="">All Statuses</option>
                          {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status} className="bg-dark-950 text-white">{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="w-full overflow-x-auto rounded-xl border border-white/5">
                      {assets.length === 0 ? (
                        <div className="py-16 text-center">
                          <p className="text-sm font-semibold text-slate-300">No assets found</p>
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
                                <td className="py-4 px-4 font-mono font-semibold text-white text-xs">{asset.assetTag}</td>
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
                                    <div ref={menuRef} className="absolute right-4 mt-1 w-48 rounded-xl bg-dark-900 border border-white/10 shadow-2xl py-1.5 z-50 text-left">
                                      <div className="px-3 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-white/5 mb-1">Modify Status</div>
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
            )}

            {activeTab === 'allocations' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                    <h2 className="font-display text-lg font-bold text-white mb-1">Allocate Hardware</h2>
                    <p className="text-xs text-slate-400 mb-6">Assign an available asset to a team member.</p>
                    <form onSubmit={handleAssetAllocate} className="space-y-5">
                      <div>
                        <label htmlFor="allocAsset" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Select Available Asset</label>
                        <select
                          id="allocAsset"
                          value={allocForm.assetId}
                          onChange={(e) => setAllocForm({ ...allocForm, assetId: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer font-sans"
                          required
                        >
                          <option value="">-- Choose Asset --</option>
                          {assets.filter(a => a.status === 'Available').map(a => (
                            <option key={a._id} value={a._id} className="bg-dark-950 text-white font-mono">{a.assetTag} - {a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="allocUser" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Select Employee</label>
                        <select
                          id="allocUser"
                          value={allocForm.employeeId}
                          onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer font-sans"
                          required
                        >
                          <option value="">-- Choose Employee --</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id} className="bg-dark-950 text-white">{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="allocReturn" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Expected Return Date</label>
                        <input
                          id="allocReturn"
                          type="date"
                          required
                          value={allocForm.expectedReturnDate}
                          onChange={(e) => setAllocForm({ ...allocForm, expectedReturnDate: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-lg font-sans"
                      >
                        {submitLoading ? <Loader2 size={16} className="animate-spin" /> : <><span>Assign Allocation</span></>}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="glass p-6 rounded-2xl border border-white/5">
                    <h2 className="font-display text-lg font-bold text-white mb-6">Allocation History & Returns</h2>
                    <div className="w-full overflow-x-auto rounded-xl border border-white/5 font-sans">
                      {allocations.length === 0 ? (
                        <div className="py-16 text-center">
                          <p className="text-sm font-semibold text-slate-400">No allocations registered</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                              <th className="py-3.5 px-4">Asset Tag</th>
                              <th className="py-3.5 px-4">Employee</th>
                              <th className="py-3.5 px-4">Expected Return</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                            {allocations.map((alloc) => (
                              <tr key={alloc._id} className="hover:bg-white/1 transition-all">
                                <td className="py-4 px-4 font-mono font-semibold text-white text-xs">{alloc.assetId?.assetTag || 'N/A'}</td>
                                <td className="py-4 px-4 font-medium text-slate-100">{alloc.employeeId?.name || 'Unknown'}</td>
                                <td className="py-4 px-4 text-xs text-slate-400">{new Date(alloc.expectedReturnDate).toLocaleDateString()}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${alloc.status === 'Active' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                    {alloc.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  {alloc.status === 'Active' ? (
                                    <button
                                      onClick={() => triggerReturnAsset(alloc._id)}
                                      className="px-3 py-1 rounded bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-400 border border-white/5 hover:border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer"
                                    >
                                      Return
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-500 italic">Returned ({alloc.returnCondition})</span>
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
            )}

            {activeTab === 'transfers' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                    <h2 className="font-display text-lg font-bold text-white mb-1">Request Transfer</h2>
                    <p className="text-xs text-slate-400 mb-6 font-sans">Transfer an allocated asset directly to another user.</p>
                    <form onSubmit={handleAssetTransferRequest} className="space-y-5 font-sans">
                      <div>
                        <label htmlFor="transAsset" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Select Allocated Asset</label>
                        <select
                          id="transAsset"
                          value={transferForm.assetId}
                          onChange={(e) => setTransferForm({ ...transferForm, assetId: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                          required
                        >
                          <option value="">-- Choose Asset --</option>
                          {assets.filter(a => a.status === 'Allocated').map(a => (
                            <option key={a._id} value={a._id} className="bg-dark-950 text-white font-mono">{a.assetTag} - {a.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="transTarget" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Target Recipient</label>
                        <select
                          id="transTarget"
                          value={transferForm.targetHolderId}
                          onChange={(e) => setTransferForm({ ...transferForm, targetHolderId: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                          required
                        >
                          <option value="">-- Choose Employee --</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id} className="bg-dark-950 text-white">{u.name} ({u.role})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="transReason" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Reason for Transfer</label>
                        <textarea
                          id="transReason"
                          rows={3}
                          required
                          placeholder="Explain why this transfer is needed..."
                          value={transferForm.requestReason}
                          onChange={(e) => setTransferForm({ ...transferForm, requestReason: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                      >
                        {submitLoading ? <Loader2 size={16} className="animate-spin" /> : <><span>Submit Transfer Request</span></>}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="glass p-6 rounded-2xl border border-white/5">
                    <h2 className="font-display text-lg font-bold text-white mb-6">Transfer Requests Board</h2>
                    <div className="w-full overflow-x-auto rounded-xl border border-white/5">
                      {transfers.length === 0 ? (
                        <div className="py-16 text-center">
                          <p className="text-sm font-semibold text-slate-400">No transfer requests pending</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse font-sans">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                              <th className="py-3.5 px-4">Asset</th>
                              <th className="py-3.5 px-4">Current Holder</th>
                              <th className="py-3.5 px-4">Target Holder</th>
                              <th className="py-3.5 px-4">Reason</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                            {transfers.map((req) => (
                              <tr key={req._id} className="hover:bg-white/1 transition-all">
                                <td className="py-4 px-4 font-mono font-semibold text-white text-xs">{req.assetId?.assetTag || 'N/A'}</td>
                                <td className="py-4 px-4 text-xs">{req.currentHolderId?.name || 'Unknown'}</td>
                                <td className="py-4 px-4 text-xs font-semibold text-brand-secondary">{req.targetHolderId?.name || 'Unknown'}</td>
                                <td className="py-4 px-4 text-xs max-w-[120px] truncate text-slate-400" title={req.requestReason}>{req.requestReason}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : req.status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                    {req.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  {req.status === 'Requested' ? (
                                    <div className="flex items-center justify-end gap-1.5 font-sans">
                                      <button
                                        onClick={() => handleTransferApproval(req._id, 'Approve')}
                                        className="p-1.5 rounded hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 border border-transparent hover:border-emerald-500/20 transition-all cursor-pointer"
                                        title="Approve Transfer"
                                      >
                                        <Check size={14} />
                                      </button>
                                      <button
                                        onClick={() => handleTransferApproval(req._id, 'Reject')}
                                        className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                                        title="Reject Transfer"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] text-slate-500 font-mono">By: {req.approvedBy?.name || 'System'}</span>
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
            )}

            {activeTab === 'bookings' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                    <h2 className="font-display text-lg font-bold text-white mb-1">Book Resource</h2>
                    <p className="text-xs text-slate-400 mb-6 font-sans">Reserve an asset block. Checks for time collisions.</p>
                    <form onSubmit={handleResourceBook} className="space-y-5 font-sans">
                      <div>
                        <label htmlFor="bookAsset" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Select Resource/Asset</label>
                        <select
                          id="bookAsset"
                          value={bookingForm.assetId}
                          onChange={(e) => setBookingForm({ ...bookingForm, assetId: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                          required
                        >
                          <option value="">-- Choose Asset --</option>
                          {assets.map(a => (
                            <option key={a._id} value={a._id} className="bg-dark-950 text-white font-mono">{a.assetTag} - {a.name} ({a.status})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="bookUser" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Select Employee</label>
                        <select
                          id="bookUser"
                          value={bookingForm.employeeId}
                          onChange={(e) => setBookingForm({ ...bookingForm, employeeId: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                          required
                        >
                          <option value="">-- Choose Employee --</option>
                          {users.map(u => (
                            <option key={u._id} value={u._id} className="bg-dark-950 text-white">{u.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="bookStart" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">Start Time</label>
                        <input
                          id="bookStart"
                          type="datetime-local"
                          required
                          value={bookingForm.startTime}
                          onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="bookEnd" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">End Time</label>
                        <input
                          id="bookEnd"
                          type="datetime-local"
                          required
                          value={bookingForm.endTime}
                          onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                          className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-lg"
                      >
                        {submitLoading ? <Loader2 size={16} className="animate-spin" /> : <><span>Reserve Resource</span></>}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="glass p-6 rounded-2xl border border-white/5">
                    <h2 className="font-display text-lg font-bold text-white mb-6">Resource Bookings Schedule</h2>
                    <div className="w-full overflow-x-auto rounded-xl border border-white/5">
                      {bookings.length === 0 ? (
                        <div className="py-16 text-center">
                          <p className="text-sm font-semibold text-slate-400">No active bookings scheduled</p>
                        </div>
                      ) : (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                              <th className="py-3.5 px-4">Resource</th>
                              <th className="py-3.5 px-4">Reserved By</th>
                              <th className="py-3.5 px-4">Start Time</th>
                              <th className="py-3.5 px-4">End Time</th>
                              <th className="py-3.5 px-4">Status</th>
                              <th className="py-3.5 px-4 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                            {bookings.map((b) => (
                              <tr key={b._id} className="hover:bg-white/1 transition-all">
                                <td className="py-4 px-4 font-mono font-semibold text-white text-xs">{b.assetId?.assetTag || 'N/A'}</td>
                                <td className="py-4 px-4 font-medium text-slate-100">{b.employeeId?.name || 'Unknown'}</td>
                                <td className="py-4 px-4 text-xs text-slate-400">{new Date(b.startTime).toLocaleString()}</td>
                                <td className="py-4 px-4 text-xs text-slate-400">{new Date(b.endTime).toLocaleString()}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getBookingStatusBadge(b.status)}`}>
                                    {b.status}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right font-sans">
                                  {b.status === 'Upcoming' || b.status === 'Ongoing' ? (
                                    <button
                                      onClick={() => handleBookingCancel(b._id)}
                                      className="px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-500 italic">-</span>
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
            )}
          </>
        )}
      </main>

      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-white/10 shadow-2xl relative">
            <h3 className="font-display text-lg font-bold text-white mb-2">Process Asset Return</h3>
            <p className="text-xs text-slate-400 mb-4 font-sans">Provide return condition details before releasing inventory.</p>
            <textarea
              rows={3}
              value={returnCondition}
              onChange={(e) => setReturnCondition(e.target.value)}
              placeholder="e.g. Scratched screen, minor wear and tear, fully operational..."
              className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-all font-sans mb-5"
            />
            <div className="flex items-center justify-end gap-3 font-sans">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={submitReturnAsset}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
