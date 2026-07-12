import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Wrench, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Play, 
  Check, 
  X, 
  RefreshCw,
  AlertTriangle,
  Calendar,
  XCircle,
  FileText,
  Bookmark
} from 'lucide-react';

export default function Maintenance() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // Loading & Action States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  
  // Modal Control
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Alert/Toast Notification
  const [toast, setToast] = useState({ type: '', message: '' });

  // Form States
  const [form, setForm] = useState({ 
    assetId: '', 
    issueTitle: '', 
    issueDescription: '', 
    priority: 'Medium' 
  });

  const isManager = user && ['admin', 'asset_manager'].includes(user.role);

  // Fetch tickets and inventory
  const fetchMaintenanceData = async () => {
    try {
      setLoading(true);
      const [maintRes, assetsRes] = await Promise.all([
        axios.get('/api/maintenance'),
        axios.get('/api/assets')
      ]);
      setRequests(maintRes.data);
      
      const allAssets = assetsRes.data;
      if (!isManager) {
        // Employees can only choose assets currently allocated to them
        const myAllocatedAssets = allAssets.filter(asset => 
          asset.currentHolderId && 
          (asset.currentHolderId === user.id || asset.currentHolderId._id === user.id || asset.currentHolderId === user._id || asset.currentHolderId._id === user._id) &&
          asset.status === 'Allocated'
        );
        setAssets(myAllocatedAssets);
      } else {
        setAssets(allAssets.filter(a => a.status !== 'Retired' && a.status !== 'Lost'));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
      showToast('error', 'Failed to retrieve logs from backend cluster.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMaintenanceData();
      
      // Auto select asset and open modal if assetId query param exists
      const queryParams = new URLSearchParams(window.location.search);
      const queryAssetId = queryParams.get('assetId');
      if (queryAssetId) {
        setForm(prev => ({ ...prev, assetId: queryAssetId }));
        setIsModalOpen(true);
      }
    }
  }, [user]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 4000);
  };

  // Submit request (Employee)
  const handleRaiseRequest = async (e) => {
    e.preventDefault();
    if (!form.assetId || !form.issueTitle || !form.issueDescription) {
      showToast('error', 'Please fill in all required form fields.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/maintenance', form);
      
      // Auto refresh list
      setRequests([res.data, ...requests]);
      
      // Reset form & close modal
      setForm({ assetId: '', issueTitle: '', issueDescription: '', priority: 'Medium' });
      setIsModalOpen(false);
      
      showToast('success', 'Maintenance request raised successfully!');
    } catch (err) {
      console.error('Error raising maintenance request:', err);
      showToast('error', err.response?.data?.message || 'Failed to file maintenance ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update status (Manager/Admin action buttons)
  const handleStatusUpdate = async (id, newStatus) => {
    // Show confirmation dialog before status actions
    const isConfirm = window.confirm(`Are you sure you want to change the status of this ticket to "${newStatus}"?`);
    if (!isConfirm) return;

    try {
      setUpdatingId(id);
      
      const res = await axios.put(`/api/maintenance/${id}`, { status: newStatus });
      
      // Map updated record
      setRequests(requests.map(r => r._id === id ? res.data : r));
      showToast('success', `Request status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('error', err.response?.data?.message || 'Update failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Priority color badges
  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'High':
        return 'bg-red-500/10 text-red-400 border border-red-500/15';
      case 'Medium':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/15';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/15';
    }
  };

  // Status color badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/15';
      case 'Approved':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/15';
      case 'In Progress':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/15';
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/15';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/15';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh relative overflow-x-hidden text-slate-200">
      
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none"></div>

      {/* Sticky Top Bar */}
      <header className="sticky top-0 z-40 w-full glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 border border-white/5 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="font-display text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <Wrench size={18} className="text-brand-secondary animate-pulse-slow" />
              Maintenance Requests Panel
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {!isManager && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary/95 text-white text-xs font-semibold shadow-lg shadow-brand-primary/10 transition-all cursor-pointer"
              >
                <Plus size={14} /> Raise Request
              </button>
            )}
            <span className="text-[10px] text-slate-500 font-mono bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {user.role} View
            </span>
          </div>
        </div>
      </header>

      {/* Main content grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        
        {/* Toast Alert message */}
        {toast.message && (
          <div className={`fixed top-20 right-6 z-50 p-4 rounded-xl border flex items-center gap-3 shadow-xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ${
            toast.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-300' : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
          }`}>
            {toast.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span className="text-xs font-medium">{toast.message}</span>
          </div>
        )}

        {/* Overview Banner */}
        <div className="glass p-6 rounded-2xl border border-white/5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Equipment Integrity Center</h2>
            <p className="text-xs text-slate-400">File diagnostics, monitor ticket pipelines, and resolve system anomalies.</p>
          </div>
          {isManager && (
            <div className="flex gap-4 text-xs">
              <div className="px-4 py-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Pending</span>
                <span className="text-lg font-bold text-yellow-400">{requests.filter(r => r.status === 'Pending').length}</span>
              </div>
              <div className="px-4 py-2.5 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-semibold block">Active</span>
                <span className="text-lg font-bold text-orange-400">{requests.filter(r => ['Approved', 'In Progress'].includes(r.status)).length}</span>
              </div>
            </div>
          )}
        </div>

        {/* Requests Table */}
        <div className="glass rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-5 border-b border-white/5 bg-white/[0.002]">
            <h3 className="font-semibold text-white text-sm">Tickets Register</h3>
          </div>

          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-brand-secondary" />
              <span className="text-slate-400 text-xs font-mono">Fetching active files...</span>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-4 text-slate-500">
              <AlertTriangle size={36} className="text-slate-600" />
              <div className="text-xs">
                No active maintenance logs. {!isManager && 'Click "Raise Request" to file a ticket.'}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-white/[0.005]">
                    <th className="py-4 px-6">Asset</th>
                    <th className="py-4 px-6">Issue</th>
                    <th className="py-4 px-6">Priority</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Created Date</th>
                    {isManager && <th className="py-4 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {requests.map((req) => (
                    <tr key={req._id} className="hover:bg-white/[0.01] transition-all group">
                      
                      {/* Asset Column */}
                      <td className="py-4.5 px-6">
                        <div className="font-bold text-white">{req.assetId?.name || 'Unknown Asset'}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{req.assetId?.assetTag || 'N/A'}</div>
                      </td>

                      {/* Issue Column */}
                      <td className="py-4.5 px-6 max-w-sm">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <FileText size={12} className="text-slate-500 shrink-0" />
                          {req.issueTitle}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {req.issueDescription}
                        </div>
                      </td>

                      {/* Priority Column */}
                      <td className="py-4.5 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getPriorityBadge(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>

                      {/* Status Column */}
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadge(req.status)}`}>
                          <Clock size={10} className="shrink-0" />
                          {req.status}
                        </span>
                      </td>

                      {/* Created Date Column */}
                      <td className="py-4.5 px-6 text-slate-400 font-mono text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-600" />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Manager Controls Column */}
                      {isManager && (
                        <td className="py-4.5 px-6 text-right">
                          {updatingId === req._id ? (
                            <div className="flex items-center justify-end gap-1.5 text-slate-500 text-[10px] font-mono">
                              <Loader2 size={10} className="animate-spin text-brand-secondary" /> updating...
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(req._id, 'Approved')}
                                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                    title="Approve request"
                                  >
                                    <Check size={10} /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(req._id, 'Rejected')}
                                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                    title="Reject request"
                                  >
                                    <X size={10} /> Reject
                                  </button>
                                </>
                              )}

                              {req.status === 'Approved' && (
                                <button
                                  onClick={() => handleStatusUpdate(req._id, 'In Progress')}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                  title="Mark In Progress"
                                >
                                  <Play size={10} /> In Progress
                                </button>
                              )}

                              {req.status === 'In Progress' && (
                                <button
                                  onClick={() => handleStatusUpdate(req._id, 'Completed')}
                                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                                  title="Mark Completed"
                                >
                                  <Check size={10} /> Complete
                                </button>
                              )}

                              {!['Pending', 'Approved', 'In Progress'].includes(req.status) && (
                                <span className="text-[10px] text-slate-500 font-mono italic">
                                  Archived
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      )}

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* RAISE REQUEST MODAL FORM (Employee) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          
          <div className="glass max-w-lg w-full p-6 rounded-2xl border border-white/10 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Close modal button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            >
              <XCircle size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-3">
              <div className="w-8 h-8 bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded-lg flex items-center justify-center">
                <Wrench size={16} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Raise Maintenance Request</h3>
                <p className="text-[10px] text-slate-400">File a hardware log to alert asset coordinators.</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleRaiseRequest} className="space-y-4">
              
              {/* Asset Select */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Asset *
                </label>
                <select
                  value={form.assetId}
                  onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-900 border border-white/5 focus:border-brand-secondary/50 rounded-xl text-xs text-slate-300 outline-none cursor-pointer disabled:opacity-50"
                  required
                  disabled={submitting}
                >
                  <option value="">-- Choose Asset --</option>
                  {assets.map(asset => (
                    <option key={asset._id} value={asset._id}>
                      {asset.name} ({asset.assetTag})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Issue Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Broken keyboard, screen glitch..."
                  value={form.issueTitle}
                  onChange={(e) => setForm({ ...form, issueTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-900 border border-white/5 focus:border-brand-secondary/50 rounded-xl text-xs text-slate-100 outline-none disabled:opacity-50"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Issue Description *
                </label>
                <textarea
                  placeholder="Detail the failure description..."
                  value={form.issueDescription}
                  onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-dark-900 border border-white/5 focus:border-brand-secondary/50 rounded-xl text-xs text-slate-100 outline-none h-24 resize-none disabled:opacity-50"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Priority Level
                </label>
                <div className="flex gap-4">
                  {['Low', 'Medium', 'High'].map(prio => (
                    <label key={prio} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={prio}
                        checked={form.priority === prio}
                        onChange={() => setForm({ ...form, priority: prio })}
                        className="accent-brand-primary"
                        disabled={submitting}
                      />
                      {prio}
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 bg-white/5 hover:bg-white/15 text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-brand-primary/10 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" /> Filing...
                    </>
                  ) : (
                    <>
                      <Check size={12} /> File Request
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
