import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Filter, Download, UserPlus, MoreVertical,
  ChevronDown, Trash2, Power, RefreshCw, Mail, Shield,
  LogOut, Check, X as XIcon
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { UserStatsCards } from '../../components/admin/user-stats-cards';
import { UserDetailsModal } from '../../components/admin/user-details-modal';
import { CreateUserModal } from '../../components/admin/create-user-modal';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserDetails, setShowUserDetails] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    mfa: 'all',
    verified: 'all'
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Stats
  const [stats, setStats] = useState({
    total_users: 0,
    active_users: 0,
    suspended_users: 0,
    online_users: 0
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, filters]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(0, 100);
      setUsers(data);

      // Calculate stats
      setStats({
        total_users: data.length,
        active_users: data.filter(u => u.is_active).length,
        suspended_users: data.filter(u => !u.is_active).length,
        online_users: data.filter(u => u.is_online).length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...users];

    // Search
    if (searchQuery) {
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter(u => u.role === filters.role);
    }

    // Status filter
    if (filters.status === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (filters.status === 'suspended') {
      filtered = filtered.filter(u => !u.is_active);
    }

    // MFA filter
    if (filters.mfa === 'enabled') {
      filtered = filtered.filter(u => u.mfa_state === 'ENABLED');
    } else if (filters.mfa === 'disabled') {
      filtered = filtered.filter(u => u.mfa_state !== 'ENABLED');
    }

    // Verified filter
    if (filters.verified === 'yes') {
      filtered = filtered.filter(u => u.is_verified);
    } else if (filters.verified === 'no') {
      filtered = filtered.filter(u => !u.is_verified);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleToggleActive = async (user) => {
    if (!window.confirm(`Are you sure you want to ${user.is_active ? 'suspend' : 'activate'} ${user.name}?`)) return;

    setActionLoading(user.id);
    try {
      await adminService.updateUser(user.id, { is_active: !user.is_active });
      setUsers(users.map(u => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleResetMFA = async (user) => {
    if (!window.confirm(`Reset MFA for ${user.name}? This will disable their MFA.`)) return;

    setActionLoading(user.id);
    try {
      await adminService.resetMfa(user.id);
      setUsers(users.map(u => u.id === user.id ? { ...u, mfa_state: 'DISABLED' } : u));
      alert('MFA reset successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleForceLogout = async (user) => {
    if (!window.confirm(`Force logout for ${user.name}?`)) return;

    setActionLoading(user.id);
    try {
      await adminService.forceLogout(user.id);
      alert('User logged out successfully');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
      setOpenDropdown(null);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      // Prepare data for API
      const payload = {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        is_active: true
      };

      // Add password if not sending invite
      if (!userData.sendInvite && userData.password) {
        payload.password = userData.password;
      }

      // Create user via API
      await adminService.createUser(payload);

      // Reload users list
      await loadUsers();

      // Show success message
      alert(`User ${userData.name} created successfully!${userData.sendInvite ? ' An invitation email will be sent.' : ''}`);
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(error.message || 'Failed to create user. Please try again.');
    }
  };


  const handleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map(u => u.id));
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.length === 0) return;

    const confirmMessage = `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`;
    if (!window.confirm(confirmMessage)) return;

    console.log(`Bulk ${action}:`, selectedUsers);
    // Implement bulk actions here
    setSelectedUsers([]);
  };

  const handleExport = () => {
    // Export selected users if any are selected, otherwise export all filtered users
    const usersToExport = selectedUsers.length > 0
      ? filteredUsers.filter(u => selectedUsers.includes(u.id))
      : filteredUsers;

    const csv = [
      ['Name', 'Email', 'Role', 'Status', 'MFA', 'Verified', 'Last Login'],
      ...usersToExport.map(u => [
        u.name,
        u.email,
        u.role,
        u.is_active ? 'Active' : 'Suspended',
        u.mfa_state,
        u.is_verified ? 'Yes' : 'No',
        u.last_login_at || 'Never'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = selectedUsers.length > 0
      ? `users_selected_${selectedUsers.length}.csv`
      : 'users_all.csv';
    a.download = filename;
    a.click();
  };

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage and monitor all system users</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadUsers}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <UserStatsCards stats={stats} />

        {/* Search and Filters */}
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl p-6 shadow-2xl">
          <div className="flex flex-col gap-6">
            {/* Search Bar - Full Width */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-purple-400 z-10" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 pl-12 pr-4 py-3.5 text-sm text-white placeholder-zinc-400 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 text-zinc-400 hover:text-white transition-colors"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Filter className="h-4 w-4" />
                <span>Filters:</span>
              </div>

              <div className="flex flex-wrap gap-3 flex-1">
                {/* Role Filter */}
                <div className="relative group">
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="appearance-none rounded-lg border border-white/10 bg-gradient-to-br from-purple-500/10 to-purple-600/5 pl-4 pr-10 py-2.5 text-sm text-white font-medium focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="ADMIN">Admin</option>
                    <option value="USER">User</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="relative group">
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="appearance-none rounded-lg border border-white/10 bg-gradient-to-br from-green-500/10 to-green-600/5 pl-4 pr-10 py-2.5 text-sm text-white font-medium focus:border-green-500/50 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-400 pointer-events-none" />
                </div>

                {/* MFA Filter */}
                <div className="relative group">
                  <select
                    value={filters.mfa}
                    onChange={(e) => setFilters({ ...filters, mfa: e.target.value })}
                    className="appearance-none rounded-lg border border-white/10 bg-gradient-to-br from-blue-500/10 to-blue-600/5 pl-4 pr-10 py-2.5 text-sm text-white font-medium focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                  >
                    <option value="all">All MFA</option>
                    <option value="enabled">MFA Enabled</option>
                    <option value="disabled">MFA Disabled</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400 pointer-events-none" />
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-gradient-to-br from-orange-500/10 to-orange-600/5 px-4 py-2.5 text-sm font-medium text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/30 transition-all group"
              >
                <Download className="h-4 w-4 group-hover:animate-bounce" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || filters.role !== 'all' || filters.status !== 'all' || filters.mfa !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                <span className="text-xs text-zinc-500">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs text-purple-300">
                    Search: "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="hover:text-white">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.role !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-500/30 px-3 py-1 text-xs text-purple-300">
                    Role: {filters.role}
                    <button onClick={() => setFilters({ ...filters, role: 'all' })} className="hover:text-white">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.status !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 border border-green-500/30 px-3 py-1 text-xs text-green-300">
                    Status: {filters.status}
                    <button onClick={() => setFilters({ ...filters, status: 'all' })} className="hover:text-white">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {filters.mfa !== 'all' && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 border border-blue-500/30 px-3 py-1 text-xs text-blue-300">
                    MFA: {filters.mfa}
                    <button onClick={() => setFilters({ ...filters, mfa: 'all' })} className="hover:text-white">
                      <XIcon className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilters({ role: 'all', status: 'all', mfa: 'all', verified: 'all' });
                  }}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-3 rounded-lg border border-purple-500/30 bg-purple-500/10 p-3"
            >
              <span className="text-sm text-purple-400">{selectedUsers.length} selected</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-400 hover:bg-green-500/20"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkAction('suspend')}
                  className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-400 hover:bg-orange-500/20"
                >
                  Suspend
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs text-white hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Users Table */}
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 backdrop-blur-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">MFA</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Verified</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">Last Login</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-zinc-500">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading users...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-zinc-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setShowUserDetails(user)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          className="h-4 w-4 rounded border-white/10 bg-white/5 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30">
                            <span className="text-sm font-semibold text-purple-400">
                              {user.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{user.name}</p>
                            <p className="text-xs text-zinc-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${user.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {user.is_online && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          )}
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${user.is_active
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                            {user.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-zinc-400">{user.mfa_state || 'DISABLED'}</span>
                      </td>
                      <td className="px-4 py-4">
                        {user.is_verified ? (
                          <Check className="h-4 w-4 text-green-400" />
                        ) : (
                          <XIcon className="h-4 w-4 text-red-400" />
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-zinc-500">
                          {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === user.id ? null : user.id)}
                            className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {openDropdown === user.id && (
                            <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-white/10 bg-zinc-900 shadow-xl">
                              <button
                                onClick={() => handleToggleActive(user)}
                                disabled={actionLoading === user.id}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/10"
                              >
                                <Power className="h-4 w-4" />
                                {user.is_active ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleForceLogout(user)}
                                disabled={actionLoading === user.id || !user.is_online}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
                              >
                                <LogOut className="h-4 w-4" />
                                Force Logout
                              </button>
                              <button
                                onClick={() => handleResetMFA(user)}
                                disabled={actionLoading === user.id}
                                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white hover:bg-white/10"
                              >
                                <Shield className="h-4 w-4" />
                                Reset MFA
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-zinc-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white hover:bg-white/10 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUserDetails && (
        <UserDetailsModal
          user={showUserDetails}
          onClose={() => setShowUserDetails(null)}
          onUpdate={loadUsers}
        />
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateUser}
        />
      )}
    </div>
  );
};

export default AdminUsersPage;
