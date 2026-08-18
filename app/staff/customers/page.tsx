"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Users, CalendarDays, BookmarkCheck, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomers, type Customer } from "@/lib/data/customers";
import { getReservations, type ReservationStatus } from "@/lib/data/reservations";
import { getOrders, type OrderStatus } from "@/lib/data/orders";
import { getFrameById } from "@/lib/data/frames";
import { subscribeToTable } from "@/lib/realtimeSync";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}
function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

const RES_STATUS_VARIANT: Record<ReservationStatus, "success" | "warning" | "secondary" | "info"> = {
  pending: "success",
  converted: "info",
  cancelled: "warning",
};
const ORDER_STATUS_VARIANT: Record<OrderStatus, "warning" | "info" | "success" | "secondary"> = {
  pending: "warning",
  processing: "info",
  ready_for_pickup: "success",
  collected: "secondary",
};

export default function StaffCustomersPage() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const trigger = () => setRevision((n) => n + 1);
    const unsubCustomers = subscribeToTable("customers", trigger);
    const unsubReservations = subscribeToTable("reservations", trigger);
    const unsubOrders = subscribeToTable("orders", trigger);

    return () => {
      unsubCustomers();
      unsubReservations();
      unsubOrders();
    };
  }, []);

  const data = useMemo(() => {
    const customers = getCustomers();
    const reservations = getReservations();
    const orders = getOrders();
    return customers.map((c) => ({
      customer: c,
      reservations: reservations
        .filter((r) => r.customerId === c.id)
        .map((r) => ({ ...r, frame: getFrameById(r.frameId) }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      orders: orders
        .filter((o) => o.customerId === c.id)
        .map((o) => ({ ...o, frame: getFrameById(o.frameId) }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    }));
  }, [revision]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">{data.length} registered customers</p>
      </div>

      {data.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
          <Users className="mb-3 h-10 w-10 text-slate-200" />
          <p className="text-sm font-medium text-slate-700">No customers yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.map(({ customer, reservations, orders }) => (
            <Card key={customer.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-bold text-slate-700 ring-1 ring-slate-200">
                    {initials(customer.name)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{customer.name}</CardTitle>
                    <CardDescription>{customer.phone}</CardDescription>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900">{reservations.length}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Reservations</p>
                    </div>
                    <div className="mx-2 w-px bg-slate-100" />
                    <div className="text-center">
                      <p className="text-xl font-bold text-slate-900">{orders.length}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">Orders</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-2">
                  {/* Reservations */}
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <BookmarkCheck className="h-3.5 w-3.5" /> Reservations
                    </h3>
                    {reservations.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">No reservations</p>
                    ) : (
                      <div className="space-y-2">
                        {reservations.slice(0, 3).map((r) => (
                          <div key={r.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                            {r.frame && (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                <Image src={r.frame.imageUrl} alt="" fill sizes="40px" className="object-contain p-1" unoptimized />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{r.frame ? `${r.frame.brand} ${r.frame.model}` : "Unknown"}</p>
                              <div className="flex items-center gap-1 text-xs text-slate-400">
                                <CalendarDays className="h-3 w-3" />
                                {formatDate(r.createdAt)}
                              </div>
                            </div>
                            <Badge variant={RES_STATUS_VARIANT[r.status]} className="text-[10px] shrink-0">
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                        {reservations.length > 3 && (
                          <p className="text-xs text-slate-400">+{reservations.length - 3} more</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Orders */}
                  <div>
                    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <ShoppingBag className="h-3.5 w-3.5" /> Orders
                    </h3>
                    {orders.length === 0 ? (
                      <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-400">No orders</p>
                    ) : (
                      <div className="space-y-2">
                        {orders.slice(0, 3).map((o) => (
                          <div key={o.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
                            {o.frame && (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                <Image src={o.frame.imageUrl} alt="" fill sizes="40px" className="object-contain p-1" unoptimized />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-slate-900">{o.id}</p>
                              <p className="truncate text-xs text-slate-400">{o.frame ? `${o.frame.brand} ${o.frame.model}` : "Unknown"}</p>
                            </div>
                            <Badge variant={ORDER_STATUS_VARIANT[o.status]} className="text-[10px] shrink-0">
                              {o.status === "ready_for_pickup" ? "Ready!" : o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                            </Badge>
                          </div>
                        ))}
                        {orders.length > 3 && (
                          <p className="text-xs text-slate-400">+{orders.length - 3} more</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
