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
  DollarSign, 
  MessageSquare,
  RefreshCw
} from 'lucide-react';

export default function Maintenance() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // Loading States
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Tabs for managers
  const [managerTab, setManagerTab] = useState('pending'); // pending, ongoing, completed

  // Alerts
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Form States
  const [form, setForm] = useState({ assetId: '', description: '' });
  
  // Action Modal / Input States
  const [costInput, setCostInput] = useState('');
  const [commentInput, setCommentInput] = useState('');

  const isManager = user && ['Admin', 'Asset Manager'].includes(user.role);

  const fetchData = async () => {
    try {
      setLoadingLogs(true);
      const logRes = await axios.get('/api/maintenance');
      setRequests(logRes.data);
      setLoadingLogs(false);

      // Only fetch assets if we need to raise a request
      setLoadingAssets(true);
      const assetRes = await axios.get('/api/assets');
      setAssets(assetRes.data);
      setLoadingAssets(false);
    } catch (err) {
      console.error('Error fetching maintenance data:', err);
      showAlert('error', 'Failed to retrieve records.');
      setLoadingLogs(false);
      setLoadingAssets(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert({ type: '', message: '' }), 5000);
  };

  // Submit request (Employee)
  const handleRaiseRequest = async (e) => {
    e.preventDefault();
    if (!form.assetId || !form.description) {
      showAlert('error', 'Please select an asset and describe the issue.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await axios.post('/api/maintenance', form);
      setRequests([res.data.request, ...requests]);
      setForm({ assetId: '', description: '' });
      showAlert('success', 'Maintenance request filed successfully.');
    } catch (err) {
      console.error('Error creating request:', err);
      showAlert('error', err.response?.data?.message || 'Failed to submit ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  // Update request status (Manager)
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      
      const payload = { status: newStatus };
      if (newStatus === 'Resolved') {
        payload.cost = Number(costInput) || 0;
        payload.comments = commentInput || 'Resolved by Asset Manager';
      } else if (newStatus === 'Rejected') {
        payload.comments = commentInput || 'Rejected by Asset Manager';
      }

      const res = await axios.put(`/api/maintenance/${id}/status`, payload);
      
      setRequests(requests.map(r => r._id === id ? res.data.request : r));
      showAlert('success', `Ticket status updated to ${newStatus}.`);
      
      // Reset action modal inputs
      setCostInput('');
      setCommentInput('');
    } catch (err) {
      console.error('Error updating ticket status:', err);
      showAlert('error', err.response?.data?.message || 'Action failed.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper status color mapping
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/15';
      case 'Approved':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/15';
      case 'In Progress':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/15';
      case 'Resolved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15';
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/15';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/15';
    }
  };

  // Filter requests for managers
  const filteredRequests = requests.filter(r => {
    if (!isManager) return true; // employees see their own list sorted
    if (managerTab === 'pending') return r.status === 'Pending';
    if (managerTab === 'ongoing') return ['Approved', 'In Progress'].includes(r.status);
    return ['Resolved', 'Rejected'].includes(r.status);
  });

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
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all border border-white/5 cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Wrench size={18} className="text-brand-secondary" />
              Maintenance Central
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Auth Scope: {user.role}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        
        {/* Alerts Banner */}
        {alert.message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-pulse-slow ${
            alert.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {alert.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
            <span className="text-xs leading-normal">{alert.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT PANEL: Raising Request (Employee) or Tab Controls (Manager) */}
          <div className="lg:col-span-4">
            {isManager ? (
              /* Manager Tab Dashboard */
              <div className="glass p-6 rounded-2xl border border-white/5 space-y-3 sticky top-24">
                <h3 className="font-semibold text-white mb-4 text-sm">Manager Dispatcher</h3>
                
                <button
                  onClick={() => setManagerTab('pending')}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    managerTab === 'pending'
                      ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-400'
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Clock size={14} /> Pending Requests
                  </span>
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full text-[10px]">
                    {requests.filter(r => r.status === 'Pending').length}
                  </span>
                </button>

                <button
                  onClick={() => setManagerTab('ongoing')}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    managerTab === 'ongoing'
                      ? 'bg-brand-primary/10 border-brand-primary/25 text-brand-primary'
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Play size={14} /> Approved & In Progress
                  </span>
                  <span className="bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full text-[10px]">
                    {requests.filter(r => ['Approved', 'In Progress'].includes(r.status)).length}
                  </span>
                </button>

                <button
                  onClick={() => setManagerTab('completed')}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    managerTab === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                      : 'bg-white/5 border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Check size={14} /> Archives (Closed)
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[10px]">
                    {requests.filter(r => ['Resolved', 'Rejected'].includes(r.status)).length}
                  </span>
                </button>
              </div>
            ) : (
              /* Employee Raise Ticket Form */
              <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                <div className="flex items-center gap-2.5 mb-5">
                  <Wrench size={18} className="text-brand-secondary" />
                  <h3 className="font-semibold text-white">Raise Request</h3>
                </div>

                <form onSubmit={handleRaiseRequest} className="space-y-4">
                  {/* Select Asset */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Target Hardware Asset
                    </label>
                    {loadingAssets ? (
                      <div className="flex items-center gap-2 text-slate-500 text-xs py-2.5">
                        <Loader2 size={12} className="animate-spin text-brand-secondary" /> Loading inventory...
                      </div>
                    ) : (
                      <select
                        value={form.assetId}
                        onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                        className="w-full px-3 py-2.5 bg-dark-900 border border-white/5 focus:border-brand-secondary/50 rounded-xl text-xs text-slate-300 outline-none transition-all cursor-pointer"
                        required
                      >
                        <option value="">-- Choose Asset --</option>
                        {assets.map(asset => (
                          <option key={asset._id} value={asset._id}>
                            {asset.name} ({asset.assetTag} - {asset.status})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Problem Description */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Describe the Issue
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-900 border border-white/5 hover:border-white/10 focus:border-brand-secondary/50 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition-all h-28 resize-none"
                      placeholder="Be specific. Screen glitches, system slowdowns, hardware damage..."
                      required
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/10 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Filing request...
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        File Ticket
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT PANEL: Maintenance Request Logs */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2">
              {isManager ? `Dispatcher Logs: ${managerTab.toUpperCase()}` : 'My Maintenance Request History'}
            </h3>

            {loadingLogs ? (
              <div className="glass p-12 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
                <Loader2 size={24} className="animate-spin text-brand-secondary" />
                <span className="text-slate-400 text-xs">Loading logs...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="glass p-12 rounded-2xl border border-white/5 text-center text-slate-500 text-xs">
                No maintenance records found in this category.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredRequests.map((req) => (
                  <div key={req._id} className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                    
                    {/* Top Row: Asset & Status */}
                    <div className="flex justify-between items-start gap-4 mb-3">
                      <div>
                        <h4 className="font-display font-bold text-white text-sm">
                          {req.assetId?.name || <span className="text-slate-500 italic">Unknown Asset</span>}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          Asset Tag: {req.assetId?.assetTag || 'N/A'} • Category: {req.assetId?.category || 'N/A'}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </div>

                    {/* Middle Row: Description */}
                    <div className="bg-dark-900/60 p-3 rounded-xl border border-white/5 text-xs text-slate-300 leading-relaxed mb-4">
                      <p className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1">Issue Details</p>
                      {req.description}
                    </div>

                    {/* Meta Row: Dates, Cost, Comments */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-white/5 text-[10px] text-slate-400">
                      <div>
                        <span className="text-slate-500">Requested by:</span>{' '}
                        <strong className="text-slate-300">{req.requesterId?.name || 'User'}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Cost Incurred:</span>{' '}
                        <strong className="text-slate-300 font-mono">${req.cost || 0}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Log Date:</span>{' '}
                        <span className="font-mono">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Comments Render */}
                    {req.comments && (
                      <div className="mt-3 p-2.5 rounded-lg bg-brand-primary/5 border border-brand-primary/10 text-[10px] text-slate-400 flex items-start gap-2">
                        <MessageSquare size={12} className="text-brand-secondary shrink-0 mt-0.5" />
                        <span>
                          <strong>Feedback:</strong> {req.comments}
                        </span>
                      </div>
                    )}

                    {/* ACTION CONTROLS (Only visible to Managers in active tabs) */}
                    {isManager && updatingId !== req._id && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2 justify-end">
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(req._id, 'Approved')}
                              className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Check size={10} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                const comment = prompt("Enter Rejection Comment:");
                                if (comment !== null) {
                                  setCommentInput(comment);
                                  handleStatusUpdate(req._id, 'Rejected');
                                }
                              }}
                              className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <X size={10} /> Reject
                            </button>
                          </>
                        )}
                        
                        {req.status === 'Approved' && (
                          <button
                            onClick={() => handleStatusUpdate(req._id, 'In Progress')}
                            className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Play size={10} /> Start Work
                          </button>
                        )}

                        {req.status === 'In Progress' && (
                          <div className="w-full flex flex-col md:flex-row gap-2 mt-2 items-end justify-end">
                            <div className="w-full md:w-36 relative">
                              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 text-[10px]">
                                <DollarSign size={10} />
                              </span>
                              <input
                                type="number"
                                placeholder="Cost (USD)"
                                value={costInput}
                                onChange={(e) => setCostInput(e.target.value)}
                                className="w-full pl-6 pr-2.5 py-1.5 bg-dark-900 border border-white/5 rounded-lg text-[10px] text-slate-200 outline-none focus:border-brand-secondary"
                              />
                            </div>
                            <div className="w-full md:w-60">
                              <input
                                type="text"
                                placeholder="Resolution details/comments..."
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-dark-900 border border-white/5 rounded-lg text-[10px] text-slate-200 outline-none focus:border-brand-secondary"
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (!costInput || isNaN(costInput)) {
                                  alert("Please enter a valid cost number.");
                                  return;
                                }
                                handleStatusUpdate(req._id, 'Resolved');
                              }}
                              className="px-3.5 py-1.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Check size={10} /> Resolve Ticket
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Saving indicator */}
                    {updatingId === req._id && (
                      <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                        <span className="inline-flex items-center gap-1 text-brand-secondary text-[10px] font-semibold bg-brand-secondary/10 px-2 py-0.5 rounded-full border border-brand-secondary/15">
                          <Loader2 size={10} className="animate-spin" /> Saving update...
                        </span>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>

    </div>
  );
}
