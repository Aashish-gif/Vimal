"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ShoppingBag, CheckCircle2, Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getOrders, updateOrderStatus,
  type Order, type OrderStatus, type OrderType,
} from "@/lib/data/orders";
import { getFrameById, type Frame } from "@/lib/data/frames";
import { getCustomerById, findOrCreateCustomer, type Customer } from "@/lib/data/customers";
import { buildOrderArrivedMessage, pushInboxMessage } from "@/lib/data/inbox";

interface OrderRow extends Order { customer?: Customer; frame?: Frame; }

const RAHUL_INPUT = { name: "Rahul Sharma", phone: "+91 98765 43210" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
}
function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  "custom-lens": "Custom Lens", "ready-pickup": "Ready Pickup", repair: "Repair",
};
const STATUS_VARIANT: Record<OrderStatus, "default"|"success"|"warning"|"secondary"|"info"> = {
  pending: "warning", processing: "info", ready_for_pickup: "success", collected: "secondary"
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending", processing: "Processing", ready_for_pickup: "Ready for Pickup", collected: "Collected",
};

import { subscribeToTable } from "@/lib/realtimeSync";

export default function StaffOrdersPage() {
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const unsubOrders = subscribeToTable("orders", refresh);
    const unsubFrames = subscribeToTable("frames", refresh);
    const unsubCustomers = subscribeToTable("customers", refresh);
    return () => {
      unsubOrders();
      unsubFrames();
      unsubCustomers();
    };
  }, []);

  const rows = useMemo<OrderRow[]>(() => {
    return getOrders()
      // Only show confirmed orders (processing → ready_for_pickup → collected)
      .filter((o) => o.status !== "pending")
      .map((o) => ({ ...o, customer: getCustomerById(o.customerId), frame: getFrameById(o.frameId) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [revision]);

  const processingCount = rows.filter((r) => r.status === "processing").length;
  const arrivedCount = rows.filter((r) => r.status === "ready_for_pickup").length;

  const onMarkArrived = (id: string) => {
    const res = updateOrderStatus(id, "ready_for_pickup");
    if (res && res.newlyArrived) {
      const customer = getCustomerById(res.order.customerId);
      const customerName = customer?.name ?? "Customer";
      const msg = buildOrderArrivedMessage(customerName, res.order.id);
      pushInboxMessage({ customerId: res.order.customerId, kind: "order-arrived", text: msg, orderId: res.order.id });
      setArrivedIds((prev) => new Set(prev).add(id));
      setToast(`🔔 Ready for Pickup! Notification sent to ${customerName} · ${res.order.id}`);
      setTimeout(() => setToast(null), 4000);
    }
    refresh();
  };

  const onStatusChange = (id: string, status: OrderStatus) => {
    updateOrderStatus(id, status);
    refresh();
  };

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="animate-slide-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 max-w-sm rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white shadow-lg text-center">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">Custom lens orders · auto-refreshes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-slate-400" />
              <div>
                <CardTitle>Frame Orders</CardTitle>
                <CardDescription>Processing orders – mark as arrived to notify customer</CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{rows.length} total</Badge>
                <Badge variant="info">{processingCount} processing</Badge>
                <Badge variant="success">{arrivedCount} arrived</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <ShoppingBag className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No orders yet</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Frame</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Ordered</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((r) => {
                      const justArrived = arrivedIds.has(r.id);
                      return (
                        <tr key={r.id} className={justArrived ? "bg-emerald-50 transition-colors" : "transition-colors hover:bg-slate-50"}>
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                              <span className="font-bold tracking-tight text-slate-900">{r.id}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                                {initials(r.customer?.name ?? "?")}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{r.customer?.name ?? "Unknown"}</p>
                                <p className="text-xs text-slate-400">{r.customer?.phone ?? ""}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {r.frame ? (
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                                  <Image src={r.frame.imageUrl} alt={`${r.frame.brand} ${r.frame.model}`} fill sizes="40px" className="object-contain p-1" unoptimized />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">{r.frame.brand}</p>
                                  <p className="truncate text-xs text-slate-500">{r.frame.model}</p>
                                </div>
                              </div>
                            ) : <span className="text-slate-400">Frame removed</span>}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <Badge variant="outline" className="text-xs">{ORDER_TYPE_LABEL[r.orderType]}</Badge>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                               {r.status === "ready_for_pickup" && r.arrivedAt && (
                                 <span className="text-[10px] text-slate-400">{formatDate(r.arrivedAt)}</span>
                               )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-300" />
                              {formatDate(r.createdAt)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex justify-end gap-2">
                                {r.status === "processing" && (
                                  <button onClick={() => onMarkArrived(r.id)} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm">
                                    <Bell className="h-4 w-4" />
                                    Mark as Arrived
                                  </button>
                                )}
                                {r.status === "ready_for_pickup" && (
                                  <div className="flex items-center gap-2">
                                    {justArrived && (
                                      <div className="flex items-center gap-1 text-emerald-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="text-xs font-semibold">Notified</span>
                                      </div>
                                    )}
                                    <button onClick={() => onStatusChange(r.id, "collected")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">Mark Collected</button>
                                  </div>
                                )}
                               {r.status === "collected" && (
                                 <div className="flex items-center gap-1 text-slate-400">
                                   <CheckCircle2 className="h-4 w-4" />
                                   <span className="text-xs font-medium">Complete</span>
                                 </div>
                               )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-400">
                <Bell className="mr-1 inline h-3.5 w-3.5" />
                &ldquo;Mark as Arrived&rdquo; automatically notifies the customer in their AI chat.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
