import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { motion } from 'framer-motion';
import { AlertStats } from '../../components/admin/AlertStats';
import { AlertsFilter } from '../../components/admin/AlertsFilter';
import { AlertList } from '../../components/admin/AlertList';
import { AlertDetailsModal } from '../../components/admin/AlertDetailsModal';
import BasicPagination from '../../components/ui/basic-pagination';
import { Loader2, Download } from 'lucide-react';
import '../../styles/dashboard.css';

const AdminAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    severity: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [alertsData, statsData] = await Promise.all([
        adminService.getAlerts(0, 1000), // Fetch more for client-side filtering
        adminService.getStats()
      ]);
      setAlerts(alertsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load alerts data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (alertId, newStatus) => {
    try {
      const updated = await adminService.updateAlert(alertId, { status: newStatus });
      setAlerts(prev => prev.map(a => a.id === alertId ? updated : a));

      // Update selected alert if open
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(updated);
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleUpdateNote = async (alertId, note) => {
    try {
      const updated = await adminService.updateAlert(alertId, { admin_notes: note });
      setAlerts(prev => prev.map(a => a.id === alertId ? updated : a));

      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(updated);
      }
    } catch (err) {
      console.error("Update note failed", err);
    }
  };

  // Filter Logic
  const filteredAlerts = alerts.filter(alert => {
    const matchSearch =
      (alert.object_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (alert.user_email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (alert.filename?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchSeverity = !filters.severity || alert.threat_level === filters.severity;
    const matchStatus = !filters.status || alert.status === filters.status;

    return matchSearch && matchSeverity && matchStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Threat Intelligence</h1>
          <p className="text-zinc-400">Monitor and manage detected security threats</p>
        </div>

        <button
          onClick={() => window.open(adminService.exportAlerts(), '_blank')}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 border border-white/10"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </header>

      {/* Stats Cards */}
      <AlertStats stats={stats} alerts={alerts} />

      {/* Main Content Info Panel */}
      <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-xl p-6">

        {/* Filters */}
        <AlertsFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filters={filters}
          setFilters={setFilters}
        />

        {/* List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-white/5 p-4">
              <ShieldAlert className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-white">No alerts found</h3>
            <p className="mt-2 text-zinc-400">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <AlertList
            alerts={paginatedAlerts}
            startIndex={startIndex}
            onStatusChange={handleStatusChange}
            onAddNote={(alert) => {
              setSelectedAlert(alert);
              // The modal will open and can be used to edit note
            }}
            onView={setSelectedAlert}
          />
        )}

        {/* Pagination Controls */}
        {!loading && filteredAlerts.length > 0 && totalPages > 1 && (
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
      </div>

      {/* Modal */}
      {selectedAlert && (
        <AlertDetailsModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onUpdateStatus={handleStatusChange}
          onUpdateNote={handleUpdateNote}
        />
      )}
    </div>
  );
};

export default AdminAlertsPage;
