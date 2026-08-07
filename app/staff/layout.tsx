"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Glasses,
  LayoutDashboard,
  Package,
  BookmarkCheck,
  ClipboardList,
  Users,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { RealtimeStatusBanner } from "@/components/realtime-status-banner";

const STAFF_NAV = [
  { title: "Overview",     href: "/staff",              icon: LayoutDashboard, exact: true },
  { title: "Inventory",    href: "/staff/inventory",    icon: Package },
  { title: "Reservations", href: "/staff/reservations", icon: BookmarkCheck },
  { title: "Orders",       href: "/staff/orders",       icon: ClipboardList },
  { title: "Customers",    href: "/staff/customers",    icon: Users },
];

function SidebarContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <Glasses className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">Vimal Opticals</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Staff</span>
            <RealtimeStatusBanner />
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-slate-100" />

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {STAFF_NAV.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 space-y-3">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Demo Mode</p>
          <p className="mt-1 text-xs text-slate-500">FDE prototype environment</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Demo Home
        </Link>
      </div>
    </>
  );
}

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="absolute right-3 top-3">
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Glasses className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">Staff Portal</span>
          </div>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
