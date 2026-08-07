"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Package, CalendarDays, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getOrders, type OrderStatus } from "@/lib/data/orders";
import { getFrameById } from "@/lib/data/frames";
import { findOrCreateCustomer } from "@/lib/data/customers";

const DEMO_CUSTOMER = { name: "Rahul Sharma", phone: "+91 98765 43210" };

function formatPrice(p: number) {
  return "₹" + p.toLocaleString("en-IN");
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: "warning" | "info" | "success" | "secondary"; note?: string }> = {
  pending:    { label: "Pending",     variant: "warning", note: "Your order has been received." },
  processing: { label: "Processing",  variant: "info",    note: "Your frames are being prepared." },
  arrived:    { label: "Ready for Pickup", variant: "success", note: "🎉 Your glasses are ready! Visit Vimal Opticals to collect them." },
  collected:  { label: "Collected",   variant: "secondary", note: "Order complete. Thank you!" },
};

import { subscribeToTable } from "@/lib/realtimeSync";

export default function CustomerOrdersPage() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToTable("orders", () => {
      setRevision((n) => n + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const customer = useMemo(() => findOrCreateCustomer(DEMO_CUSTOMER), []);

  const orders = useMemo(() => {
    return getOrders()
      .filter((o) => o.customerId === customer.id)
      .map((o) => ({ ...o, frame: getFrameById(o.frameId) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [revision, customer]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Track your custom lens orders at Vimal Opticals</p>
      </div>

      {orders.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
          <Package className="mb-3 h-12 w-12 text-slate-200" />
          <p className="text-base font-semibold text-slate-700">No orders yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Your custom lens orders will appear here.
          </p>
          <Link
            href="/customer/browse"
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Browse Frames
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((o) => {
            const config = STATUS_CONFIG[o.status];
            return (
              <div
                key={o.id}
                className={`flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                  o.status === "arrived" ? "border-emerald-200 ring-2 ring-emerald-100" : "border-slate-200"
                }`}
              >
                {o.frame && (
                  <div className={`relative h-44 w-full overflow-hidden ${o.status === "arrived" ? "bg-emerald-50" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}>
                    <Image
                      src={o.frame.imageUrl}
                      alt={`${o.frame.brand} ${o.frame.model}`}
                      fill sizes="400px"
                      className="object-contain p-6"
                      unoptimized
                    />
                    {o.status === "arrived" && (
                      <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Ready!
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Order</p>
                      <p className="text-base font-bold text-slate-900">{o.id}</p>
                    </div>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>

                  {o.frame && (
                    <>
                      <p className="text-xs font-bold uppercase tracking-widest text-blue-500">{o.frame.brand}</p>
                      <p className="text-sm font-semibold text-slate-900">{o.frame.model}</p>
                      <p className="text-base font-bold text-slate-900">{formatPrice(o.frame.price)}</p>
                    </>
                  )}

                  {config.note && (
                    <p className={`mt-1 rounded-lg px-3 py-2 text-xs ${
                      o.status === "arrived" ? "bg-emerald-50 text-emerald-800 font-medium" : "bg-slate-50 text-slate-600"
                    }`}>
                      {config.note}
                    </p>
                  )}

                  <div className="mt-auto flex items-center gap-1 text-xs text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Ordered {formatDate(o.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
