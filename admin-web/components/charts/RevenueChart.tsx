"use client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailySnapshot } from "@hyryder/shared-types";
import { format, parseISO } from "date-fns";

interface RevenueChartProps {
  data: DailySnapshot[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = [...data].reverse().map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    revenue: parseFloat(d.total_revenue_pgk.toFixed(2)),
    trips: d.completed_trips,
  }));

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue (PGK) — Last 30 Days</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1B4FFF" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#1B4FFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: number) => [`PGK ${value.toFixed(2)}`, "Revenue"]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#1B4FFF"
            strokeWidth={2}
            fill="url(#revenue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
