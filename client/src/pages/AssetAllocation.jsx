import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { 
  ArrowLeft, Plus, Loader2, ShieldAlert, CheckCircle2, 
  AlertCircle, ClipboardList, Check, X, Shuffle, ArrowRightLeft, Calendar
} from 'lucide-react';

export default function AssetAllocation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [allocations, setAllocations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Allocation Form State
  const [allocForm, setAllocForm] = useState({
    assetId: '',
    employeeId: '',
    expectedReturnDate: ''
  });

  // Modal states
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAllocId, setSelectedAllocId] = useState(null);
  const [returnCondition, setReturnCondition] = useState('');

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    targetHolderId: '',
    transferReason: ''
  });

  const fetchAllocations = useCallback(async () => {
    try {
      const res = await axios.get('/api/allocations');
      setAllocations(res.data);
    } catch (err) {
      console.error('Error fetching allocations:', err);
      setError(err.response?.data?.message || 'Failed to fetch allocations history.');
    }
  }, []);

  const fetchAssets = useCallback(async () => {
    try {
      const res = await axios.get('/api/assets');
      setAssets(res.data);
    } catch (err) {
      console.error('Error fetching assets:', err);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAllocations(), fetchAssets(), fetchUsers()]);
    } catch (err) {
      setError('Failed to load allocation data module.');
    } finally {
      setLoading(false);
    }
  }, [fetchAllocations, fetchAssets, fetchUsers]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Form Submissions
  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!allocForm.assetId || !allocForm.employeeId || !allocForm.expectedReturnDate) {
      setError('Please fill in all allocation fields.');
      return;
    }

    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await axios.post('/api/allocations', allocForm);
      setSuccessMsg('Asset allocated successfully!');
      setAllocForm({ assetId: '', employeeId: '', expectedReturnDate: '' });
      await Promise.all([fetchAllocations(), fetchAssets()]);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate asset.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAllocId) return;

    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await axios.put(`/api/allocations/${selectedAllocId}/return`, { returnCondition });
      setSuccessMsg('Asset return processed successfully!');
      setShowReturnModal(false);
      setSelectedAllocId(null);
      setReturnCondition('');
      await Promise.all([fetchAllocations(), fetchAssets()]);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process asset return.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleTransferRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAllocId || !transferForm.targetHolderId) {
      setError('Please select a target recipient.');
      return;
    }

    setSubmitLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await axios.put(`/api/allocations/${selectedAllocId}/request-transfer`, transferForm);
      setSuccessMsg('Transfer request submitted successfully!');
      setShowTransferModal(false);
      setSelectedAllocId(null);
      setTransferForm({ targetHolderId: '', transferReason: '' });
      await fetchAllocations();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit transfer request.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApproveTransfer = async (allocId) => {
    setError(null);
    setSuccessMsg(null);

    try {
      await axios.put(`/api/allocations/${allocId}/approve-transfer`);
      setSuccessMsg('Transfer approved and ownership successfully updated!');
      await Promise.all([fetchAllocations(), fetchAssets()]);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve transfer.');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Allocated':
        return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'Returned':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      case 'Transfer Requested':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  const canAllocate = user && (user.role === 'Admin' || user.role === 'Asset Manager');
  const canApprove = user && (user.role === 'Admin' || user.role === 'Asset Manager' || user.role === 'Department Head');

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 size={24} className="animate-spin text-brand-secondary" />
          <span className="text-slate-400 text-sm">Verifying session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh relative overflow-x-hidden pb-16">
      
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
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
            <span className="font-display text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ClipboardList size={20} className="text-brand-secondary" />
              Asset<span className="text-brand-secondary">Allocation Workflow</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 font-mono">
              Role: <span className="text-brand-secondary font-semibold">{user.role}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
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
            <span className="text-slate-400 text-sm">Loading allocations module...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Allocation Form (Admin / Asset Manager Only) */}
            {canAllocate && (
              <div className="lg:col-span-4">
                <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                  <h2 className="font-display text-lg font-bold text-white mb-1">Create New Allocation</h2>
                  <p className="text-xs text-slate-400 mb-6">Register a hand-over task for available assets.</p>
                  
                  <form onSubmit={handleAllocate} className="space-y-5 font-sans">
                    {/* Asset Selection */}
                    <div>
                      <label htmlFor="assetSelect" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Available Assets
                      </label>
                      <select
                        id="assetSelect"
                        required
                        value={allocForm.assetId}
                        onChange={(e) => setAllocForm({ ...allocForm, assetId: e.target.value })}
                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer font-mono"
                      >
                        <option value="">-- Choose Asset --</option>
                        {assets.filter(a => a.status === 'Available').map(a => (
                          <option key={a._id} value={a._id} className="bg-dark-950 text-white font-mono">
                            {a.assetTag} - {a.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Employee Selection */}
                    <div>
                      <label htmlFor="employeeSelect" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Target Employee
                      </label>
                      <select
                        id="employeeSelect"
                        required
                        value={allocForm.employeeId}
                        onChange={(e) => setAllocForm({ ...allocForm, employeeId: e.target.value })}
                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                      >
                        <option value="">-- Choose Employee --</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id} className="bg-dark-950 text-white">
                            {u.name} ({u.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Expected Return Date Picker */}
                    <div>
                      <label htmlFor="returnDatePicker" className="block text-[10px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                        Expected Return Date
                      </label>
                      <input
                        id="returnDatePicker"
                        type="date"
                        required
                        value={allocForm.expectedReturnDate}
                        onChange={(e) => setAllocForm({ ...allocForm, expectedReturnDate: e.target.value })}
                        className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-sm font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-brand-primary/20"
                    >
                      {submitLoading ? <Loader2 size={16} className="animate-spin" /> : <><span>Allocate Asset</span></>}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* History Table */}
            <div className={canAllocate ? 'lg:col-span-8' : 'lg:col-span-12'}>
              <div className="glass p-6 rounded-2xl border border-white/5">
                <h2 className="font-display text-lg font-bold text-white mb-6">Allocation History Board</h2>
                
                <div className="w-full overflow-x-auto rounded-xl border border-white/5 font-sans">
                  {allocations.length === 0 ? (
                    <div className="py-16 text-center">
                      <p className="text-sm font-semibold text-slate-500">No allocations registered</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/2 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                          <th className="py-3.5 px-4">Asset</th>
                          <th className="py-3.5 px-4">Employee</th>
                          <th className="py-3.5 px-4">Allocated Date</th>
                          <th className="py-3.5 px-4">Expected Return</th>
                          <th className="py-3.5 px-4">Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                        {allocations.map((alloc) => {
                          const isCurrentHolder = alloc.employeeId?._id?.toString() === user._id?.toString();
                          return (
                            <tr key={alloc._id} className="hover:bg-white/1 transition-all">
                              <td className="py-4 px-4 font-sans text-xs">
                                <div className="font-mono font-semibold text-white">{alloc.assetId?.assetTag || 'N/A'}</div>
                                <div className="text-slate-400 text-[10px] truncate max-w-[150px]">{alloc.assetId?.name || 'N/A'}</div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="font-medium text-slate-100">{alloc.employeeId?.name || 'Unknown'}</div>
                                <div className="text-slate-400 text-[10px]">{alloc.employeeId?.email || 'N/A'}</div>
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-400">
                                {new Date(alloc.allocationDate).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4 text-xs text-slate-400">
                                {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusBadge(alloc.allocationStatus)}`}>
                                  {alloc.allocationStatus}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  
                                  {/* Return Action (Admin / Asset Manager Only) */}
                                  {canAllocate && alloc.allocationStatus !== 'Returned' && (
                                    <button
                                      onClick={() => {
                                        setSelectedAllocId(alloc._id);
                                        setReturnCondition('');
                                        setShowReturnModal(true);
                                      }}
                                      className="px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer"
                                      title="Return Asset"
                                    >
                                      Return
                                    </button>
                                  )}

                                  {/* Request Transfer Action */}
                                  {alloc.allocationStatus === 'Allocated' && (isCurrentHolder || canAllocate) && (
                                    <button
                                      onClick={() => {
                                        setSelectedAllocId(alloc._id);
                                        setTransferForm({ targetHolderId: '', transferReason: '' });
                                        setShowTransferModal(true);
                                      }}
                                      className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                                      title="Transfer Asset"
                                    >
                                      <Shuffle size={12} />
                                      <span>Transfer</span>
                                    </button>
                                  )}

                                  {/* Approve Transfer Action */}
                                  {canApprove && alloc.allocationStatus === 'Transfer Requested' && (
                                    <button
                                      onClick={() => handleApproveTransfer(alloc._id)}
                                      className="px-2.5 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1"
                                      title="Approve Handover"
                                    >
                                      <Check size={12} />
                                      <span>Approve</span>
                                    </button>
                                  )}

                                  {alloc.allocationStatus === 'Returned' && (
                                    <span className="text-xs text-slate-500 italic">Closed</span>
                                  )}

                                  {alloc.allocationStatus === 'Transfer Requested' && !canApprove && (
                                    <span className="text-[10px] text-slate-500 italic">Pending Approval</span>
                                  )}

                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Return Condition Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-white/10 shadow-2xl relative font-sans">
            <h3 className="font-display text-lg font-bold text-white mb-2">Process Asset Return</h3>
            <p className="text-xs text-slate-400 mb-4">State returned condition logs before releasing inventory.</p>
            
            <form onSubmit={handleReturnSubmit}>
              <textarea
                rows={3}
                required
                value={returnCondition}
                onChange={(e) => setReturnCondition(e.target.value)}
                placeholder="e.g. Returned in excellent condition, minor screen scratch..."
                className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-all mb-5"
              />
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedAllocId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  {submitLoading ? <Loader2 size={12} className="animate-spin" /> : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Request Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass max-w-md w-full p-6 rounded-2xl border border-white/10 shadow-2xl relative font-sans">
            <h3 className="font-display text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ArrowRightLeft size={18} className="text-brand-secondary" />
              Request Asset Transfer
            </h3>
            <p className="text-xs text-slate-400 mb-4">Direct handover of custody to another system employee.</p>
            
            <form onSubmit={handleTransferRequestSubmit} className="space-y-4">
              <div>
                <label htmlFor="transferUser" className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Select Recipient
                </label>
                <select
                  id="transferUser"
                  required
                  value={transferForm.targetHolderId}
                  onChange={(e) => setTransferForm({ ...transferForm, targetHolderId: e.target.value })}
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-primary transition-all cursor-pointer"
                >
                  <option value="">-- Choose Employee --</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id} className="bg-dark-950 text-white">
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="reasonField" className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Reason for Transfer
                </label>
                <textarea
                  id="reasonField"
                  rows={3}
                  required
                  value={transferForm.transferReason}
                  onChange={(e) => setTransferForm({ ...transferForm, transferReason: e.target.value })}
                  placeholder="e.g. Department rotation, shifting offices, reassignment..."
                  className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransferModal(false);
                    setSelectedAllocId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 border border-white/10 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  {submitLoading ? <Loader2 size={12} className="animate-spin" /> : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
