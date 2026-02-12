import React from 'react';

const RecentActivity = () => {
    const activities = [
        {
            id: 1,
            user: "Admin User",
            action: "System config updated",
            time: "10 mins ago",
            avatar: "A"
        },
        {
            id: 2,
            user: "Security Lead",
            action: "Reviewed alert #4023",
            time: "25 mins ago",
            avatar: "S"
        },
        {
            id: 3,
            user: "System",
            action: "Backup completed",
            time: "1 hour ago",
            avatar: "Sys"
        }
    ];

    return (
        <div className="rounded-xl border border-white/10 bg-zinc-900/50 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
            <div className="relative border-l border-white/10 ml-3 space-y-6">
                {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-6">
                        <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border border-zinc-900 bg-purple-500 ring-4 ring-zinc-900" />
                        <div className="flex flex-col items-start gap-1">
                            <span className="text-xs font-medium text-zinc-500">
                                {activity.time}
                            </span>
                            <p className="text-sm text-white">
                                <span className="font-semibold text-purple-400">{activity.user}</span> {activity.action}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecentActivity;
