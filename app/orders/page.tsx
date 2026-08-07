"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ShoppingBag,
  CheckCircle2,
  Bell,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getOrders,
  updateOrderStatus,
  type Order,
  type OrderStatus,
  type OrderType,
} from "@/lib/data/orders";
import { getFrameById, type Frame } from "@/lib/data/frames";
import {
  getCustomerById,
  findOrCreateCustomer,
  type Customer,
} from "@/lib/data/customers";
import { buildOrderArrivedMessage, pushInboxMessage } from "@/lib/data/inbox";

interface OrderRow extends Order {
  customer?: Customer;
  frame?: Frame;
}

const RAHUL_INPUT = { name: "Rahul Sharma", phone: "+91 98765 43210" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  "custom-lens": "Custom Lens",
  "ready-pickup": "Ready Pickup",
  repair: "Repair",
};

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "success" | "warning" | "secondary" | "info"
> = {
  pending: "warning",
  processing: "info",
  arrived: "success",
  collected: "secondary",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  arrived: "Arrived ✓",
  collected: "Collected",
};

export default function OrdersPage() {
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo<OrderRow[]>(() => {
    void revision;
    return getOrders()
      .map((o) => ({
        ...o,
        customer: getCustomerById(o.customerId),
        frame: getFrameById(o.frameId),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [revision]);

  const pendingCount = rows.filter(
    (r) => r.status === "pending" || r.status === "processing"
  ).length;
  const arrivedCount = rows.filter((r) => r.status === "arrived").length;

  const onMarkArrived = (id: string) => {
    const res = updateOrderStatus(id, "arrived");
    if (res && res.newlyArrived) {
      const customer =
        getCustomerById(res.order.customerId) ??
        findOrCreateCustomer(RAHUL_INPUT);
      const msg = buildOrderArrivedMessage(customer.name, res.order.id);
      pushInboxMessage({
        customerId: customer.id,
        kind: "order-arrived",
        text: msg,
        orderId: res.order.id,
      });
      setArrivedIds((prev) => new Set(prev).add(id));
      setToast(
        `🔔 Pickup notification sent to ${customer.name} · Order ${res.order.id}`
      );
      setTimeout(() => setToast(null), 4000);
    }
    refresh();
  };

  const onStatusChange = (id: string, status: OrderStatus) => {
    updateOrderStatus(id, status);
    refresh();
  };

  return (
    <AppShell
      title="Orders"
      description="Track custom frame orders and send pickup notifications"
      badge={{ label: "Staff Only", variant: "outline" }}
    >
      {/* Toast notification */}
      {toast && (
        <div className="animate-slide-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 max-w-sm rounded-xl bg-emerald-700 px-5 py-3 text-sm font-medium text-white shadow-lg text-center">
          {toast}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-slate-400" />
              <div>
                <CardTitle>Frame Orders</CardTitle>
                <CardDescription>
                  Custom lens orders · refreshes automatically
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{rows.length} total</Badge>
              <Badge variant="info">{pendingCount} in progress</Badge>
              <Badge variant="success">{arrivedCount} arrived</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {rows.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <ShoppingBag className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No orders yet</p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Custom lens orders will appear here. Marking an order as
                Arrived sends an automatic WhatsApp notification.
              </p>
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
                        <tr
                          key={r.id}
                          className={
                            justArrived
                              ? "bg-emerald-50 transition-colors"
                              : "transition-colors hover:bg-slate-50"
                          }
                        >
                          {/* Order ID */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                                <ShoppingBag className="h-4 w-4" />
                              </div>
                              <span className="font-bold tracking-tight text-slate-900">
                                {r.id}
                              </span>
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                                {initials(r.customer?.name ?? "?")}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {r.customer?.name ?? "Unknown"}
                                </p>
                                <p className="text-xs text-slate-400">
                                  {r.customer?.phone ?? ""}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Frame */}
                          <td className="px-5 py-4">
                            {r.frame ? (
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                                  <Image
                                    src={r.frame.imageUrl}
                                    alt={`${r.frame.brand} ${r.frame.model}`}
                                    fill
                                    sizes="40px"
                                    className="object-contain p-1"
                                    unoptimized
                                  />
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-900">
                                    {r.frame.brand}
                                  </p>
                                  <p className="truncate text-xs text-slate-500">
                                    {r.frame.model}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400">Frame removed</span>
                            )}
                          </td>

                          {/* Order Type */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <Badge variant="outline" className="text-xs">
                              {ORDER_TYPE_LABEL[r.orderType]}
                            </Badge>
                          </td>

                          {/* Status */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <Badge variant={STATUS_VARIANT[r.status]}>
                                {STATUS_LABEL[r.status]}
                              </Badge>
                              {r.status === "arrived" && r.arrivedAt && (
                                <span className="text-[10px] text-slate-400">
                                  {formatDate(r.arrivedAt)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Created */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-300" />
                              {formatDate(r.createdAt)}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {r.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => onStatusChange(r.id, "processing")}
                                  className="h-8 text-xs"
                                >
                                  Start Processing
                                </Button>
                              )}

                              {r.status === "processing" && (
                                <Button
                                  size="sm"
                                  onClick={() => onMarkArrived(r.id)}
                                  className="h-9 gap-1.5 bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 shadow-sm"
                                >
                                  <Bell className="h-4 w-4" />
                                  Mark as Arrived
                                </Button>
                              )}

                              {r.status === "arrived" && (
                                <div className="flex items-center gap-2">
                                  {justArrived && (
                                    <div className="flex items-center gap-1 text-emerald-700">
                                      <CheckCircle2 className="h-4 w-4" />
                                      <span className="text-xs font-semibold">Notified</span>
                                    </div>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onStatusChange(r.id, "collected")}
                                    className="h-8 text-xs"
                                  >
                                    Mark Collected
                                  </Button>
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
                &ldquo;Mark as Arrived&rdquo; automatically sends a pickup
                notification to the customer&rsquo;s WhatsApp chat.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
