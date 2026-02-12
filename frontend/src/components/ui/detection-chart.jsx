import { memo } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import { BarChart3, Calendar } from "lucide-react";

// Mock data for detections
const chartData = [
    { month: "Jan", value: 120, growth: 12, color: "bg-blue-500" },
    { month: "Feb", value: 150, growth: 25, color: "bg-purple-500" },
    { month: "Mar", value: 180, growth: 20, color: "bg-green-500" },
    { month: "Apr", value: 220, growth: 15, color: "bg-yellow-500" },
    { month: "May", value: 200, growth: -9, color: "bg-red-500" },
    { month: "Jun", value: 280, growth: 40, color: "bg-cyan-500" },
];

export const DetectionChart = memo(() => {
    return (
        <div className="border-border bg-card/40 rounded-xl border p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                        <BarChart3 className="h-5 w-5 text-purple-500" />
                        Detection Analytics
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        Monthly detection volume
                    </p>
                </div>
                <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Last 6 months
                </Button>
            </div>

            {/* Fixed Chart Area */}
            <div className="relative mb-4 h-64 rounded-lg p-4">
                <div className="flex h-full items-end justify-between gap-3">
                    {chartData.map((item, index) => (
                        <div
                            key={item.month}
                            className="group flex flex-1 flex-col items-center">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${(item.value / 300) * 180}px` }}
                                transition={{ duration: 1, delay: index * 0.1 }}
                                className={`w-full ${item.color} relative min-h-[20px] cursor-pointer rounded-t-lg transition-opacity hover:opacity-80`}>
                                {/* Tooltip */}
                                <div className="border-border bg-popover text-popover-foreground absolute -top-16 left-1/2 z-10 -translate-x-1/2 transform rounded-lg border px-3 py-2 text-sm whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                    <div className="font-medium">
                                        {item.value.toLocaleString()} Events
                                    </div>
                                    <div
                                        className={`text-xs ${item.growth > 0 ? "text-green-500" : "text-red-500"}`}>
                                        {item.growth > 0 ? "+" : ""}
                                        {item.growth}%
                                    </div>
                                </div>
                            </motion.div>
                            <div className="text-muted-foreground mt-2 text-center text-xs font-medium">
                                {item.month}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="border-border/50 grid grid-cols-3 gap-4 border-t pt-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-500">1,150</div>
                    <div className="text-muted-foreground text-xs">Total Events</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-500">+18%</div>
                    <div className="text-muted-foreground text-xs">Trend</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">98%</div>
                    <div className="text-muted-foreground text-xs">Uptime</div>
                </div>
            </div>
        </div>
    );
});

DetectionChart.displayName = "DetectionChart";
