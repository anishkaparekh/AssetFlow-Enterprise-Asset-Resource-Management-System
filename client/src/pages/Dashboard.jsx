import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  Layers, 
  User, 
  Mail, 
  Shield, 
  Server, 
  RefreshCw, 
  Building2, 
  Cpu, 
  Wrench, 
  Bell, 
  TrendingUp,
  BookOpen,
  AlertTriangle,
  FolderOpen,
  Check,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/dashboard/stats');
      setDashboardData(res.data);
      
      // Also fetch unread notifications count
      const notifRes = await axios.get('/api/notifications');
      const unreads = notifRes.data.filter(n => !n.isRead).length;
      setUnreadCount(unreads);
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

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

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'asset_manager':
        return 'bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20';
      case 'department_head':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-mesh relative overflow-x-hidden">
      
      {/* Decorative Glows */}
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

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all border border-transparent hover:border-white/5 cursor-pointer"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
              )}
            </button>

             {/* Custom Nav Actions */}
            <button
              onClick={() => navigate('/maintenance')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                location.pathname === '/maintenance'
                  ? 'bg-brand-secondary/15 text-brand-secondary border-brand-secondary/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border-white/5'
              }`}
            >
              <Wrench size={12} />
              <span>Maintenance</span>
            </button>

            {(user.role === 'admin' || user.role === 'asset_manager') && (
              <button
                onClick={() => navigate('/assets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  location.pathname === '/assets' || location.pathname === '/asset-manager'
                    ? 'bg-brand-primary/15 text-brand-primary border-brand-primary/25'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 border-white/5'
                }`}
              >
                <Cpu size={12} />
                <span>Inventory</span>
              </button>
            )}

            <button
              onClick={() => navigate('/allocations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                location.pathname === '/allocations'
                  ? 'bg-brand-primary/15 text-brand-primary border-brand-primary/25'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border-white/5'
              }`}
            >
              <ClipboardList size={12} />
              <span>Allocations</span>
            </button>

            {user.role && user.role.toLowerCase() === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  location.pathname === '/admin' || location.pathname === '/admin/dashboard'
                    ? 'bg-brand-primary/20 border-brand-primary/35 text-brand-primary'
                    : 'bg-brand-primary/10 border-brand-primary/25 text-brand-primary hover:bg-brand-primary/20'
                }`}
              >
                Admin Panel
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel */}
      <main className="max-w-7xl mx-auto px-6 py-10 relative z-10">
        
        {/* Welcome Banner */}
        <div className="glass p-8 rounded-2xl border border-white/5 mb-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-brand-secondary/5 to-transparent pointer-events-none"></div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white tracking-tight">Welcome, {user.name}!</h1>
            <p className="text-slate-400 text-xs mt-1">
              Currently connected to the <strong className="text-slate-300">AssetFlow ERP Cluster</strong>. Your mapped authorization scope is shown below.
            </p>
          </div>
          <div>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${getRoleBadge(user.role)}`}>
              Role: {user.role}
            </span>
          </div>
        </div>

        {loading ? (
          /* Shimmering Loader */
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(idx => (
              <div key={idx} className="glass p-6 rounded-2xl border border-white/5 animate-pulse h-28"></div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI STATS BLOCKS (ROLE BASED) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              
              {/* ADMIN VIEW STATS */}
              {user.role === 'admin' && dashboardData?.stats && (
                <>
                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-primary/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
                      <div className="text-2xl font-bold text-white mt-1">{dashboardData.stats.totalUsers}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><User size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-secondary/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Departments</span>
                      <div className="text-2xl font-bold text-white mt-1">{dashboardData.stats.totalDepartments}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary"><Building2 size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Assets Count</span>
                      <div className="text-2xl font-bold text-white mt-1">{dashboardData.stats.totalAssets}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400"><Cpu size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-accent/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Active Audits</span>
                      <div className="text-2xl font-bold text-white mt-1">{dashboardData.stats.activeAudits}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent"><AlertTriangle size={20} /></div>
                  </div>
                </>
              )}

              {/* ASSET MANAGER VIEW STATS */}
              {user.role === 'asset_manager' && dashboardData?.stats && (
                <>
                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-yellow-500/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pending Maintenance</span>
                      <div className="text-2xl font-bold text-yellow-400 mt-1">{dashboardData.stats.pendingMaintenance}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400"><Clock size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-orange-500/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Assets Under Maintenance</span>
                      <div className="text-2xl font-bold text-orange-400 mt-1">{dashboardData.stats.assetsUnderMaintenance}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400"><Wrench size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Completed Today</span>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">{dashboardData.stats.completedToday}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><CheckCircle2 size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-primary/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Available Assets</span>
                      <div className="text-2xl font-bold text-white mt-1">{dashboardData.stats.availableAssets}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Cpu size={20} /></div>
                  </div>
                </>
              )}

              {/* DEPARTMENT HEAD VIEW STATS */}
              {user.role === 'department_head' && dashboardData?.stats && (
                <>
                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-primary/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dept Assets</span>
                      <div className="text-2xl font-bold text-white mt-1">{dashboardData.stats.departmentAssets}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Building2 size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-yellow-500/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
                      <div className="text-2xl font-bold text-yellow-400 mt-1">{dashboardData.stats.pendingApprovals}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400"><AlertTriangle size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-secondary/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Team Bookings</span>
                      <div className="text-2xl font-bold text-white mt-1">{dashboardData.stats.teamBookings}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-secondary/10 flex items-center justify-center text-brand-secondary"><BookOpen size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Department Code</span>
                      <div className="text-sm font-bold text-brand-secondary mt-2 font-mono truncate">{user.departmentId || 'Unmapped'}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400"><FolderOpen size={20} /></div>
                  </div>
                </>
              )}

              {/* EMPLOYEE VIEW STATS */}
              {user.role === 'employee' && dashboardData?.stats && (
                <>
                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-primary/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">My Assets</span>
                      <div className="text-2xl font-bold text-white mt-1">{dashboardData.stats.myAssetsCount}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary"><Cpu size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-brand-secondary/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Pending Maintenance</span>
                      <div className="text-2xl font-bold text-yellow-400 mt-1">{dashboardData.stats.pendingMaintenance}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400"><Clock size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-emerald-500/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Completed Maintenance</span>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">{dashboardData.stats.completedMaintenance}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><CheckCircle2 size={20} /></div>
                  </div>

                  <div className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-orange-500/20 transition-all">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Current Allocations</span>
                      <div className="text-2xl font-bold text-orange-400 mt-1">{dashboardData.stats.currentAllocations}</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400"><Wrench size={20} /></div>
                  </div>
                </>
              )}

            </div>

            {/* LISTINGS & TABLES (ROLE SPECIFIC DETAIL BOARDS) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* PRIMARY CONTENT BLOCK */}
              <div className="lg:col-span-8">
                
                {/* Employee custody list */}
                {user.role === 'employee' && (
                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 bg-white/[0.005]">
                      <h3 className="font-semibold text-white text-sm">Assets Under My Custody</h3>
                      <p className="text-slate-500 text-[10px]">These hardware resources are assigned to your profile identifier.</p>
                    </div>
                    {!dashboardData.myAllocations || dashboardData.myAllocations.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 text-xs">
                        You do not hold custody over any assets at the moment.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-slate-400 bg-white/[0.002]">
                              <th className="p-4">Asset Name</th>
                              <th className="p-4">Tag Reference</th>
                              <th className="p-4">Category</th>
                              <th className="p-4">Allocation Date</th>
                              <th className="p-4">Current Status</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {dashboardData.myAllocations.map((item) => (
                              <tr key={item._id} className="hover:bg-white/[0.005]">
                                <td className="p-4 text-white font-semibold">{item.assetId?.name || 'Unknown Asset'}</td>
                                <td className="p-4 text-slate-400 font-mono">{item.assetId?.assetTag || 'N/A'}</td>
                                <td className="p-4 text-slate-400">{item.assetId?.category || 'N/A'}</td>
                                <td className="p-4 text-slate-400 font-mono text-[10px]">
                                  {new Date(item.allocatedAt).toLocaleDateString()}
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                    item.assetId?.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-primary/10 text-brand-primary'
                                  }`}>
                                    {item.assetId?.status || 'Allocated'}
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  {item.assetId && item.assetId.status === 'Allocated' && (
                                    <button
                                      onClick={() => navigate(`/maintenance?assetId=${item.assetId._id}`)}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/25 transition-all cursor-pointer"
                                    >
                                      Raise Maintenance
                                    </button>
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

                {/* Asset Manager ongoing maintenance list */}
                {user.role === 'asset_manager' && (
                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 bg-white/[0.005]">
                      <h3 className="font-semibold text-white text-sm">Ongoing Maintenance Dispatch logs</h3>
                      <p className="text-slate-500 text-[10px]">List of hardware undergoing structural repair and testing.</p>
                    </div>
                    {!dashboardData.activeMaintenanceList || dashboardData.activeMaintenanceList.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 text-xs">
                        No active maintenance cycles in progress today.
                      </div>
                    ) : (
                      <div className="p-5 space-y-3">
                        {dashboardData.activeMaintenanceList.map((item) => (
                          <div key={item._id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <strong className="text-white">{item.assetId?.name}</strong>{' '}
                              <span className="text-slate-400">({item.assetId?.assetTag})</span>
                              <p className="text-[10px] text-slate-500 mt-1">Requested by: {item.requesterId?.name} • Status: <strong className="text-orange-400">{item.status}</strong></p>
                            </div>
                            <button
                              onClick={() => navigate('/maintenance')}
                              className="px-2.5 py-1 text-[10px] font-semibold bg-white/5 border border-white/10 hover:border-white/20 rounded-lg text-white"
                            >
                              Dispatch
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Department Head custody list */}
                {user.role === 'department_head' && (
                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 bg-white/[0.005]">
                      <h3 className="font-semibold text-white text-sm">Department Resource Inventory</h3>
                      <p className="text-slate-500 text-[10px]">Assets currently mapped to department code: <strong className="text-brand-secondary">{userDeptId}</strong>.</p>
                    </div>
                    {!dashboardData.deptAssetsList || dashboardData.deptAssetsList.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 text-xs">
                        No department assets found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider text-slate-400 bg-white/[0.002]">
                              <th className="p-4">Asset Name</th>
                              <th className="p-4">Tag Reference</th>
                              <th className="p-4">Holder</th>
                              <th className="p-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {dashboardData.deptAssetsList.map((asset) => (
                              <tr key={asset._id} className="hover:bg-white/[0.005]">
                                <td className="p-4 text-white font-semibold">{asset.name}</td>
                                <td className="p-4 text-slate-400 font-mono">{asset.assetTag}</td>
                                <td className="p-4 text-slate-400">{asset.currentHolderId ? asset.currentHolderId.name : <span className="text-slate-600 italic">Unassigned</span>}</td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                                    asset.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-brand-primary/10 text-brand-primary'
                                  }`}>
                                    {asset.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin user directory preview */}
                {user.role === 'admin' && (
                  <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                    <div className="p-5 border-b border-white/5 bg-white/[0.005]">
                      <h3 className="font-semibold text-white text-sm">Recent User Enrollments</h3>
                      <p className="text-slate-500 text-[10px]">Latest profiles registered into the system registry database.</p>
                    </div>
                    {!dashboardData.recentUsers || dashboardData.recentUsers.length === 0 ? (
                      <div className="p-10 text-center text-slate-500 text-xs">
                        No user listings found.
                      </div>
                    ) : (
                      <div className="p-5 space-y-3">
                        {dashboardData.recentUsers.map((item) => (
                          <div key={item._id} className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center justify-between text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-brand-primary/20 text-brand-primary flex items-center justify-center font-bold text-[10px]">
                                {item.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong className="text-white">{item.name}</strong>{' '}
                                <span className="text-slate-400">({item.email})</span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full bg-brand-secondary/15 text-brand-secondary text-[8px] font-semibold border border-brand-secondary/20">
                              {item.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

              {/* RIGHT SIDEBAR PANEL */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Profile Card */}
                <div className="glass p-6 rounded-2xl border border-white/5 text-xs">
                  <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{user.name}</h3>
                      <span className="text-slate-500 font-mono text-[9px]">{user.email}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Mapped Department:</span>
                      <strong className="text-slate-300 font-mono">{user.departmentId || 'Unmapped'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Access Role:</span>
                      <strong className="text-slate-300">{user.role}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Token Lifetime:</span>
                      <strong className="text-emerald-400">Active (24h JWT)</strong>
                    </div>
                  </div>
                </div>

                {/* Quick Navigation Card */}
                <div className="glass p-6 rounded-2xl border border-white/5 text-xs">
                  <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    {user.role === 'employee' && (
                      <>
                        <button
                          onClick={() => {
                            const firstAsset = dashboardData?.myAllocations?.[0]?.assetId?._id;
                            if (firstAsset) {
                              navigate(`/maintenance?assetId=${firstAsset}`);
                            } else {
                              navigate('/maintenance');
                            }
                          }}
                          className="w-full py-2.5 px-4 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 rounded-xl text-left text-xs font-semibold text-brand-primary hover:border-brand-primary/30 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <span>Raise Maintenance</span>
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => {
                            document.getElementById('my-custody-assets')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left text-xs font-semibold text-white hover:border-white/10 transition-all cursor-pointer"
                        >
                          View My Assets
                        </button>
                        <button
                          onClick={() => navigate('/maintenance')}
                          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left text-xs font-semibold text-white hover:border-white/10 transition-all cursor-pointer"
                        >
                          View Maintenance History
                        </button>
                      </>
                    )}

                    {user.role === 'asset_manager' && (
                      <>
                        <button
                          onClick={() => navigate('/maintenance')}
                          className="w-full py-2.5 px-4 bg-brand-primary/10 hover:bg-brand-primary/20 border border-brand-primary/20 rounded-xl text-left text-xs font-semibold text-brand-primary hover:border-brand-primary/30 transition-all flex items-center justify-between cursor-pointer"
                        >
                          <span>Approve Request</span>
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => navigate('/assets')}
                          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left text-xs font-semibold text-white hover:border-white/10 transition-all cursor-pointer"
                        >
                          View Assets
                        </button>
                        <button
                          onClick={() => navigate('/assets?tab=allocations')}
                          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left text-xs font-semibold text-white hover:border-white/10 transition-all cursor-pointer"
                        >
                          View Allocation History
                        </button>
                      </>
                    )}

                    {/* Default Alert Center navigation for all roles */}
                    <button
                      onClick={() => navigate('/notifications')}
                      className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left text-xs font-semibold text-slate-400 hover:text-white hover:border-white/10 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <span>Alert Center</span>
                      <span className="bg-brand-secondary/20 text-brand-secondary font-bold rounded-full w-5 h-5 text-[9px] flex items-center justify-center border border-brand-secondary/35">
                        {unreadCount}
                      </span>
                    </button>
                  </div>
                </div>

                {/* API Details Panel */}
                <div className="glass p-6 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3 mb-4">
                    <Server size={14} className="text-brand-secondary" />
                    <h3 className="font-semibold text-white text-xs">Cluster Metadata</h3>
                  </div>
                  <div className="bg-dark-900/60 p-4 rounded-xl border border-white/5 font-mono text-[9px] text-slate-500 space-y-1 overflow-x-auto">
                    <div>API base: http://localhost:5000</div>
                    <div>UID: {user._id}</div>
                  </div>
                </div>

              </div>

            </div>
          </>
        )}

      </main>

    </div>
  );
}
