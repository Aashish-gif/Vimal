"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package,
  CheckCircle,
  BookmarkCheck,
  ShoppingBag,
  Bell,
  Activity,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { frames, getFrameById } from "@/lib/data/frames";
import { getReservations } from "@/lib/data/reservations";
import { getOrders } from "@/lib/data/orders";
import { getCustomerById } from "@/lib/data/customers";

function formatPrice(p: number) {
  return "₹" + p.toLocaleString("en-IN");
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

interface MetricCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  href: string;
  color: string;      // icon bg
  textColor: string;  // icon colour
  sub?: string;
}

export default function DashboardPage() {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setRevision((n) => n + 1), 2000);
    return () => clearInterval(id);
  }, []);

  const metrics = useMemo<MetricCard[]>(() => {
    void revision;
    const reservations = getReservations();
    const orders = getOrders();
    const totalFrames = frames.length;
    const availableFrames = frames.filter((f) => f.stock > 0).length;
    const activeReservations = reservations.filter((r) => r.status === "pending").length;
    const pendingOrders = orders.filter(
      (o) => o.status === "pending" || o.status === "processing"
    ).length;
    const readyPickup = orders.filter((o) => o.status === "ready_for_pickup").length;

    return [
      {
        label: "Total Frames",
        value: totalFrames,
        icon: Package,
        href: "/inventory",
        color: "bg-blue-50",
        textColor: "text-blue-600",
        sub: `${availableFrames} with stock`,
      },
      {
        label: "Available Frames",
        value: availableFrames,
        icon: CheckCircle,
        href: "/inventory",
        color: "bg-emerald-50",
        textColor: "text-emerald-600",
        sub: `${totalFrames - availableFrames} out of stock`,
      },
      {
        label: "Active Reservations",
        value: activeReservations,
        icon: BookmarkCheck,
        href: "/reservations",
        color: "bg-violet-50",
        textColor: "text-violet-600",
        sub: "Frames on hold",
      },
      {
        label: "Pending Orders",
        value: pendingOrders,
        icon: ShoppingBag,
        href: "/orders",
        color: "bg-amber-50",
        textColor: "text-amber-600",
        sub: "Awaiting arrival",
      },
      {
        label: "Ready for Pickup",
        value: readyPickup,
        icon: Bell,
        href: "/orders",
        color: "bg-rose-50",
        textColor: "text-rose-600",
        sub: "Customers notified",
      },
    ];
  }, [revision]);

  const recentActivity = useMemo(() => {
    void revision;
    const reservations = getReservations();
    const orders = getOrders();

    const events: {
      id: string;
      label: string;
      sub: string;
      time: string;
      variant: "success" | "info" | "warning" | "secondary";
      statusLabel: string;
    }[] = [];

    for (const r of reservations.slice(0, 5)) {
      const customer = getCustomerById(r.customerId);
      const frame = getFrameById(r.frameId);
      events.push({
        id: "r-" + r.id,
        label: customer?.name ?? "Customer",
        sub: frame ? `${frame.brand} ${frame.model}` : "Frame",
        time: r.createdAt,
        variant: r.status === "pending" ? "success" : r.status === "cancelled" ? "warning" : "secondary",
        statusLabel: r.status === "pending" ? "Pending" : r.status === "cancelled" ? "Cancelled" : "Converted",
      });
    }

    for (const o of orders.slice(0, 5)) {
      const customer = getCustomerById(o.customerId);
      const frame = getFrameById(o.frameId);
      events.push({
        id: "o-" + o.id,
        label: customer?.name ?? "Customer",
        sub: frame ? `Order ${o.id}` : `Order ${o.id}`,
        time: o.arrivedAt ?? o.createdAt,
        variant: o.status === "ready_for_pickup" ? "success" : o.status === "pending" ? "warning" : "info",
        statusLabel:
          o.status === "ready_for_pickup"
            ? "Ready for Pickup"
            : o.status === "pending"
            ? "Pending"
            : o.status === "processing"
            ? "Processing"
            : "Collected",
      });
    }

    return events
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);
  }, [revision]);

  return (
    <AppShell
      title="Dashboard"
      description="Live overview of inventory, reservations, and orders"
      badge={{ label: "Live Demo", variant: "info" }}
    >
      {/* Metrics grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} href={m.href} className="group block">
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.color}`}>
                      <Icon className={`h-5 w-5 ${m.textColor}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
                      {m.value}
                    </p>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">{m.label}</p>
                    {m.sub && <p className="mt-0.5 text-xs text-slate-400">{m.sub}</p>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Bottom row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </div>
            <CardDescription>Latest reservations and orders</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
                <p className="text-sm text-slate-500">No activity yet</p>
                <p className="mt-1 text-xs text-slate-400">
                  Reservations and orders will appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentActivity.map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {ev.label.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{ev.label}</p>
                      <p className="truncate text-xs text-slate-500">{ev.sub}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Badge variant={ev.variant} className="text-[10px]">{ev.statusLabel}</Badge>
                      <span className="text-[10px] text-slate-400">{timeAgo(ev.time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Demo Walkthrough */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Demo Workflow</CardTitle>
            <CardDescription>End-to-end evaluation path</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {[
                { step: 1, text: "Customer asks for aviators under ₹1500", href: "/whatsapp" },
                { step: 2, text: "Assistant shows matching frames", href: "/whatsapp" },
                { step: 3, text: "Customer reserves the Black Aviator", href: "/whatsapp" },
                { step: 4, text: "Reservation appears in Reservations", href: "/reservations" },
                { step: 5, text: "Staff marks order as Arrived", href: "/orders" },
                { step: 6, text: "Pickup notification delivered in chat", href: "/whatsapp" },
              ].map((s) => (
                <li key={s.step}>
                  <Link href={s.href} className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                      {s.step}
                    </span>
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{s.text}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
