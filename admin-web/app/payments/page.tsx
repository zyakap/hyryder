"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Sidebar } from "@/components/ui/Sidebar";
import { analyticsApi } from "@/lib/api";
import type { RevenueSummary } from "@hyryder/shared-types";
import { DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

export default function PaymentsPage() {
  const { data: revenue } = useQuery<RevenueSummary>({
    queryKey: ["revenue-summary"],
    queryFn: () => analyticsApi.getRevenue(),
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Platform revenue and transaction overview</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            title="Total Revenue"
            value={revenue ? `PGK ${revenue.total_revenue_pgk.toFixed(0)}` : "—"}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Total Trips"
            value={revenue?.total_trips ?? "—"}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Completed Trips"
            value={revenue?.completed_trips ?? "—"}
            icon={CheckCircle}
            color="green"
          />
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Payment Methods Supported</h2>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { name: "Cash", description: "Driver confirms receipt in-app", color: "bg-gray-100 text-gray-700" },
              { name: "Digicel MiCash", description: "Largest PNG mobile wallet", color: "bg-red-100 text-red-700" },
              { name: "Vodafone M-PAiSA", description: "Second largest PNG wallet", color: "bg-green-100 text-green-700" },
              { name: "Stripe Card", description: "Visa / Mastercard online", color: "bg-blue-100 text-blue-700" },
            ].map((method) => (
              <div key={method.name} className={`rounded-xl p-4 ${method.color}`}>
                <p className="font-semibold text-sm">{method.name}</p>
                <p className="text-xs mt-0.5 opacity-75">{method.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
