import React, { useEffect, useState, useMemo } from 'react';
import { adminService } from '../../services/adminService';
import { UploadStats } from '../../components/admin/UploadStats';
import { UploadsFilter } from '../../components/admin/UploadsFilter';
import { UploadCard } from '../../components/admin/UploadCard';
import { UploadPreviewModal } from '../../components/admin/UploadPreviewModal';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2 } from 'lucide-react';
import '../../styles/dashboard.css'; // Keep for base styles if needed
import API_BASE_URL from '../../services/apiConfig';

const AdminUploadsPage = () => {
  // Data State
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    threat: ''
  });

  // Selection & Modal State
  const [selectedUploads, setSelectedUploads] = useState(new Set());
  const [previewUpload, setPreviewUpload] = useState(null);

  // Initial Load
  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUploads();
      setUploads(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load uploads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredUploads = useMemo(() => {
    return uploads.filter(upload => {
      // Search
      const matchesSearch = upload.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        upload.id.toLowerCase().includes(searchQuery.toLowerCase());

      // Type Filter
      const matchesType = !filters.type || upload.file_type === filters.type;

      // Status Filter
      const matchesStatus = !filters.status ||
        (filters.status === 'processed' ? upload.is_processed : !upload.is_processed);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [uploads, searchQuery, filters]);

  // Selection Logic
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedUploads);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedUploads(newSelected);
  };

  const clearSelection = () => setSelectedUploads(new Set());

  // Actions
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this upload? This action cannot be undone.")) return;
    try {
      await adminService.deleteUpload(id);
      setUploads(prev => prev.filter(u => u.id !== id));
      if (selectedUploads.has(id)) {
        const newSelected = new Set(selectedUploads);
        newSelected.delete(id);
        setSelectedUploads(newSelected);
      }
      if (previewUpload?.id === id) setPreviewUpload(null);
    } catch (err) {
      alert("Failed to delete upload");
    }
  };

  const handleReprocess = async (id) => {
    try {
      // Optimistic update or just notification
      // We could show a toast here
      const updated = await adminService.reprocessUpload(id);
      // Reload to get fresh data
      loadUploads();
      alert("Reprocessing started!");
    } catch (err) {
      alert("Failed to reprocess: " + err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedUploads.size} items?`)) return;

    const ids = Array.from(selectedUploads);
    // Sequential delete for now, or add bulk endpoint later
    for (const id of ids) {
      try {
        await adminService.deleteUpload(id);
      } catch (e) {
        console.error(`Failed to delete ${id}`, e);
      }
    }
    setUploads(prev => prev.filter(u => !selectedUploads.has(u.id)));
    clearSelection();
  };

  const handleBulkReprocess = async () => {
    const ids = Array.from(selectedUploads);
    alert(`Starting reprocessing for ${ids.length} items...`);
    for (const id of ids) {
      try {
        await adminService.reprocessUpload(id);
      } catch (e) {
        console.error(`Failed to reprocess ${id}`, e);
      }
    }
    loadUploads();
    clearSelection();
  };

  const helperGetPreviewUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_BASE_URL.replace('/api/v1', '')}/${path}`;
  };

  return (
    <div className="page min-h-screen bg-black">
      <header className="sentinel-topbar px-8 py-6 border-b border-white/10 backdrop-blur-md bg-black/50 sticky top-0 z-40">
        <div>
          <h1 className="text-2xl font-bold text-white">Digital Assets</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage and monitor all uploaded media</p>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto">
        {/* Stats Section */}
        <UploadStats uploads={uploads} />

        {/* Filters & Toolbar */}
        <UploadsFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filters={filters}
          setFilters={setFilters}
          selectedCount={selectedUploads.size}
          onClearSelection={clearSelection}
          onBulkDelete={handleBulkDelete}
          onBulkReprocess={handleBulkReprocess}
        />

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-purple-500" />
            <p>Loading assets...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-red-400">
            <AlertCircle className="h-10 w-10 mb-4" />
            <p>{error}</p>
            <button onClick={loadUploads} className="mt-4 text-sm underline hover:text-white">Try Again</button>
          </div>
        ) : filteredUploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
            <p>No uploads found matching your criteria</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence>
                  {filteredUploads.map(upload => (
                    <UploadCard
                      key={upload.id}
                      upload={upload}
                      isSelected={selectedUploads.has(upload.id)}
                      onSelect={toggleSelection}
                      onView={setPreviewUpload}
                      onReprocess={handleReprocess}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
                <table className="w-full text-left text-sm text-zinc-400">
                  <thead className="bg-white/5 text-xs uppercase font-medium text-zinc-300">
                    <tr>
                      <th className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUploads.size === filteredUploads.length && filteredUploads.length > 0}
                          onChange={() => {
                            if (selectedUploads.size === filteredUploads.length) {
                              clearSelection();
                            } else {
                              setSelectedUploads(new Set(filteredUploads.map(u => u.id)));
                            }
                          }}
                          className="rounded border-white/20 bg-black/50 text-purple-500 focus:ring-purple-500/50"
                        />
                      </th>
                      <th className="px-6 py-4">File</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Detections</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUploads.map(upload => (
                      <tr
                        key={upload.id}
                        className={`hover:bg-white/5 transition-colors ${selectedUploads.has(upload.id) ? 'bg-purple-500/5' : ''}`}
                      >
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUploads.has(upload.id)}
                            onChange={() => toggleSelection(upload.id)}
                            className="rounded border-white/20 bg-black/50 text-purple-500 focus:ring-purple-500/50"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-10 w-16 overflow-hidden rounded bg-black/50 cursor-pointer hover:ring-2 ring-purple-500/50 transition-all"
                              onClick={() => setPreviewUpload(upload)}
                            >
                              {upload.file_type === 'image' && (
                                <img
                                  src={helperGetPreviewUrl(upload.annotated_path || upload.file_path)}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-white max-w-[200px] truncate" title={upload.filename}>{upload.filename}</p>
                              <p className="text-xs uppercase text-zinc-600">{upload.file_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {upload.is_processed ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                              <div className="h-1.5 w-1.5 rounded-full bg-green-500" /> Processed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400">
                              <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse" /> Processing
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {upload.detection_summary && (
                            <div className="flex gap-2 text-xs">
                              {upload.detection_summary.dangerous > 0 && <span className="text-red-400 font-bold">{upload.detection_summary.dangerous} Danger</span>}
                              {upload.detection_summary.caution > 0 && <span className="text-orange-400">{upload.detection_summary.caution} Caution</span>}
                              {upload.detection_summary.harmless > 0 && <span className="text-blue-400">{upload.detection_summary.harmless} Check</span>}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs font-mono">
                          {new Date(upload.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setPreviewUpload(upload)}
                              className="p-1.5 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                              title="View"
                            >
                              Viewing
                            </button>
                            <button
                              onClick={() => handleDelete(upload.id)}
                              className="p-1.5 hover:bg-red-500/10 rounded text-zinc-400 hover:text-red-400"
                              title="Delete"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <UploadPreviewModal
        upload={previewUpload}
        onClose={() => setPreviewUpload(null)}
      />
    </div>
  );
};

export default AdminUploadsPage;
