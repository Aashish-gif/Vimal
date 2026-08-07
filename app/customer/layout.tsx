"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Glasses, ShoppingBag, MessageSquare, BookmarkCheck, Package, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

import { RealtimeStatusBanner } from "@/components/realtime-status-banner";

const CUSTOMER_NAV = [
  { title: "Browse Frames", href: "/customer/browse", icon: ShoppingBag },
  { title: "AI Assistant", href: "/customer/assistant", icon: MessageSquare },
  { title: "My Reservations", href: "/customer/reservations", icon: BookmarkCheck },
  { title: "My Orders", href: "/customer/orders", icon: Package },
];

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <Glasses className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-slate-900">
                Vimal Opticals
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Customer
              </span>
              <RealtimeStatusBanner />
            </div>
          </div>

          {/* Nav links */}
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {CUSTOMER_NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Demo Home
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 pb-2 pt-1 scrollbar-none sm:hidden">
          {CUSTOMER_NAV.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600">← Back to Demo Home</Link>
        <span className="mx-3">·</span>
        Vimal Opticals FDE Demo
      </footer>
    </div>
  );
}
