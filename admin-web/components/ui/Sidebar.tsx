"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Car,
  Users,
  CreditCard,
  BarChart2,
  MessageSquare,
  Settings,
  MapPin,
} from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Car },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/passengers", label: "Passengers", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/support", label: "Support", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-64 bg-brand-900 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <MapPin className="text-brand-500 w-7 h-7" />
        <span className="text-xl font-bold text-white tracking-tight">HyRyder</span>
        <span className="ml-auto text-xs text-blue-300 font-medium px-2 py-0.5 rounded-full bg-white/10">Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-brand-500 text-white"
                  : "text-blue-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-blue-400">Papua New Guinea</p>
        <p className="text-xs text-blue-500 mt-0.5">© 2025 HyRyder Ltd</p>
      </div>
    </aside>
  );
}
