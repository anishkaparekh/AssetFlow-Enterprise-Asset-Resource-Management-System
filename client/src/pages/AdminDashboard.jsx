import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AdminLayout from '../components/AdminLayout';
import { 
  Plus, Trash2, Edit2, Loader2, Check, X, 
  AlertCircle, CheckCircle2, UserCheck, Mail, ArrowRight, Activity, ShieldAlert, Settings, Bell, Building2, Tags, Users, Laptop
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/admin/categories')) return 'categories';
    if (path.includes('/admin/directory')) return 'directory';
    if (path.includes('/admin/role-management')) return 'role-management';
    if (path.includes('/admin/assets')) return 'assets';
    if (path.includes('/admin/reports')) return 'reports';
    if (path.includes('/admin/settings')) return 'settings';
    return 'dashboard';
  };
  const activeTab = getActiveTabFromPath();
  
  // Data lists
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form states
  const [deptForm, setDeptForm] = useState({ id: null, name: '', description: '', headId: '' });
  const [categoryForm, setCategoryForm] = useState({ id: null, name: '', description: '' });
  const [isEditingDept, setIsEditingDept] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);

  // Edit fields for inline user update
  const [updatingUserId, setUpdatingUserId] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/dashboard/stats');
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await axios.get('/api/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await axios.get('/api/users');
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
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

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchStats(),
        fetchDepartments(),
        fetchCategories(),
        fetchEmployees(),
        fetchAssets()
      ]);
    } catch (err) {
      setError('Failed to fetch secure administration records.');
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchDepartments, fetchCategories, fetchEmployees, fetchAssets]);

  useEffect(() => {
    if (user && user.role === 'Admin') {
      loadAllData();
    }
  }, [user, loadAllData]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const displayFeedback = (type, message) => {
    if (type === 'success') {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // ================= DEPARTMENTS CRUD =================
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name) return;

    setSubmitLoading(true);
    setError(null);
    try {
      if (isEditingDept) {
        await axios.put(`/api/departments/${deptForm.id}`, deptForm);
        displayFeedback('success', `Department "${deptForm.name}" updated successfully.`);
      } else {
        await axios.post('/api/departments', deptForm);
        displayFeedback('success', `Department "${deptForm.name}" created successfully.`);
      }
      setDeptForm({ id: null, name: '', description: '', headId: '' });
      setIsEditingDept(false);
      await Promise.all([fetchDepartments(), fetchStats()]);
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to submit department.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const startDeptEdit = (dept) => {
    setDeptForm({
      id: dept._id,
      name: dept.name,
      description: dept.description || '',
      headId: dept.headId?._id || ''
    });
    setIsEditingDept(true);
  };

  const handleDeptDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" department?`)) return;
    try {
      await axios.delete(`/api/departments/${id}`);
      displayFeedback('success', `Department "${name}" deleted.`);
      await Promise.all([fetchDepartments(), fetchStats()]);
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to delete department.');
    }
  };

  // ================= CATEGORIES CRUD =================
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name) return;

    setSubmitLoading(true);
    setError(null);
    try {
      if (isEditingCategory) {
        await axios.put(`/api/categories/${categoryForm.id}`, categoryForm);
        displayFeedback('success', `Category "${categoryForm.name}" updated.`);
      } else {
        await axios.post('/api/categories', categoryForm);
        displayFeedback('success', `Category "${categoryForm.name}" created.`);
      }
      setCategoryForm({ id: null, name: '', description: '' });
      setIsEditingCategory(false);
      await fetchCategories();
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const startCategoryEdit = (cat) => {
    setCategoryForm({
      id: cat._id,
      name: cat.name,
      description: cat.description || ''
    });
    setIsEditingCategory(true);
  };

  const handleCategoryDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the category "${name}"?`)) return;
    try {
      await axios.delete(`/api/categories/${id}`);
      displayFeedback('success', `Category "${name}" deleted.`);
      await fetchCategories();
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to delete category.');
    }
  };

  // ================= ROLE & DEPT MANAGEMENT =================
  const handleUserRoleDeptUpdate = async (empId, role, deptId) => {
    setUpdatingUserId(empId);
    setError(null);
    try {
      await axios.put(`/api/users/${empId}/role`, { role, departmentId: deptId || null });
      displayFeedback('success', 'User authorization and nodes updated successfully.');
      await Promise.all([fetchEmployees(), fetchDepartments(), fetchStats()]);
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to update employee authorization parameters.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Allocated': return 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20';
      case 'Reserved': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Under Maintenance': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Lost': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Asset Manager': return 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20';
      case 'Department Head': return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  // Safety permission check
  if (user && user.role !== 'Admin') {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-6">
        <div className="glass max-w-md w-full p-8 rounded-2xl border border-red-500/10 text-center relative z-10">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">Access Denied</h2>
          <p className="text-slate-400 text-sm mb-6">
            Administrator permissions are required to access this portal.
          </p>
          <button onClick={() => navigate('/dashboard')} className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-white border border-white/10 transition-all cursor-pointer">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
          
          {error && (
            <div className="glass p-4 rounded-xl border border-red-500/20 bg-red-950/20 flex items-start gap-3 mb-6">
              <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">{error}</div>
            </div>
          )}

          {success && (
            <div className="glass p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex items-start gap-3 mb-6">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-200">{success}</div>
            </div>
          )}

          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-brand-secondary" />
              <span className="text-slate-400 text-sm">Loading security databases...</span>
            </div>
          ) : (
            <>
              {/* ================= TABS ================= */}
              
              {/* Tab 1: Dashboard Overview */}
              {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  {/* Title */}
                  <div>
                    <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">System Overview</h1>
                    <p className="text-xs text-slate-400 mt-1">Real-time counts, assets distributions, and active audit alerts.</p>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[
                      { label: 'Total Employees', value: stats?.totalUsers ?? employees.length, icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                      { label: 'Total Departments', value: stats?.totalDepartments ?? departments.length, icon: Building2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                      { label: 'Total Assets', value: stats?.totalAssets ?? assets.length, icon: Laptop, color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
                      { label: 'Available Assets', value: stats?.availableAssets ?? assets.filter(a => a.status === 'Available').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                      { label: 'Allocated Assets', value: stats?.allocatedAssets ?? assets.filter(a => a.status === 'Allocated').length, icon: Laptop, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                      { label: 'Under Maintenance', value: stats?.underMaintenance ?? assets.filter(a => a.status === 'Under Maintenance').length, icon: Activity, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                      { label: 'Pending Requests', value: stats?.pendingRequests ?? 0, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                    ].map((kpi, idx) => {
                      const Icon = kpi.icon;
                      return (
                        <div key={idx} className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-all">
                          <div>
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                            <div className="text-3xl font-extrabold text-white mt-1.5">{kpi.value}</div>
                          </div>
                          <div className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>
                            <Icon size={20} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick Activity lists */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
                    {/* Recent Registrations */}
                    <div className="glass p-6 rounded-2xl border border-white/5">
                      <h3 className="font-display text-sm font-semibold text-white mb-4">Recent Personnel</h3>
                      <div className="divide-y divide-white/5">
                        {employees.slice(-5).reverse().map(emp => (
                          <div key={emp._id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                            <div>
                              <div className="text-xs font-bold text-white">{emp.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">{emp.email}</div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${getRoleBadge(emp.role)}`}>
                              {emp.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Department Nodes Headcount */}
                    <div className="glass p-6 rounded-2xl border border-white/5">
                      <h3 className="font-display text-sm font-semibold text-white mb-4">Department Load</h3>
                      <div className="divide-y divide-white/5">
                        {departments.map(dept => {
                          const headcount = employees.filter(e => e.departmentId === dept._id).length;
                          return (
                            <div key={dept._id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                              <span className="text-xs font-semibold text-slate-200">{dept.name}</span>
                              <span className="text-xs font-bold text-brand-secondary font-mono">
                                {headcount} {headcount === 1 ? 'staff' : 'staff'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Department Management */}
              {activeTab === 'departments' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Department Management</h1>
                    <p className="text-xs text-slate-400 mt-1">Manage departmental hierarchies and map heads of departments.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Add/Edit Dept Form */}
                    <div className="lg:col-span-4">
                      <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Building2 size={16} className="text-brand-secondary" />
                          {isEditingDept ? 'Update Department' : 'Create Department'}
                        </h3>
                        
                        <form onSubmit={handleDeptSubmit} className="space-y-4 font-sans">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Name</label>
                            <input
                              type="text"
                              required
                              value={deptForm.name}
                              onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                              placeholder="e.g. Engineering, Sales"
                              className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Description</label>
                            <textarea
                              rows={3}
                              value={deptForm.description}
                              onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                              placeholder="Describe department function..."
                              className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary transition-all resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Department Head</label>
                            <select
                              value={deptForm.headId}
                              onChange={(e) => setDeptForm({ ...deptForm, headId: e.target.value })}
                              className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary cursor-pointer transition-all"
                            >
                              <option value="">-- Choose Head --</option>
                              {employees.map(e => (
                                <option key={e._id} value={e._id}>{e.name} ({e.email})</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={submitLoading}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer shadow-md"
                            >
                              {submitLoading ? <Loader2 size={12} className="animate-spin" /> : <span>Save Department</span>}
                            </button>
                            {isEditingDept && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeptForm({ id: null, name: '', description: '', headId: '' });
                                  setIsEditingDept(false);
                                }}
                                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Department Lists */}
                    <div className="lg:col-span-8 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {departments.map((dept) => {
                          const headcount = employees.filter(e => e.departmentId === dept._id).length;
                          return (
                            <div key={dept._id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all group">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-display font-bold text-white text-base truncate">{dept.name}</h4>
                                  <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 text-brand-primary text-[9px] font-semibold">
                                    {headcount} Staff
                                  </span>
                                </div>
                                <p className="text-slate-400 text-xs leading-normal mb-4 h-12 overflow-hidden text-ellipsis line-clamp-2">
                                  {dept.description || 'No description provided.'}
                                </p>
                              </div>
                              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-semibold text-slate-500 uppercase">Department Head</span>
                                  <span className="text-[11px] font-medium text-slate-300">
                                    {dept.headId ? dept.headId.name : <span className="text-slate-600 italic">Unassigned</span>}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                  <button
                                    onClick={() => startDeptEdit(dept)}
                                    className="p-1.5 rounded hover:bg-brand-secondary/15 text-slate-400 hover:text-brand-secondary border border-transparent hover:border-brand-secondary/25 transition-all cursor-pointer"
                                    title="Edit Department"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeptDelete(dept._id, dept.name)}
                                    className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                                    title="Delete Department"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Categories CRUD */}
              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Category Management</h1>
                    <p className="text-xs text-slate-400 mt-1">Add, update, or remove hardware inventory categories.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Form */}
                    <div className="lg:col-span-4">
                      <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Tags size={16} className="text-brand-secondary" />
                          {isEditingCategory ? 'Update Category' : 'Create Category'}
                        </h3>
                        
                        <form onSubmit={handleCategorySubmit} className="space-y-4 font-sans">
                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Category Name</label>
                            <input
                              type="text"
                              required
                              value={categoryForm.name}
                              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                              placeholder="e.g. Laptop, Tablet, Router"
                              className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">Description</label>
                            <textarea
                              rows={3}
                              value={categoryForm.description}
                              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                              placeholder="Describe hardware type..."
                              className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-primary transition-all resize-none"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={submitLoading}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-xs font-semibold text-white hover:opacity-90 transition-all cursor-pointer shadow-md"
                            >
                              {submitLoading ? <Loader2 size={12} className="animate-spin" /> : <span>Save Category</span>}
                            </button>
                            {isEditingCategory && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCategoryForm({ id: null, name: '', description: '' });
                                  setIsEditingCategory(false);
                                }}
                                className="px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-white transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Lists */}
                    <div className="lg:col-span-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categories.map((cat) => {
                          const assetCount = assets.filter(a => a.category === cat.name).length;
                          return (
                            <div key={cat._id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all group">
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <h4 className="font-display font-bold text-white text-base truncate">{cat.name}</h4>
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/15 text-indigo-400 text-[9px] font-semibold">
                                    {assetCount} Assets
                                  </span>
                                </div>
                                <p className="text-slate-400 text-xs leading-normal mb-4">
                                  {cat.description || 'No description provided.'}
                                </p>
                              </div>
                              <div className="pt-2 border-t border-white/5 flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={() => startCategoryEdit(cat)}
                                  className="p-1.5 rounded hover:bg-brand-secondary/15 text-slate-400 hover:text-brand-secondary border border-transparent hover:border-brand-secondary/25 transition-all cursor-pointer"
                                  title="Edit Category"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleCategoryDelete(cat._id, cat.name)}
                                  className="p-1.5 rounded hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
                                  title="Delete Category"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Employee Directory */}
              {activeTab === 'directory' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Employee Directory</h1>
                    <p className="text-xs text-slate-400 mt-1">Audit employee profile mappings and assign departmental nodes.</p>
                  </div>

                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider bg-white/[0.005]">
                            <th className="py-4 px-6 font-semibold">User Details</th>
                            <th className="py-4 px-4 font-semibold">Email</th>
                            <th className="py-4 px-4 font-semibold">Current Role</th>
                            <th className="py-4 px-4 font-semibold">Department Assignment</th>
                            <th className="py-4 px-6 font-semibold text-right">Row Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {employees.map((emp) => (
                            <tr key={emp._id} className="hover:bg-white/[0.01] transition-colors group font-sans text-slate-300">
                              
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                                    {emp.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white text-xs">{emp.name}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4 font-mono">{emp.email}</td>

                              <td className="py-4 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRoleBadge(emp.role)}`}>
                                  {emp.role}
                                </span>
                              </td>

                              <td className="py-4 px-4 font-medium text-slate-400">
                                {departments.find(d => d._id === emp.departmentId)?.name || <span className="text-slate-600 italic">Unmapped</span>}
                              </td>

                              <td className="py-4 px-6 text-right">
                                <div className="flex justify-end gap-1 font-sans">
                                  <button
                                    onClick={() => handleUserRoleDeptUpdate(emp._id, 'Asset Manager', emp.departmentId)}
                                    className="px-2 py-1 rounded bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/20 text-[10px] font-semibold transition-all cursor-pointer"
                                  >
                                    Promote Manager
                                  </button>
                                  <button
                                    onClick={() => handleUserRoleDeptUpdate(emp._id, 'Department Head', emp.departmentId)}
                                    className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-[10px] font-semibold transition-all cursor-pointer"
                                  >
                                    Promote Head
                                  </button>
                                  <button
                                    onClick={() => handleUserRoleDeptUpdate(emp._id, 'Employee', emp.departmentId)}
                                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-[10px] font-semibold transition-all cursor-pointer"
                                  >
                                    Demote
                                  </button>
                                </div>
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Role Management */}
              {activeTab === 'role-management' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Role Management</h1>
                    <p className="text-xs text-slate-400 mt-1">Quick re-assignment of employee authorization profiles and department nodes.</p>
                  </div>

                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                      <div>
                        <h3 className="font-semibold text-white">Active Permissions Matrix</h3>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider bg-white/[0.005]">
                            <th className="py-4 px-6 font-semibold">User details</th>
                            <th className="py-4 px-4 font-semibold">Select Role</th>
                            <th className="py-4 px-4 font-semibold">Select Department</th>
                            <th className="py-4 px-6 font-semibold text-right">Action status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {employees.map((item) => (
                            <tr key={item._id} className="hover:bg-white/[0.01] transition-colors group">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                                    {item.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-white text-xs">{item.name}</div>
                                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">{item.email}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <select
                                  value={item.role}
                                  disabled={updatingUserId !== null}
                                  onChange={(e) => handleUserRoleDeptUpdate(item._id, e.target.value, item.departmentId)}
                                  className="px-2 py-1 bg-dark-900 border border-white/5 rounded-lg text-slate-300 focus:border-brand-secondary outline-none text-xs cursor-pointer hover:border-white/10"
                                >
                                  <option value="Admin">Admin</option>
                                  <option value="Asset Manager">Asset Manager</option>
                                  <option value="Department Head">Department Head</option>
                                  <option value="Employee">Employee</option>
                                </select>
                              </td>

                              <td className="py-4 px-4">
                                <select
                                  value={item.departmentId || ''}
                                  disabled={updatingUserId !== null}
                                  onChange={(e) => handleUserRoleDeptUpdate(item._id, item.role, e.target.value)}
                                  className="px-2 py-1 bg-dark-900 border border-white/5 rounded-lg text-slate-300 focus:border-brand-secondary outline-none text-xs cursor-pointer hover:border-white/10"
                                >
                                  <option value="">-- Unassigned --</option>
                                  {departments.map(dept => (
                                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                                  ))}
                                </select>
                              </td>

                              <td className="py-4 px-6 text-right">
                                {updatingUserId === item._id ? (
                                  <span className="inline-flex items-center gap-1 text-brand-secondary text-[10px] font-semibold bg-brand-secondary/10 px-2 py-0.5 rounded-full animate-pulse border border-brand-secondary/20">
                                    <Loader2 size={10} className="animate-spin" /> Saving...
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-600">Synced</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Assets View */}
              {activeTab === 'assets' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Organization Assets</h1>
                    <p className="text-xs text-slate-400 mt-1">Direct read-only inspection log of registered hardware databases.</p>
                  </div>

                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto font-sans">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider bg-white/[0.005]">
                            <th className="py-4 px-6 font-semibold">Asset tag</th>
                            <th className="py-4 px-4 font-semibold">Hardware Name</th>
                            <th className="py-4 px-4 font-semibold">Category</th>
                            <th className="py-4 px-4 font-semibold">Lifecycle Status</th>
                            <th className="py-4 px-6 font-semibold">Current Custody Holder</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                          {assets.map((ast) => (
                            <tr key={ast._id} className="hover:bg-white/[0.01] transition-all">
                              <td className="py-4 px-6 font-mono font-bold text-white text-xs">{ast.assetTag}</td>
                              <td className="py-4 px-4 font-medium text-slate-100">{ast.name}</td>
                              <td className="py-4 px-4 text-slate-400">{ast.category}</td>
                              <td className="py-4 px-4">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${getStatusBadge(ast.status)}`}>
                                  {ast.status}
                                </span>
                              </td>
                              <td className="py-4 px-6 font-medium text-slate-400">
                                {employees.find(e => e._id === ast.currentHolderId)?.name || <span className="text-slate-600 italic">None (In Storage)</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 7: Reports Summary */}
              {activeTab === 'reports' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Organization Reports</h1>
                    <p className="text-xs text-slate-400 mt-1">Lifecycle distribution, statistics metrics, and structural alignments.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Status Distribution Summary */}
                    <div className="glass p-6 rounded-2xl border border-white/5">
                      <h3 className="font-display text-sm font-semibold text-white mb-6">Asset Lifecycle Distributions</h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Available in Storage', count: assets.filter(a => a.status === 'Available').length, color: 'bg-emerald-500' },
                          { label: 'Allocated to Personnel', count: assets.filter(a => a.status === 'Allocated').length, color: 'bg-cyan-500' },
                          { label: 'Under Maintenance Log', count: assets.filter(a => a.status === 'Under Maintenance').length, color: 'bg-amber-500' },
                          { label: 'Reserved / Scheduled', count: assets.filter(a => a.status === 'Reserved').length, color: 'bg-purple-500' },
                          { label: 'Retired or Lost', count: assets.filter(a => a.status === 'Retired' || a.status === 'Lost').length, color: 'bg-red-500' }
                        ].map((stat, idx) => {
                          const percentage = assets.length ? Math.round((stat.count / assets.length) * 100) : 0;
                          return (
                            <div key={idx} className="space-y-1.5 font-sans">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-300">{stat.label}</span>
                                <span className="text-white font-mono">{stat.count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div className={`${stat.color} h-full rounded-full`} style={{ width: `${percentage}%` }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Operational Benchmarks */}
                    <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <div>
                        <h3 className="font-display text-sm font-semibold text-white mb-6">Operational Benchmarks</h3>
                        <div className="grid grid-cols-2 gap-4 font-sans">
                          <div className="bg-white/2 border border-white/5 p-4 rounded-xl">
                            <div className="text-[10px] font-semibold text-slate-500 uppercase">Asset-to-Staff Ratio</div>
                            <div className="text-2xl font-bold text-white mt-1">
                              {employees.length ? (assets.length / employees.length).toFixed(1) : '0.0'}
                            </div>
                          </div>
                          <div className="bg-white/2 border border-white/5 p-4 rounded-xl">
                            <div className="text-[10px] font-semibold text-slate-500 uppercase">Avg Dept Headcount</div>
                            <div className="text-2xl font-bold text-white mt-1">
                              {departments.length ? (employees.length / departments.length).toFixed(1) : '0.0'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-white/5 text-center text-slate-500 text-xs font-sans">
                        Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Tab 8: Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  <div>
                    <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">System Settings</h1>
                    <p className="text-xs text-slate-400 mt-1">Configure global ERP specifications, maintenance limits, and API logs.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                    {/* General Settings */}
                    <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">General Parameters</h3>
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">ERP Instance Name</label>
                          <input type="text" defaultValue="AssetFlow ERP Enterprise" className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-primary" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-semibold mb-1">Support Contact Email</label>
                          <input type="email" defaultValue="support@assetflow.com" className="w-full bg-dark-900 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-brand-primary" />
                        </div>
                      </div>
                    </div>

                    {/* Maintenance Settings */}
                    <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">Maintenance Limits</h3>
                      <div className="space-y-3 text-xs text-slate-300">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span>Auto-Retire Lost Assets</span>
                          <span className="font-bold text-brand-secondary">90 days</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                          <span>Max Pending Reservations</span>
                          <span className="font-bold text-brand-secondary">5 tickets</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span>Compliance Audit Cycle</span>
                          <span className="font-bold text-brand-secondary">Quarterly</span>
                        </div>
                      </div>
                    </div>

                    {/* API Status Settings */}
                    <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
                      <h3 className="text-sm font-semibold text-white">API Cluster Logs</h3>
                      <div className="space-y-2 text-[10px] text-slate-400 font-mono">
                        <div className="flex justify-between">
                          <span>Database Latency:</span>
                          <span className="text-emerald-400 font-bold">12ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Connected Nodes:</span>
                          <span className="text-emerald-400 font-bold">3 active</span>
                        </div>
                        <div className="flex justify-between">
                          <span>TLS 1.3 Encryption:</span>
                          <span className="text-emerald-400 font-bold">Enforced</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </>
          )}
    </AdminLayout>
  );
}
