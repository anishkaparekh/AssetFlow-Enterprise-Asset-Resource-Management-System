import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { 
  Search, Loader2, AlertCircle, CheckCircle2, Shield, User, 
  ChevronLeft, ChevronRight, Check, ShieldAlert, Award, UserMinus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminRoleManagement() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, deptRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/departments')
      ]);
      setUsers(userRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user profiles database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const displayFeedback = (type, message) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser._id === currentAdmin?.id) {
      displayFeedback('error', 'You cannot alter your own admin authorization level.');
      return;
    }

    const actionText = newRole === 'Employee' ? 'demote' : 'promote';
    const confirmMessage = `Are you sure you want to ${actionText} "${targetUser.name}" to the role of "${newRole}"?`;
    
    if (!window.confirm(confirmMessage)) return;

    setActionLoading(true);
    setError(null);
    try {
      // Calling PUT /api/users/:id/role
      await axios.put(`/api/users/${targetUser._id}/role`, { role: newRole });
      displayFeedback('success', `"${targetUser.name}" successfully set to "${newRole}".`);
      await loadData();
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to update access role.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter out the current admin from role changes to avoid lockouts
  const filteredUsers = users
    .filter(u => u._id !== currentAdmin?.id)
    .filter(u => {
      const query = searchQuery.toLowerCase();
      const nameMatch = u.name.toLowerCase().includes(query);
      const emailMatch = u.email.toLowerCase().includes(query);
      
      const matchesSearch = nameMatch || emailMatch;
      const matchesRole = roleFilter ? u.role === roleFilter : true;

      return matchesSearch && matchesRole;
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Banner Headers */}
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Role Management</h1>
          <p className="text-xs text-slate-400 mt-1">Promote employees to managers or heads, modify hierarchy status, and review security scope parameters.</p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="glass p-4 rounded-xl border border-red-500/20 bg-red-950/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div className="text-xs text-red-200">{error}</div>
          </div>
        )}

        {success && (
          <div className="glass p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200">{success}</div>
          </div>
        )}

        {/* Filters Panel */}
        <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search users by name, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-white/10 focus:border-brand-primary rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-dark-900 border border-white/10 rounded-xl text-xs text-slate-400 outline-none focus:border-brand-primary cursor-pointer w-full md:w-48"
          >
            <option value="">All Current Roles</option>
            <option value="Admin">Admin</option>
            <option value="Asset Manager">Asset Manager</option>
            <option value="Department Head">Department Head</option>
            <option value="Employee">Employee</option>
          </select>
        </div>

        {/* Action Loading Overlay Warning */}
        {actionLoading && (
          <div className="p-3 bg-brand-primary/10 border border-brand-primary/20 rounded-xl flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-brand-secondary" />
            <span className="text-[10px] font-semibold text-brand-secondary font-mono">Writing role updates to database cluster...</span>
          </div>
        )}

        {/* Table representation */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-brand-secondary" />
            <span className="text-slate-400 text-xs">Loading user access profiles...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="glass p-16 text-center text-slate-500 text-xs rounded-2xl border border-white/5">
            No users found matching search filters.
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider bg-white/[0.005]">
                    <th className="py-4 px-6 font-semibold">User Details</th>
                    <th className="py-4 px-4 font-semibold">Department</th>
                    <th className="py-4 px-4 font-semibold">Current Role</th>
                    <th className="py-4 px-6 font-semibold text-right">Promote / Demote Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {currentItems.map((u) => {
                    const dept = departments.find(d => d._id === u.departmentId);
                    return (
                      <tr key={u._id} className="hover:bg-white/[0.01] transition-all group">
                        
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 text-xs">
                              <User size={14} />
                            </div>
                            <div>
                              <div className="font-semibold text-white text-xs">{u.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {dept ? (
                            <span className="text-slate-300 font-semibold">{dept.name}</span>
                          ) : (
                            <span className="text-slate-600 italic">No assigned department</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            u.role === 'Admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            u.role === 'Asset Manager' ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20' :
                            u.role === 'Department Head' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-white/5'
                          }`}>
                            <Shield size={10} />
                            {u.role}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {u.role !== 'Employee' && (
                              <button
                                onClick={() => handleRoleChange(u, 'Employee')}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Demote back to general Employee status"
                              >
                                <UserMinus size={12} />
                                <span>Demote</span>
                              </button>
                            )}

                            {u.role !== 'Asset Manager' && (
                              <button
                                onClick={() => handleRoleChange(u, 'Asset Manager')}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/25 text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Promote to Asset Manager role"
                              >
                                <Award size={12} />
                                <span>Promote Manager</span>
                              </button>
                            )}

                            {u.role !== 'Department Head' && (
                              <button
                                onClick={() => handleRoleChange(u, 'Department Head')}
                                disabled={actionLoading}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/25 text-[10px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title="Promote to Department Head role"
                              >
                                <Award size={12} />
                                <span>Promote Head</span>
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination widgets */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/5 flex justify-between items-center bg-white/[0.002]">
                <span className="text-[10px] text-slate-500 font-mono">
                  Showing page {currentPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 bg-dark-900 border border-white/10 hover:border-white/15 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => paginate(i + 1)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        currentPage === i + 1 
                          ? 'bg-brand-secondary text-white font-bold' 
                          : 'bg-dark-900 border border-white/10 hover:border-white/15 text-slate-400 hover:text-white'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 bg-dark-900 border border-white/10 hover:border-white/15 rounded-lg text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Alert Rules Note */}
        <div className="glass p-4 rounded-xl border border-yellow-500/10 bg-yellow-950/5 flex items-start gap-3">
          <ShieldAlert size={18} className="text-yellow-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h5 className="font-semibold text-yellow-200 text-xs">Access Security Constraints</h5>
            <p className="text-[10px] text-slate-400">
              Only primary Administrators are authorized to update security clearances. Reassigned staff will automatically obtain their updated dashboards upon their next session login.
            </p>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
