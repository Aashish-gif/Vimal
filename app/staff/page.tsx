"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Package, CheckCircle, BookmarkCheck, ShoppingBag, Bell, Activity, TrendingUp,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";

import { frames, getFrameById } from "@/lib/data/frames";
import { getReservations } from "@/lib/data/reservations";
import { getOrders } from "@/lib/data/orders";
import { getCustomerById } from "@/lib/data/customers";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

import { subscribeToTable } from "@/lib/realtimeSync";

export default function StaffOverviewPage() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const trigger = () => setRevision((n) => n + 1);
    const unsubFrames = subscribeToTable("frames", trigger);
    const unsubReservations = subscribeToTable("reservations", trigger);
    const unsubOrders = subscribeToTable("orders", trigger);

    return () => {
      unsubFrames();
      unsubReservations();
      unsubOrders();
    };
  }, []);

  const metrics = useMemo(() => {
    const reservations = getReservations();
    const orders = getOrders();
    return [
      { label: "Total Frames",        value: frames.length,                                                        icon: Package,       href: "/staff/inventory",    color: "bg-blue-50",   text: "text-blue-600",   sub: `${frames.filter(f => f.stock > 0).length} with stock` },
      { label: "Available Frames",     value: frames.filter(f => f.stock > 0).length,                              icon: CheckCircle,   href: "/staff/inventory",    color: "bg-emerald-50",text: "text-emerald-600",sub: `${frames.filter(f => f.stock === 0).length} out of stock` },
      { label: "Active Reservations",  value: reservations.filter(r => r.status === "active").length,              icon: BookmarkCheck, href: "/staff/reservations", color: "bg-violet-50", text: "text-violet-600", sub: "Frames on hold" },
      { label: "Pending Orders",       value: orders.filter(o => o.status === "pending" || o.status === "processing").length, icon: ShoppingBag,   href: "/staff/orders",       color: "bg-amber-50",  text: "text-amber-600",  sub: "Awaiting arrival" },
      { label: "Ready for Pickup",     value: orders.filter(o => o.status === "arrived").length,                   icon: Bell,          href: "/staff/orders",       color: "bg-rose-50",   text: "text-rose-600",   sub: "Customers notified" },
    ];
  }, [revision]);

  const recentActivity = useMemo(() => {
    const reservations = getReservations();
    const orders = getOrders();
    const events: { id: string; label: string; sub: string; time: string; variant: "success"|"info"|"warning"|"secondary"; status: string }[] = [];
    for (const r of reservations.slice(0, 5)) {
      const customer = getCustomerById(r.customerId);
      const frame = getFrameById(r.frameId);
      events.push({ id: "r-" + r.id, label: customer?.name ?? "Customer", sub: frame ? `${frame.brand} ${frame.model}` : "Frame", time: r.createdAt, variant: r.status === "active" ? "success" : r.status === "cancelled" ? "warning" : "secondary", status: r.status === "active" ? "Reserved" : r.status === "cancelled" ? "Cancelled" : "Collected" });
    }
    for (const o of orders.slice(0, 5)) {
      const customer = getCustomerById(o.customerId);
      events.push({ id: "o-" + o.id, label: customer?.name ?? "Customer", sub: `Order ${o.id}`, time: o.arrivedAt ?? o.createdAt, variant: o.status === "arrived" ? "success" : o.status === "pending" ? "warning" : "info", status: o.status === "arrived" ? "Arrived" : o.status === "pending" ? "Pending" : o.status === "processing" ? "Processing" : "Collected" });
    }
    return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);
  }, [revision]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Live store metrics — refreshes every 2 seconds</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} href={m.href} className="group block">
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.color}`}>
                      <Icon className={`h-5 w-5 ${m.text}`} />
                    </div>
                    <TrendingUp className="h-4 w-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                  </div>
                  <div className="mt-4">
                    <p className="text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{m.value}</p>
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
                      <Badge variant={ev.variant} className="text-[10px]">{ev.status}</Badge>
                      <span className="text-[10px] text-slate-400">{timeAgo(ev.time)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Demo Workflow</CardTitle>
            <CardDescription>End-to-end evaluation path</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {[
                { step: 1, text: "Customer browses / asks AI for aviators under ₹1500", href: "/customer/browse" },
                { step: 2, text: "Customer reserves the Black Aviator", href: "/customer/assistant" },
                { step: 3, text: "Reservation appears here", href: "/staff/reservations" },
                { step: 4, text: "Staff marks VO-104 as Arrived", href: "/staff/orders" },
                { step: 5, text: "Customer sees Ready for Pickup", href: "/customer/orders" },
                { step: 6, text: "Pickup notification in AI chat", href: "/customer/assistant" },
              ].map((s) => (
                <li key={s.step}>
                  <Link href={s.href} className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">{s.step}</span>
                    <span className="text-sm text-slate-600 group-hover:text-slate-900">{s.text}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
