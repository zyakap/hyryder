"use client";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Sidebar } from "@/components/ui/Sidebar";

interface Driver {
  id: number;
  phone_number: string;
  full_name: string;
  rating: string;
  total_trips: number;
  driver_profile?: {
    verification_status: string;
    wallet_balance_toea: number;
    acceptance_rate: string;
  };
}

const STATUS_COLOR: Record<string, string> = {
  approved: "badge-success",
  pending: "badge-warning",
  rejected: "badge-danger",
  suspended: "badge-danger",
};

export default function DriversPage() {
  const { data: drivers = [], isLoading } = useQuery<Driver[]>({
    queryKey: ["admin-drivers"],
    queryFn: () => adminApi.get("/users/?role=driver").then((r) => r.data.results ?? r.data),
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-500 mt-1">Manage driver verification and accounts</p>
        </div>

        <div className="card overflow-hidden p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading drivers...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Driver", "Phone", "Status", "Rating", "Trips", "Acceptance Rate", "Wallet (PGK)"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {drivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{driver.full_name}</td>
                      <td className="px-4 py-3 text-gray-500">{driver.phone_number}</td>
                      <td className="px-4 py-3">
                        <span className={STATUS_COLOR[driver.driver_profile?.verification_status ?? ""] ?? "badge-info"}>
                          {driver.driver_profile?.verification_status ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">★ {driver.rating}</td>
                      <td className="px-4 py-3">{driver.total_trips}</td>
                      <td className="px-4 py-3">{driver.driver_profile?.acceptance_rate ?? "—"}%</td>
                      <td className="px-4 py-3 font-medium">
                        {driver.driver_profile ? `PGK ${(driver.driver_profile.wallet_balance_toea / 100).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
