import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { 
  Search, Loader2, AlertCircle, CheckCircle2, User, Mail, 
  Building2, Shield, Eye, Edit2, UserCheck, UserX, 
  ChevronLeft, ChevronRight, X, Briefcase, Calendar, ShieldCheck, Laptop
} from 'lucide-react';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // View Profile Modal
  const [selectedProfile, setSelectedProfile] = useState(null);

  // Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    role: '',
    departmentId: '',
    status: ''
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [userRes, deptRes, assetRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/departments'),
        axios.get('/api/assets')
      ]);
      setEmployees(userRes.data);
      setDepartments(deptRes.data);
      setAssets(assetRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user directory logs.');
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

  const handleEditOpen = (emp) => {
    setFormData({
      id: emp._id,
      name: emp.name,
      email: emp.email,
      role: emp.role || 'Employee',
      departmentId: emp.departmentId || '',
      status: emp.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  const handleEditClose = () => {
    setIsEditModalOpen(false);
    setFormData({ id: null, name: '', email: '', role: '', departmentId: '', status: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      displayFeedback('error', 'Name and email are required fields.');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      await axios.put(`/api/users/${formData.id}`, formData);
      displayFeedback('success', `Profile of "${formData.name}" updated successfully.`);
      handleEditClose();
      await loadData();
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to update employee details.');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (emp) => {
    const nextStatus = emp.status === 'Inactive' ? 'Active' : 'Inactive';
    if (!window.confirm(`Are you sure you want to change status of "${emp.name}" to ${nextStatus}?`)) return;

    setActionLoading(true);
    setError(null);
    try {
      await axios.put(`/api/users/${emp._id}`, { status: nextStatus });
      displayFeedback('success', `Employee account status set to ${nextStatus}.`);
      await loadData();
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to toggle account status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter criteria
  const filteredEmployees = employees.filter(emp => {
    const query = searchQuery.toLowerCase();
    const nameMatch = emp.name.toLowerCase().includes(query);
    const emailMatch = emp.email.toLowerCase().includes(query);
    
    // Dept match
    const dept = departments.find(d => d._id === emp.departmentId);
    const deptNameMatch = dept ? dept.name.toLowerCase().includes(query) : false;
    
    const matchesSearch = nameMatch || emailMatch || deptNameMatch;
    const matchesRole = roleFilter ? emp.role === roleFilter : true;
    const matchesDept = deptFilter ? emp.departmentId === deptFilter : true;

    return matchesSearch && matchesRole && matchesDept;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);

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
          <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-400 mt-1">Monitor organization staff, assign departments, promote access permissions, and manage profile states.</p>
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
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-white/10 focus:border-brand-primary rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-dark-900 border border-white/10 rounded-xl text-xs text-slate-400 outline-none focus:border-brand-primary cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Asset Manager">Asset Manager</option>
              <option value="Department Head">Department Head</option>
              <option value="Employee">Employee</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => {
                setDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-dark-900 border border-white/10 rounded-xl text-xs text-slate-400 outline-none focus:border-brand-primary cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table representation */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-brand-secondary" />
            <span className="text-slate-400 text-xs">Loading employee database...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="glass p-16 text-center text-slate-500 text-xs rounded-2xl border border-white/5">
            No employees registered matching current directory filters.
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider bg-white/[0.005]">
                    <th className="py-4 px-6 font-semibold">Staff Member</th>
                    <th className="py-4 px-4 font-semibold">Department</th>
                    <th className="py-4 px-4 font-semibold">Access Privilege</th>
                    <th className="py-4 px-4 font-semibold">Status</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {currentItems.map((emp) => {
                    const dept = departments.find(d => d._id === emp.departmentId);
                    return (
                      <tr key={emp._id} className="hover:bg-white/[0.01] transition-all group">
                        
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center text-brand-secondary font-bold text-xs">
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-xs">{emp.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Mail size={10} />
                                {emp.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          {dept ? (
                            <span className="flex items-center gap-1.5 text-slate-300">
                              <Building2 size={12} className="text-slate-500" />
                              {dept.name}
                            </span>
                          ) : (
                            <span className="text-slate-600 italic">No assigned department</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            emp.role === 'Admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            emp.role === 'Asset Manager' ? 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20' :
                            emp.role === 'Department Head' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            'bg-slate-500/10 text-slate-400 border border-white/5'
                          }`}>
                            <Shield size={10} />
                            {emp.role}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            emp.status === 'Inactive' 
                              ? 'bg-red-950/20 text-red-400 border border-red-500/20' 
                              : 'bg-emerald-950/20 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {emp.status === 'Inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => setSelectedProfile(emp)}
                              className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                              title="View Profile"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              onClick={() => handleEditOpen(emp)}
                              className="p-1.5 rounded bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/20 transition-all cursor-pointer"
                              title="Edit Employee"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => toggleStatus(emp)}
                              className={`p-1.5 rounded border transition-all cursor-pointer ${
                                emp.status === 'Inactive'
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                              }`}
                              title={emp.status === 'Inactive' ? 'Activate Account' : 'Deactivate Account'}
                            >
                              {emp.status === 'Inactive' ? <UserCheck size={12} /> : <UserX size={12} />}
                            </button>
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

        {/* View Profile Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass max-w-lg w-full p-6 rounded-2xl border border-white/5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              
              <button
                onClick={() => setSelectedProfile(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-4 border-b border-white/5 pb-5 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white font-extrabold text-lg">
                  {selectedProfile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white leading-tight">{selectedProfile.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{selectedProfile.email}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-xs text-slate-300">
                <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1.5 mb-1">
                    <Briefcase size={12} />
                    Current Role
                  </span>
                  <span className="font-semibold text-white">{selectedProfile.role}</span>
                </div>

                <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1.5 mb-1">
                    <Building2 size={12} />
                    Department
                  </span>
                  <span className="font-semibold text-white">
                    {departments.find(d => d._id === selectedProfile.departmentId)?.name || 'Unassigned'}
                  </span>
                </div>

                <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1.5 mb-1">
                    <Calendar size={12} />
                    Joined On
                  </span>
                  <span className="font-semibold text-white">
                    {new Date(selectedProfile.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>

                <div className="bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold flex items-center gap-1.5 mb-1">
                    <ShieldCheck size={12} />
                    Status
                  </span>
                  <span className={`font-semibold ${selectedProfile.status === 'Inactive' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {selectedProfile.status || 'Active'}
                  </span>
                </div>
              </div>

              {/* Custody assets list */}
              <div>
                <h4 className="text-[10px] font-semibold uppercase text-slate-500 mb-2.5 flex items-center gap-2">
                  <Laptop size={14} className="text-brand-secondary" />
                  Assigned Hardware Custody
                </h4>
                {assets.filter(a => a.currentHolderId === selectedProfile._id).length === 0 ? (
                  <div className="p-6 text-center text-slate-600 text-xs italic bg-white/[0.002] border border-white/5 rounded-xl">
                    No active hardware assets assigned to this profile.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-2 pr-1.5">
                    {assets.filter(a => a.currentHolderId === selectedProfile._id).map(a => (
                      <div key={a._id} className="p-3 bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs transition-all">
                        <div>
                          <div className="font-semibold text-white">{a.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{a.assetTag}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-semibold font-mono">
                          {a.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Edit Profile / Change Dept / Promote Role Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass max-w-md w-full p-6 rounded-2xl border border-white/5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              
              <button
                onClick={handleEditClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Edit2 size={18} className="text-brand-secondary" />
                Edit Staff Profile
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Privilege Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-brand-primary cursor-pointer"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Asset Manager">Asset Manager</option>
                      <option value="Department Head">Department Head</option>
                      <option value="Employee">Employee</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                      Status State
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-brand-primary cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Change Department
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="">Unassigned / Free</option>
                    {departments.map(d => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-brand-primary/10"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Saving Profile...
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleEditClose}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
