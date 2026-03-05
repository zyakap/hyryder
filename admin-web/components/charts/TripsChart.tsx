"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DailySnapshot } from "@hyryder/shared-types";
import { format, parseISO } from "date-fns";

export function TripsChart({ data }: { data: DailySnapshot[] }) {
  const chartData = [...data].reverse().map((d) => ({
    date: format(parseISO(d.date), "MMM d"),
    completed: d.completed_trips,
    cancelled: d.cancelled_trips,
  }));

  return (
    <div className="card">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Trips — Last 30 Days</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} name="Completed" />
          <Bar dataKey="cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} name="Cancelled" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
