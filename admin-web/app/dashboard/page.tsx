"use client";
import { useQuery } from "@tanstack/react-query";
import { Car, Users, DollarSign, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { RevenueChart } from "@/components/charts/RevenueChart";
import { TripsChart } from "@/components/charts/TripsChart";
import { analyticsApi } from "@/lib/api";
import type { DailySnapshot } from "@hyryder/shared-types";

export default function DashboardPage() {
  const { data: snapshots = [], isLoading } = useQuery<DailySnapshot[]>({
    queryKey: ["dashboard"],
    queryFn: analyticsApi.getDashboard,
    refetchInterval: 60000,
  });

  const today = snapshots[0];
  const yesterday = snapshots[1];

  const tripTrend = today && yesterday && yesterday.total_trips > 0
    ? ((today.total_trips - yesterday.total_trips) / yesterday.total_trips * 100)
    : null;

  const revenueTrend = today && yesterday && yesterday.total_revenue_pgk > 0
    ? ((today.total_revenue_pgk - yesterday.total_revenue_pgk) / yesterday.total_revenue_pgk * 100)
    : null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
        <p className="text-gray-500 mt-1">Real-time overview of the HyRyder platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Trips Today"
          value={today?.total_trips ?? "—"}
          icon={Car}
          color="blue"
          trend={tripTrend !== null ? { value: parseFloat(tripTrend.toFixed(1)), label: "vs yesterday" } : undefined}
        />
        <StatCard
          title="Revenue Today"
          value={today ? `PGK ${today.total_revenue_pgk.toFixed(0)}` : "—"}
          icon={DollarSign}
          color="green"
          trend={revenueTrend !== null ? { value: parseFloat(revenueTrend.toFixed(1)), label: "vs yesterday" } : undefined}
        />
        <StatCard
          title="Active Drivers"
          value={today?.active_drivers ?? "—"}
          icon={Users}
          color="yellow"
          subtitle="Currently registered drivers"
        />
        <StatCard
          title="New Passengers"
          value={today?.new_passengers ?? "—"}
          icon={TrendingUp}
          color="blue"
          subtitle="Registered today"
        />
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading analytics...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={snapshots} />
          <TripsChart data={snapshots} />
        </div>
      )}
    </div>
  );
}
