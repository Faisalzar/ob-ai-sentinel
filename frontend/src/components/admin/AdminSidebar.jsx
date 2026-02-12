import React from 'react';
import { NavLink } from 'react-router-dom';

const AdminSidebar = () => {
    return (
        <aside className="sentinel-sidebar">
            <div className="sentinel-logo">Admin Control</div>
            <nav className="sentinel-nav">
                <NavLink
                    to="/admin/dashboard"
                    className={({ isActive }) => `sentinel-nav-item ${isActive ? 'sentinel-nav-item--active' : ''}`}
                >
                    Overview
                </NavLink>
                <NavLink
                    to="/admin/users"
                    className={({ isActive }) => `sentinel-nav-item ${isActive ? 'sentinel-nav-item--active' : ''}`}
                >
                    User Management
                </NavLink>
                <NavLink
                    to="/admin/uploads"
                    className={({ isActive }) => `sentinel-nav-item ${isActive ? 'sentinel-nav-item--active' : ''}`}
                >
                    Detection Activity
                </NavLink>
                <NavLink
                    to="/admin/alerts"
                    className={({ isActive }) => `sentinel-nav-item ${isActive ? 'sentinel-nav-item--active' : ''}`}
                >
                    Threat Monitoring
                </NavLink>
                <NavLink
                    to="/admin/logs"
                    className={({ isActive }) => `sentinel-nav-item ${isActive ? 'sentinel-nav-item--active' : ''}`}
                >
                    System Logs
                </NavLink>
                <NavLink
                    to="/admin/settings"
                    className={({ isActive }) => `sentinel-nav-item ${isActive ? 'sentinel-nav-item--active' : ''}`}
                >
                    System Settings
                </NavLink>
            </nav>
        </aside>
    );
};

export default AdminSidebar;
