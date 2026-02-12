"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";
import { Users, Activity, Download, Settings } from "lucide-react";

const actions = [
  {
    icon: Activity,
    label: "View Analytics",
    color: "green",
    shortcut: "Ctrl+A",
    action: "analytics",
  },
  {
    icon: Download,
    label: "Export Data",
    color: "purple",
    shortcut: "Ctrl+E",
    action: "export",
  },
  {
    icon: Settings,
    label: "System Settings",
    color: "orange",
    shortcut: "Ctrl+S",
    action: "settings",
  },
];

export const QuickActions = memo(({ onAddUser, onExport }) => {
  const navigate = useNavigate();

  const handleAction = (action) => {
    switch (action) {
      case "analytics":
        navigate("/admin/uploads");
        break;
      case "export":
        navigate("/admin/alerts");
        break;
      case "settings":
        navigate("/admin/settings");
        break;
    }
  };
  return (
    <div className="border-border bg-card/40 rounded-xl border p-6">
      <h3 className="mb-4 text-xl font-semibold">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              <Button
                variant="outline"
                className={`h-12 w-full justify-start hover:bg-${action.color}-500/10 hover:border-${action.color}-500/50 transition-all duration-200`}
                onClick={() => handleAction(action.action)}>
                <Icon className={`mr-3 h-5 w-5 text-${action.color}-500`} />
                <span className="font-medium">{action.label}</span>
                <div className="text-muted-foreground ml-auto text-xs">
                  {action.shortcut}
                </div>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
});
QuickActions.displayName = "QuickActions";