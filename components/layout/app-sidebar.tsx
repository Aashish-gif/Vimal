"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Glasses, Menu, X } from "lucide-react";

import { navItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type AppSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      {/* Logo / brand */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
          <Glasses className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-slate-900">
            Vimal Opticals
          </p>
          <p className="text-[11px] font-medium text-slate-500">Staff Portal</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-slate-100" />

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span className="flex-1 truncate">{item.title}</span>
              {item.badge && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-sky-100 text-sky-700"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="p-4">
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Demo Mode
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            FDE prototype evaluation environment
          </p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-100 bg-white lg:flex">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="absolute right-3 top-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMobileClose}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden"
      onClick={onClick}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
