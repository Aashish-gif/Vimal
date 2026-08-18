"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { BookmarkCheck, CalendarDays } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { getReservations, type ReservationStatus } from "@/lib/data/reservations";
import { getFrameById } from "@/lib/data/frames";
import { findOrCreateCustomer } from "@/lib/data/customers";

const DEMO_CUSTOMER = { name: "Rahul Sharma", phone: "+91 98765 43210" };

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Pending",
  converted: "Converted to Order",
  cancelled: "Cancelled",
};
const STATUS_VARIANT: Record<ReservationStatus, "success" | "warning" | "secondary" | "info"> = {
  pending: "success",
  converted: "info",
  cancelled: "warning",
};

function formatPrice(p: number) {
  return "₹" + p.toLocaleString("en-IN");
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

import { subscribeToTable } from "@/lib/realtimeSync";

export default function CustomerReservationsPage() {
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeToTable("reservations", () => {
      setRevision((n) => n + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const customer = useMemo(() => findOrCreateCustomer(DEMO_CUSTOMER), []);

  const reservations = useMemo(() => {
    return getReservations()
      .filter((r) => r.customerId === customer.id)
      .map((r) => ({ ...r, frame: getFrameById(r.frameId) }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [revision, customer]);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Reservations</h1>
        <p className="mt-1 text-sm text-slate-500">Frames you have reserved at Vimal Opticals</p>
      </div>

      {reservations.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
          <BookmarkCheck className="mb-3 h-12 w-12 text-slate-200" />
          <p className="text-base font-semibold text-slate-700">No reservations yet</p>
          <p className="mt-1 text-sm text-slate-400">
            Browse frames and reserve your favourite pair!
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
          {reservations.map((r) => (
            <div key={r.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {r.frame && (
                <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
                  <Image
                    src={r.frame.imageUrl}
                    alt={`${r.frame.brand} ${r.frame.model}`}
                    fill sizes="400px"
                    className="object-contain p-6"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2 p-4">
                {r.frame ? (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-500">{r.frame.brand}</p>
                    <p className="text-base font-bold text-slate-900">{r.frame.model}</p>
                    <div className="flex gap-1.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{r.frame.style}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{r.frame.color}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-900">{formatPrice(r.frame.price)}</p>
                  </>
                ) : (
                  <p className="text-sm text-slate-400">Frame information unavailable</p>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <Badge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(r.createdAt)}
                  </div>
                </div>
                {r.status === "pending" && (
                  <p className="mt-1 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                    📍 Frame held for 24 hours at Vimal Opticals
                  </p>
                )}
                {r.status === "converted" && (
                  <p className="mt-1 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                    ✅ Your reservation has been converted to an order by staff.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
