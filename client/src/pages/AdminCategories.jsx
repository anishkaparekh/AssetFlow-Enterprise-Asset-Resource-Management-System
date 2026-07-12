import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../components/AdminLayout';
import { 
  Plus, Edit2, Trash2, Search, Loader2, AlertCircle, 
  CheckCircle2, Tags, ChevronLeft, ChevronRight, X
} from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    description: ''
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, assetRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/assets')
      ]);
      setCategories(catRes.data);
      setAssets(assetRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch categories and assets mapping databases.');
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

  const openAddModal = () => {
    setFormData({ id: null, name: '', description: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setFormData({
      id: cat._id,
      name: cat.name,
      description: cat.description || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({ id: null, name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      displayFeedback('error', 'Category name is required');
      return;
    }

    setActionLoading(true);
    setError(null);
    try {
      if (isEditing) {
        await axios.put(`/api/categories/${formData.id}`, formData);
        displayFeedback('success', `Category "${formData.name}" updated successfully.`);
      } else {
        await axios.post('/api/categories', formData);
        displayFeedback('success', `Category "${formData.name}" created successfully.`);
      }
      handleModalClose();
      await loadData();
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setActionLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/categories/${id}`);
      displayFeedback('success', `Category "${name}" deleted.`);
      await loadData();
    } catch (err) {
      displayFeedback('error', err.response?.data?.message || 'Failed to delete category.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Search
  const filteredCategories = categories.filter(cat => {
    const query = searchQuery.toLowerCase();
    const nameMatch = cat.name.toLowerCase().includes(query);
    const descMatch = (cat.description || '').toLowerCase().includes(query);
    return nameMatch || descMatch;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 font-sans">
        
        {/* Banner Headers */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">Asset Categories</h1>
            <p className="text-xs text-slate-400 mt-1">Manage asset types, descriptions, and view hardware mappings.</p>
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white text-xs font-semibold shadow-lg shadow-brand-primary/10 cursor-pointer transition-all"
          >
            <Plus size={14} />
            <span>Add Category</span>
          </button>
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

        {/* Search Input */}
        <div className="flex justify-between items-center bg-white/[0.01] border border-white/5 p-4 rounded-2xl gap-4">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Search categories by name, description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-dark-900 border border-white/10 focus:border-brand-primary rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Found {filteredCategories.length} categories</span>
        </div>

        {/* CRUD Table */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="animate-spin text-brand-secondary" />
            <span className="text-slate-400 text-xs">Fetching asset categories...</span>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="glass p-16 text-center text-slate-500 text-xs rounded-2xl border border-white/5">
            No categories found matching search filters.
          </div>
        ) : (
          <div className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-400 uppercase tracking-wider bg-white/[0.005]">
                    <th className="py-4 px-6 font-semibold">Category Name</th>
                    <th className="py-4 px-4 font-semibold">Description</th>
                    <th className="py-4 px-4 font-semibold">Asset Load (Assigned count)</th>
                    <th className="py-4 px-6 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {currentItems.map((cat) => {
                    const count = assets.filter(a => a.category === cat.name).length;
                    return (
                      <tr key={cat._id} className="hover:bg-white/[0.01] transition-all group">
                        
                        <td className="py-4 px-6 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Tags size={14} className="text-brand-secondary" />
                            {cat.name}
                          </div>
                        </td>

                        <td className="py-4 px-4 max-w-md truncate text-slate-400" title={cat.description}>
                          {cat.description || <span className="text-slate-600 italic">No description provided</span>}
                        </td>

                        <td className="py-4 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-brand-primary/10 border border-brand-primary/15 text-brand-primary text-[10px] font-semibold font-mono">
                            {count} Hardware {count === 1 ? 'item' : 'items'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => openEditModal(cat)}
                              className="p-1.5 rounded bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary border border-brand-secondary/20 transition-all cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(cat._id, cat.name)}
                              className="p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass max-w-md w-full p-6 rounded-2xl border border-white/5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
              
              <button
                onClick={handleModalClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <h3 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Tags size={18} className="text-brand-secondary" />
                {isEditing ? 'Update Category' : 'New Category'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Category Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Tablet, Router, Office Chairs"
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase text-slate-500 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe category..."
                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary outline-none transition-all resize-none"
                  />
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
                        Saving...
                      </>
                    ) : (
                      <span>Save Category</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleModalClose}
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
