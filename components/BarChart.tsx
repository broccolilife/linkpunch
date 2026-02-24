"use client";

import { useMemo } from "react";
import type { TimeSeriesPoint } from "@/app/shared/client";

interface BarChartProps {
  data: TimeSeriesPoint[];
  metric: "views" | "clicks";
  height?: number;
}

export default function BarChart({ data, metric, height = 120 }: BarChartProps) {
  const max = useMemo(() => {
    const values = data.map((d) => d[metric]);
    return Math.max(...values, 1);
  }, [data, metric]);

  return (
    <div className="flex items-end gap-[2px]" style={{ height }}>
      {data.map((point) => {
        const value = point[metric];
        const barHeight = (value / max) * 100;
        const label = `${point.date}: ${value} ${metric}`;
        return (
          <div
            key={point.date}
            className="group relative flex-1 rounded-t-sm transition-colors"
            style={{
              height: `${Math.max(barHeight, 2)}%`,
              backgroundColor:
                metric === "views"
                  ? "rgba(99, 202, 255, 0.6)"
                  : "rgba(52, 211, 153, 0.6)"
            }}
            title={label}
          >
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2 py-1 text-[10px] text-white shadow-lg group-hover:block">
              {point.date.slice(5)}: {value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
