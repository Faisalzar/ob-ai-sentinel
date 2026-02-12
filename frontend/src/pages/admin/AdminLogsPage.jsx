import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { motion } from 'framer-motion';
import { LogStats } from '../../components/admin/LogStats';
import { LogsFilter } from '../../components/admin/LogsFilter';
import { LogList } from '../../components/admin/LogList';
import BasicPagination from '../../components/ui/basic-pagination';
import { Loader2, Download, Shield } from 'lucide-react';
import '../../styles/dashboard.css';

const AdminLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    action: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [selectedLogIds, setSelectedLogIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedLogIds([]); // New: Clear selections when search/filters change
  }, [searchQuery, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch a large batch to allow client-side filtering
      // In a real large-scale app, we'd implement full server-side filtering
      const data = await adminService.getAuditLogs(0, 1000);
      setLogs(data);
    } catch (err) {
      console.error("Failed to load logs", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      (log.user_email?.toLowerCase() || '').includes(searchLower) ||
      (log.action?.toLowerCase() || '').includes(searchLower) ||
      (log.resource?.toLowerCase() || '').includes(searchLower) ||
      (log.ip_address?.toLowerCase() || '').includes(searchLower);

    const matchAction = !filters.action || log.action === filters.action;
    const matchStatus = !filters.status || log.status === filters.status;

    return matchSearch && matchAction && matchStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">System Audit Logs</h1>
          <p className="text-zinc-400">Track and monitor all system activities and security events</p>
        </div>

        <button
          onClick={() => window.open(adminService.exportAuditLogs(selectedLogIds), '_blank')}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 border border-white/10"
        >
          <Download className="h-4 w-4" />
          {selectedLogIds.length > 0 ? `Export Selected (${selectedLogIds.length})` : 'Export All CSV'}
        </button>
      </header>

      {/* Live Stats */}
      <LogStats />

      {/* Main Content */}
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">

        <LogsFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
        />

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-white/5 p-4">
              <Shield className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-white">No logs found</h3>
            <p className="mt-2 text-zinc-400">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <LogList
              logs={paginatedLogs}
              startIndex={startIndex}
              selectedIds={selectedLogIds}
              onSelectRow={(id) => {
                setSelectedLogIds(prev =>
                  prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                );
              }}
              onSelectAll={(checked) => {
                if (checked) {
                  const paginatedIds = paginatedLogs.map(log => log.id);
                  setSelectedLogIds(prev => [...new Set([...prev, ...paginatedIds])]);
                } else {
                  const paginatedIds = paginatedLogs.map(log => log.id);
                  setSelectedLogIds(prev => prev.filter(id => !paginatedIds.includes(id)));
                }
              }}
            />

            {totalPages > 1 && (
              <div className="mt-4 border-t border-white/10 px-4">
                <BasicPagination
                  totalPages={totalPages}
                  initialPage={currentPage}
                  onPageChange={setCurrentPage}
                  variant="outline"
                  className="justify-center sm:justify-end"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminLogsPage;
