"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, BookmarkCheck } from "lucide-react";

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
import { cn } from "@/lib/utils";
import {
  getReservations,
  updateReservationStatus,
  getConvertedOrderId,
  setConvertedOrderId,
  type Reservation,
  type ReservationStatus,
} from "@/lib/data/reservations";
import { createOrder } from "@/lib/data/orders";
import { getFrameById, type Frame } from "@/lib/data/frames";
import { getCustomerById, findOrCreateCustomer, type Customer } from "@/lib/data/customers";

interface ReservationRow extends Reservation {
  customer?: Customer;
  frame?: Frame;
}

function formatPrice(price: number): string {
  return "₹" + price.toLocaleString("en-IN");
}

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

const STATUS_VARIANT: Record<
  ReservationStatus,
  "success" | "warning" | "secondary" | "info"
> = {
  pending: "success",
  converted: "info",
  cancelled: "warning",
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pending",
  converted: "Converted",
  cancelled: "Cancelled",
};

export default function ReservationsPage() {
  const [revision, setRevision] = useState(0);
  const refresh = () => setRevision((n) => n + 1);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(refresh, 1500);
    return () => clearInterval(id);
  }, []);

  const rows = useMemo<ReservationRow[]>(() => {
    void revision;
    return getReservations()
      .map((r) => ({
        ...r,
        customer: getCustomerById(r.customerId),
        frame: getFrameById(r.frameId),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [revision]);

  const pendingCount = rows.filter((r) => r.status === "pending").length;

  const onStatusChange = (id: string, status: ReservationStatus) => {
    updateReservationStatus(id, status);
    refresh();
    const row = rows.find((r) => r.id === id);
    const label =
      status === "converted"
        ? "Converted to Order"
        : status === "cancelled"
        ? "Reservation Cancelled"
        : "Updated";
    setToast(`✅ ${label}${row?.customer ? ` · ${row.customer.name}` : ""}`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <AppShell
      title="Reservations"
      description="Customer frame holds created via the Customer Assistant"
      badge={{ label: "Staff Only", variant: "outline" }}
    >
      {/* Toast */}
      {toast && (
        <div className="animate-slide-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookmarkCheck className="h-5 w-5 text-slate-400" />
              <div>
                <CardTitle>Reservations</CardTitle>
                <CardDescription>
                  Frames held for customers · refreshes automatically
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{rows.length} total</Badge>
              <Badge variant="success">{pendingCount} pending</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {rows.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <BookmarkCheck className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No reservations yet</p>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Reservations created in the Customer Assistant or Inventory will
                appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Frame</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Reserved On</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {rows.map((r) => (
                      <tr key={r.id} className="align-middle transition-colors hover:bg-slate-50">
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
                                <div className="mt-0.5 flex gap-1">
                                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                    {r.frame.style}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                                    {r.frame.color}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">Frame removed</span>
                          )}
                        </td>

                        {/* Price */}
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                          {r.frame ? formatPrice(r.frame.price) : "—"}
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <Badge variant={STATUS_VARIANT[r.status]}>
                            {STATUS_LABEL[r.status]}
                          </Badge>
                        </td>

                        {/* Date */}
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
                               <>
                                 <Button
                                   size="sm"
                                   onClick={() => {
                                     const customer = getCustomerById(r.customerId) ?? findOrCreateCustomer({ name: "Walk-in Customer" });
                                     const frame = getFrameById(r.frameId);
                                     if (!frame) return;
                                     const order = createOrder({ customer, frame, orderType: "custom-lens" });
                                     setConvertedOrderId(r.id, order.id);
                                     updateReservationStatus(r.id, "converted");
                                     refresh();
                                   }}
                                   className="h-8 bg-blue-600 text-xs text-white hover:bg-blue-700"
                                 >
                                   Convert to Order
                                 </Button>
                                 <Button
                                   size="sm"
                                   variant="outline"
                                   onClick={() => onStatusChange(r.id, "cancelled")}
                                   className={cn(
                                     "h-8 text-xs text-amber-700 hover:bg-amber-50 hover:border-amber-300"
                                   )}
                                 >
                                   Cancel
                                 </Button>
                               </>
                             )}
                             {r.status === "converted" && (
                               <span className="text-sm font-medium text-blue-600">
                                 Converted to Order #{getConvertedOrderId(r.id) ?? "…"}
                               </span>
                             )}
                             {r.status === "cancelled" && (
                               <span className="text-xs text-slate-400">Cancelled</span>
                             )}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs text-slate-400">
                Collecting or cancelling a reservation returns the frame to
                available stock.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
