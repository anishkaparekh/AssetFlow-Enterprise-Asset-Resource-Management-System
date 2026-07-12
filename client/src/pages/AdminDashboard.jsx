import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Users, 
  FolderPlus, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  ShieldAlert, 
  UserCheck, 
  Mail, 
  Shield 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('departments');
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Loading & Action States
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submittingDept, setSubmittingDept] = useState(false);
  const [updatingUserRow, setUpdatingUserRow] = useState(null); // stores userId being updated

  // Alerts
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Form State
  const [deptForm, setDeptForm] = useState({ name: '', description: '', headId: '' });

  // Load Data
  const fetchData = async () => {
    try {
      setLoadingDepts(true);
      const deptRes = await axios.get('/api/departments');
      setDepartments(deptRes.data);
      setLoadingDepts(false);

      setLoadingUsers(true);
      const userRes = await axios.get('/api/users');
      setUsers(userRes.data);
      setLoadingUsers(false);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
      showAlert('error', err.response?.data?.message || 'Failed to fetch dashboard data. Please try again.');
      setLoadingDepts(false);
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert({ type: '', message: '' });
    }, 5000);
  };

  // Department Creation
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name) {
      showAlert('error', 'Department name is required');
      return;
    }

    try {
      setSubmittingDept(true);
      const res = await axios.post('/api/departments', deptForm);
      setDepartments([...departments, res.data.department]);
      setDeptForm({ name: '', description: '', headId: '' });
      showAlert('success', `Department "${res.data.department.name}" created successfully.`);
    } catch (err) {
      console.error('Error creating department:', err);
      showAlert('error', err.response?.data?.message || 'Failed to create department');
    } finally {
      setSubmittingDept(false);
    }
  };

  // User Profile Role/Dept update
  const handleUserUpdate = async (targetUserId, field, value) => {
    // Find current state
    const targetUser = users.find(u => u._id === targetUserId);
    if (!targetUser) return;

    // Prepare payload
    const payload = {
      role: field === 'role' ? value : targetUser.role,
      departmentId: field === 'departmentId' ? value : targetUser.departmentId
    };

    try {
      setUpdatingUserRow(targetUserId);
      const res = await axios.put(`/api/users/${targetUserId}/role`, payload);
      
      // Update local state
      setUsers(users.map(u => u._id === targetUserId ? { ...u, ...res.data.user } : u));
      
      // If we updated head, let's refresh departments list to reflect correct names
      if (field === 'role' || field === 'departmentId') {
        const deptRes = await axios.get('/api/departments');
        setDepartments(deptRes.data);
      }

      showAlert('success', 'User authorization updated.');
    } catch (err) {
      console.error('Error updating user role/department:', err);
      showAlert('error', err.response?.data?.message || 'Failed to update user parameters.');
    } finally {
      setUpdatingUserRow(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh relative overflow-x-hidden">
      
      {/* Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-brand-secondary/5 blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all border border-white/5"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="font-display text-xl font-bold tracking-tight text-white">
              AssetFlow <span className="text-xs text-brand-secondary font-mono bg-brand-secondary/10 px-2 py-0.5 rounded-full border border-brand-secondary/20 ml-2">Admin Core</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <Building2 size={14} className="text-brand-secondary" />
            <span>Admin Active: <strong className="text-slate-200">{user?.name}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">Organization Setup</h1>
          <p className="text-slate-400 text-sm mt-1">Manage departmental hierarchies and assign employee access control credentials.</p>
        </div>

        {/* Global Notification Banner */}
        {alert.message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 transition-all animate-pulse-slow ${
            alert.type === 'error' 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {alert.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
            <div className="text-xs leading-normal">
              <strong>{alert.type === 'error' ? 'System Warning: ' : 'Success: '}</strong>
              {alert.message}
            </div>
          </div>
        )}

        {/* Tab System Selector */}
        <div className="flex border-b border-white/5 mb-8">
          <button
            onClick={() => setActiveTab('departments')}
            className={`pb-4 px-6 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'departments' 
                ? 'border-brand-secondary text-brand-secondary' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Building2 size={16} />
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-4 px-6 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'directory' 
                ? 'border-brand-secondary text-brand-secondary' 
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} />
            Employee Directory ({users.length})
          </button>
        </div>

        {/* Tabs Content */}
        {activeTab === 'departments' ? (
          
          /* ================= DEPARTMENTS TAB ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Create Dept Form (col-4) */}
            <div className="lg:col-span-4">
              <div className="glass p-6 rounded-2xl border border-white/5 sticky top-24">
                <div className="flex items-center gap-2.5 mb-5">
                  <FolderPlus size={18} className="text-brand-secondary" />
                  <h3 className="font-semibold text-white">New Department</h3>
                </div>

                <form onSubmit={handleDeptSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Department Name
                    </label>
                    <input
                      type="text"
                      value={deptForm.name}
                      onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-900 border border-white/5 hover:border-white/10 focus:border-brand-secondary/50 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition-all"
                      placeholder="e.g. Engineering, Sales"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Description
                    </label>
                    <textarea
                      value={deptForm.description}
                      onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-900 border border-white/5 hover:border-white/10 focus:border-brand-secondary/50 rounded-xl text-xs text-slate-100 placeholder-slate-500 outline-none transition-all h-20 resize-none"
                      placeholder="Functional purpose, cost tracking limits..."
                    />
                  </div>

                  {/* Head of Department */}
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Department Head
                    </label>
                    <select
                      value={deptForm.headId}
                      onChange={(e) => setDeptForm({ ...deptForm, headId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-dark-900 border border-white/5 focus:border-brand-secondary/50 rounded-xl text-xs text-slate-300 outline-none transition-all"
                    >
                      <option value="">-- Select Employee (Optional) --</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submittingDept}
                    className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-primary/50 text-white text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-primary/10"
                  >
                    {submittingDept ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        Add Department
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* List Departments (col-8) */}
            <div className="lg:col-span-8 space-y-4">
              <h3 className="font-semibold text-white mb-2 text-sm">Active Departments</h3>
              
              {loadingDepts ? (
                <div className="glass p-12 rounded-2xl border border-white/5 flex flex-col items-center gap-3">
                  <Loader2 size={24} className="animate-spin text-brand-secondary" />
                  <span className="text-slate-400 text-xs">Loading departments from database...</span>
                </div>
              ) : departments.length === 0 ? (
                <div className="glass p-12 rounded-2xl border border-white/5 text-center text-slate-500 text-xs">
                  No departments created yet. Build your organization above.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {departments.map((dept) => {
                    const headcount = users.filter(u => u.departmentId === dept._id).length;
                    return (
                      <div key={dept._id} className="glass p-5 rounded-2xl border border-white/5 flex flex-col justify-between group hover:border-brand-secondary/20 transition-all duration-200">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-display font-bold text-white text-base group-hover:text-brand-secondary transition-colors">{dept.name}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-brand-secondary/10 border border-brand-secondary/15 text-brand-secondary text-[9px] font-semibold">
                              {headcount} {headcount === 1 ? 'Employee' : 'Employees'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed mb-4 h-12 overflow-hidden text-ellipsis line-clamp-2">
                            {dept.description || 'No description provided.'}
                          </p>
                        </div>
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-semibold uppercase tracking-wider">Department Head</span>
                          <span className="text-slate-300 font-medium">
                            {dept.headId ? dept.headId.name : <span className="text-slate-600 italic">Unassigned</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          
          /* ================= EMPLOYEE DIRECTORY TAB ================= */
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <div>
                <h3 className="font-semibold text-white">Registered Users</h3>
                <p className="text-slate-500 text-[10px]">Verify access scopes and modify organizational mappings below.</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 text-brand-primary text-[10px] font-semibold flex items-center gap-1.5">
                <UserCheck size={12} /> Security Audited
              </span>
            </div>

            {loadingUsers ? (
              <div className="p-12 flex flex-col items-center gap-3">
                <Loader2 size={24} className="animate-spin text-brand-secondary" />
                <span className="text-slate-400 text-xs">Fetching directories...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider bg-white/[0.005]">
                      <th className="py-4 px-6 font-semibold">User details</th>
                      <th className="py-4 px-4 font-semibold">Registered Email</th>
                      <th className="py-4 px-4 font-semibold">Role Access Level</th>
                      <th className="py-4 px-4 font-semibold">Department Node</th>
                      <th className="py-4 px-6 font-semibold text-right">Row Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((item) => (
                      <tr key={item._id} className="hover:bg-white/[0.01] transition-colors group">
                        
                        {/* Name */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-xs">
                              {item.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white text-xs">{item.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">UID: {item._id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-4 px-4 text-slate-300 font-mono">
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <Mail size={12} className="text-slate-500 shrink-0" />
                            {item.email}
                          </div>
                        </td>

                        {/* Role dropdown */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Shield size={12} className="text-slate-500 shrink-0" />
                            <select
                              value={item.role}
                              disabled={updatingUserRow !== null}
                              onChange={(e) => handleUserUpdate(item._id, 'role', e.target.value)}
                              className="px-2 py-1.5 bg-dark-900 border border-white/5 rounded-lg text-slate-300 focus:border-brand-secondary outline-none text-xs cursor-pointer hover:border-white/10"
                            >
                              <option value="admin">Admin</option>
                              <option value="asset_manager">Asset Manager</option>
                              <option value="department_head">Department Head</option>
                              <option value="employee">Employee</option>
                            </select>
                          </div>
                        </td>

                        {/* Department dropdown */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            <Building2 size={12} className="text-slate-500 shrink-0" />
                            <select
                              value={item.departmentId || ''}
                              disabled={updatingUserRow !== null}
                              onChange={(e) => handleUserUpdate(item._id, 'departmentId', e.target.value)}
                              className="px-2 py-1.5 bg-dark-900 border border-white/5 rounded-lg text-slate-300 focus:border-brand-secondary outline-none text-xs cursor-pointer hover:border-white/10"
                            >
                              <option value="">-- Unassigned --</option>
                              {departments.map(dept => (
                                <option key={dept._id} value={dept._id}>{dept.name}</option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* Loading / Status Indicator */}
                        <td className="py-4 px-6 text-right">
                          {updatingUserRow === item._id ? (
                            <span className="inline-flex items-center gap-1 text-brand-secondary text-[10px] font-semibold bg-brand-secondary/10 px-2 py-0.5 rounded-full animate-pulse border border-brand-secondary/20">
                              <Loader2 size={10} className="animate-spin" /> Saving...
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-600 italic group-hover:text-slate-500 transition-colors">
                              Synced
                            </span>
                          )}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
}
