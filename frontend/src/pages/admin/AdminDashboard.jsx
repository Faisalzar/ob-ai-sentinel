import React, { useState, useEffect } from 'react';
import { Users, Activity, Shield, Upload } from 'lucide-react';
import { DashboardCard } from '../../components/ui/dashboard-card';
import { RevenueChart } from '../../components/ui/revenue-chart';
import { UsersTable } from '../../components/ui/users-table';
import { QuickActions } from '../../components/ui/quick-actions';
import { SystemStatus } from '../../components/ui/system-status';
import { RecentActivity } from '../../components/ui/recent-activity';
import { adminService } from '../../services/adminService';



export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentUsers, setRecentUsers] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      // Parallel data fetching
      const [statsData, usersData, alertsData, health, logs] = await Promise.all([
        adminService.getStats(),
        adminService.getUsers(0, 20), // Get 20 most recent users for pagination
        adminService.getAlerts(0, 100), // Get recent alerts for chart
        adminService.getSystemHealth().catch(() => null), // Fail gracefully
        adminService.getAuditLogs(0, 5).catch(() => []), // Fail gracefully
      ]);

      setStats(statsData);
      setRecentUsers(usersData);

      // Process Health Data
      if (health) {
        setHealthData([
          {
            label: "Database",
            status: health.database === 'healthy' ? 'Healthy' : 'Issues',
            color: health.database === 'healthy' ? 'text-green-500' : 'text-red-500',
            icon: Shield,
            percentage: health.database === 'healthy' ? 100 : 0
          },
          {
            label: "AI Model",
            status: health.ai_model === 'loaded' ? 'Active' : 'Offline',
            color: health.ai_model === 'loaded' ? 'text-green-500' : 'text-yellow-500',
            icon: Activity,
            percentage: health.ai_model === 'loaded' ? 100 : 0
          },
          {
            label: "CPU Usage",
            status: `${health.system?.cpu_percent}%`,
            color: health.system?.cpu_percent > 80 ? 'text-red-500' : 'text-blue-500',
            icon: Activity, // Reusing Activity icon
            percentage: health.system?.cpu_percent || 0
          },
          {
            label: "Storage",
            status: `${health.system?.disk_percent}% Used`,
            color: health.system?.disk_percent > 90 ? 'text-red-500' : 'text-yellow-500',
            icon: Upload, // Reusing Upload icon as proxy for storage/disk
            percentage: health.system?.disk_percent || 0
          }
        ]);
      }

      // Process Activity Logs
      if (logs && Array.isArray(logs)) {
        const mappedLogs = logs.map(log => {
          let icon = Users;
          let color = 'text-blue-500';

          if (log.action.includes('delete')) { icon = Shield; color = 'text-red-500'; }
          else if (log.action.includes('update')) { icon = Activity; color = 'text-orange-500'; }
          else if (log.action.includes('upload')) { icon = Upload; color = 'text-green-500'; }
          else if (log.action.includes('login')) { icon = Users; color = 'text-purple-500'; }

          // Calc time ago
          const createdTime = log.created_at.endsWith('Z') ? log.created_at : `${log.created_at}Z`;
          const date = new Date(createdTime);
          const now = new Date();
          const diffMins = Math.floor((now - date) / 60000);
          const timeStr = diffMins < 60 ? `${diffMins} min ago` : diffMins < 1440 ? `${Math.floor(diffMins / 60)} hrs ago` : date.toLocaleDateString();

          return {
            action: log.action.replace('_', ' '), // e.g. delete_user -> delete user
            user: log.user_email || 'System',
            time: timeStr,
            icon: icon,
            color: color
          };
        });
        setRecentActivity(mappedLogs);
      }

      // Process alerts for chart (Group by Date - Last 7 days)
      const last7Days = [];
      const today = new Date();

      // Generate last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        last7Days.push({
          label: dayName,
          dateKey: dateKey,
          value: 0,
          color: "bg-blue-500"
        });
      }

      // Count alerts for each day
      alertsData.forEach(alert => {
        const alertDate = new Date(alert.timestamp).toISOString().split('T')[0];
        const dayIndex = last7Days.findIndex(day => day.dateKey === alertDate);

        if (dayIndex !== -1) {
          last7Days[dayIndex].value++;
        }
      });

      // Apply color based on threat count
      last7Days.forEach(day => {
        if (day.value === 0) {
          day.color = "bg-green-500"; // No threats
        } else if (day.value <= 3) {
          day.color = "bg-yellow-500"; // Low threats
        } else if (day.value <= 7) {
          day.color = "bg-orange-500"; // Medium threats
        } else {
          day.color = "bg-red-500"; // High threats
        }
      });

      setChartData(last7Days);
      setError(null);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleExport = () => {
    console.log('Exporting data...');
    // Implement actual export logic if needed
  };

  const handleUserAction = async (user, action) => {
    console.log(`handleUserAction: ${action} user:`, user);
    try {
      if (action === 'view') {
        // Fetch user stats
        try {
          const [uploads, alerts] = await Promise.all([
            adminService.getUploads(0, 1000, user.id).catch(() => []),
            adminService.getAlerts(0, 1000, user.id).catch(() => [])
          ]);

          const uploadCount = uploads.length;
          const threatCount = alerts.length;

          alert(`User Details:\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nActive: ${user.is_active}\n\nStats:\nTotal Uploads: ${uploadCount}\nThreats Detected: ${threatCount}`);
        } catch (e) {
          console.error("Failed to fetch user stats", e);
          alert(`User Details:\nName: ${user.name}\nEmail: ${user.email}\nRole: ${user.role}\nActive: ${user.is_active}\n(Failed to load stats)`);
        }
      } else if (action === 'suspend') {
        if (window.confirm(`Are you sure you want to suspend ${user.name}?`)) {
          await adminService.updateUser(user.id, { is_active: false });
          loadData(); // Refresh list
        }
      } else if (action === 'delete') {
        if (window.confirm(`Are you sure you want to DELETE ${user.name}? This cannot be undone.`)) {
          await adminService.deleteUser(user.id);
          loadData(); // Refresh list
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      setError(`Failed to ${action} user`);
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-red-500">
        <p>{error}</p>
        <button onClick={loadData} className="ml-4 underline">Retry</button>
      </div>
    );
  }

  // Map API data to UI stats
  const dashboardStats = [
    {
      title: 'Total Users',
      value: stats?.total_users?.toString() || '0',
      change: `Active: ${stats?.active_users || 0}`,
      changeType: 'neutral',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Uploads',
      value: stats?.total_uploads?.toString() || '0',
      change: 'Lifetime',
      changeType: 'positive',
      icon: Upload,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Detections',
      value: stats?.total_detections?.toString() || '0',
      change: 'Objects Found',
      changeType: 'positive',
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Threats Detected',
      value: stats?.total_alerts?.toString() || '0',
      change: `Recent: ${stats?.recent_alerts || 0}`,
      changeType: 'negative',
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <>


      <div className="flex flex-1 flex-col gap-2 p-2 pt-0 sm:gap-4 sm:p-4 text-white">
        <div className="min-h-[calc(100vh-4rem)] flex-1 rounded-lg p-3 sm:rounded-xl sm:p-4 md:p-6">
          <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6">
            <div className="px-2 sm:px-0">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-white">
                Dashboard Overview
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base text-gray-400">
                Real-time system metrics and activity monitoring.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {dashboardStats.map((stat, index) => (
                <DashboardCard key={stat.title} stat={stat} index={index} />
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
              {/* Charts Section */}
              <div className="space-y-4 sm:space-y-6 xl:col-span-2">
                <RevenueChart data={chartData} />
                <UsersTable users={recentUsers} onAddUser={handleUserAction} />
              </div>

              {/* Sidebar Section */}
              <div className="space-y-4 sm:space-y-6">
                <QuickActions
                  onAddUser={() => { }} // Not used anymore
                  onExport={handleExport}
                />
                <SystemStatus healthData={healthData} />
                <RecentActivity activities={recentActivity} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
