"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { adminApi } from "@/lib/api";
import { clsx } from "clsx";
import type { Trip } from "@hyryder/shared-types";
import { Sidebar } from "@/components/ui/Sidebar";

const columnHelper = createColumnHelper<Trip>();

const STATUS_BADGE: Record<string, string> = {
  completed: "badge-success",
  cancelled: "badge-danger",
  in_progress: "badge-info",
  driver_matched: "badge-warning",
  driver_arrived: "badge-warning",
  requested: "badge-info",
};

const columns = [
  columnHelper.accessor("id", { header: "Trip #", cell: (i) => `#${i.getValue()}` }),
  columnHelper.accessor("passenger_name", { header: "Passenger" }),
  columnHelper.accessor("driver_name", { header: "Driver", cell: (i) => i.getValue() ?? "—" }),
  columnHelper.accessor("pickup_address", { header: "Pickup", cell: (i) => <span className="truncate max-w-[180px] block">{i.getValue()}</span> }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: (i) => (
      <span className={STATUS_BADGE[i.getValue()] ?? "badge-info"}>
        {i.getValue().replace(/_/g, " ")}
      </span>
    ),
  }),
  columnHelper.accessor("payment_method", { header: "Payment" }),
  columnHelper.accessor("fare_pgk", {
    header: "Fare",
    cell: (i) => `PGK ${i.getValue().toFixed(2)}`,
  }),
  columnHelper.accessor("requested_at", {
    header: "Requested",
    cell: (i) => new Date(i.getValue()).toLocaleString(),
  }),
];

export default function TripsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data, isLoading } = useQuery<{ results: Trip[] } | Trip[]>({
    queryKey: ["admin-trips"],
    queryFn: () => adminApi.get("/trips/history/passenger/").then((r) => r.data),
  });

  const trips: Trip[] = Array.isArray(data) ? data : (data?.results ?? []);

  const table = useReactTable({
    data: trips,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trips</h1>
          <p className="text-gray-500 mt-1">All platform trips</p>
        </div>

        <div className="card overflow-hidden p-0">
          {isLoading ? (
            <div className="p-8 text-center text-gray-400">Loading trips...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  {table.getHeaderGroups().map((hg) => (
                    <tr key={hg.id}>
                      {hg.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: " ↑", desc: " ↓" }[header.column.getIsSorted() as string] ?? ""}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-gray-700">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
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
