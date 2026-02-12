"use client";
import { memo } from "react";
import { motion } from "framer-motion";
import { Button } from "./button";
import { Activity, Calendar } from "lucide-react";


export const RevenueChart = memo(({ data = [] }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1); // Ensure at least 1 to avoid division by zero
  const chartHeight = 240; // Height of chart container in pixels (h-64 = 256px - padding)

  console.log('Chart Data:', data);
  console.log('Max Value:', maxValue);

  return (
    <div className="border-border bg-card/40 rounded-xl border p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-5 w-5 text-red-500" />
            Threat Activity
          </h3>
          <p className="text-muted-foreground text-sm text-gray-400">
            Detections over the last 7 days
          </p>
        </div>
        <Button variant="outline" size="sm" className="bg-transparent border-gray-600 text-gray-300 hover:text-white">
          <Calendar className="mr-2 h-4 w-4" />
          Last 7 days
        </Button>
      </div>

      {/* Fixed Chart Area */}
      <div className="relative mb-4 h-60 rounded-lg p-4">
        <div className="flex h-full items-end justify-between gap-3">
          {data.map((item, index) => {
            const heightPercentage = item.value > 0 ? (item.value / maxValue) * 100 : 0;
            const minHeight = 8; // Minimum 8px for visibility
            const calculatedHeight = item.value > 0
              ? Math.max((item.value / maxValue) * chartHeight, minHeight)
              : minHeight;

            console.log(`${item.label}: value=${item.value}, height=${calculatedHeight}px, color=${item.color}`);

            return (
              <div
                key={item.label}
                className="group flex flex-1 flex-col items-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: calculatedHeight
                  }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className={`w-full ${item.color || 'bg-blue-500'} relative cursor-pointer rounded-t-lg transition-opacity hover:opacity-80`}>
                  {/* Tooltip */}
                  <div className="border-border bg-popover absolute -top-16 left-1/2 z-10 -translate-x-1/2 transform rounded-lg border px-3 py-2 text-sm whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100 bg-gray-800 text-white">
                    <div className="font-medium">
                      {item.value} Detection{item.value !== 1 ? 's' : ''}
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.label}
                    </div>
                  </div>
                </motion.div>
                <div className="text-muted-foreground mt-2 text-center text-xs font-medium text-gray-400">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});
RevenueChart.displayName = "RevenueChart";