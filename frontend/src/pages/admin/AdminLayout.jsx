import React from 'react';
import { Outlet } from 'react-router-dom';
import '../../styles/dashboard.css';

const AdminLayout = () => {
    return (
        <div className="flex w-full bg-black text-white pt-20"> {/* Added pt-20 for fixed navbar */}
            <div className="flex-1">
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
