"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { frames, type Frame, type FrameStyle, type FrameColor } from "@/lib/data/frames";
import { createReservation, getReservations } from "@/lib/data/reservations";
import { findOrCreateCustomer } from "@/lib/data/customers";

const DEMO_CUSTOMER = { name: "Rahul Sharma", phone: "+91 98765 43210" };

function formatPrice(p: number) {
  return "₹" + p.toLocaleString("en-IN");
}

const STYLES: FrameStyle[] = [
  "Aviator", "Round", "Square", "Rectangle", "Cat-Eye",
  "Wayfarer", "Clubmaster", "Oval", "Browline",
];
const COLORS: FrameColor[] = [
  "Black", "Brown", "Gold", "Silver", "Tortoise",
  "Blue", "Red", "Gunmetal", "Havana", "Clear",
];

function StockPill({ stock }: { stock: number }) {
  if (stock === 0)
    return (
      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
        Out of Stock
      </span>
    );
  if (stock <= 2)
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
        Only {stock} left
      </span>
    );
  return (
    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
      In Stock
    </span>
  );
}

function FrameCard({
  frame,
  reserved,
  onReserve,
}: {
  frame: Frame;
  reserved: boolean;
  onReserve: (f: Frame) => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50">
        <Image
          src={frame.imageUrl}
          alt={`${frame.brand} ${frame.model}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        {frame.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-red-100 px-4 py-1.5 text-sm font-semibold text-red-700">
              Out of Stock
            </span>
          </div>
        )}
        {/* Price badge */}
        <div className="absolute right-3 top-3 rounded-xl bg-white/90 px-2.5 py-1 text-sm font-bold text-slate-900 shadow-sm backdrop-blur-sm">
          {formatPrice(frame.price)}
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500">
            {frame.brand}
          </p>
          <p className="mt-0.5 text-base font-semibold text-slate-900 leading-snug">
            {frame.model}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px]">{frame.style}</Badge>
          <Badge variant="secondary" className="text-[10px]">{frame.color}</Badge>
          <StockPill stock={frame.stock} />
        </div>

        <button
          disabled={frame.stock === 0 || reserved}
          onClick={() => onReserve(frame)}
          className={
            reserved
              ? "mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-sm font-semibold text-emerald-700"
              : frame.stock === 0
              ? "mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
              : "mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          }
        >
          {reserved ? (
            <>✓ Reserved</>
          ) : frame.stock === 0 ? (
            "Unavailable"
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              Reserve Frame
            </>
          )}
        </button>
      </div>
    </div>
  );
}

import { subscribeToTable } from "@/lib/realtimeSync";
import { useEffect } from "react";

export default function BrowsePage() {
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState<FrameStyle | "">("");
  const [colorFilter, setColorFilter] = useState<FrameColor | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [framesVersion, setFramesVersion] = useState(0);
  const [reservationsVersion, setReservationsVersion] = useState(0);

  useEffect(() => {
    const unsubFrames = subscribeToTable("frames", () => {
      setFramesVersion((v) => v + 1);
    });
    const unsubReservations = subscribeToTable("reservations", () => {
      setReservationsVersion((v) => v + 1);
    });
    return () => {
      unsubFrames();
      unsubReservations();
    };
  }, []);

  const alreadyReserved = useMemo(() => {
    const res = getReservations().filter((r) => r.status === "pending");
    return new Set([...res.map((r) => r.frameId), ...reservedIds]);
  }, [reservedIds, reservationsVersion]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return frames.filter((f) => {
      if (
        q &&
        !f.brand.toLowerCase().includes(q) &&
        !f.model.toLowerCase().includes(q) &&
        !f.style.toLowerCase().includes(q) &&
        !f.color.toLowerCase().includes(q)
      )
        return false;
      if (styleFilter && f.style !== styleFilter) return false;
      if (colorFilter && f.color !== colorFilter) return false;
      if (maxPrice !== "" && f.price > maxPrice) return false;
      return true;
    });
  }, [search, styleFilter, colorFilter, maxPrice, framesVersion]);

  const hasFilters = styleFilter || colorFilter || maxPrice !== "";

  const handleReserve = (frame: Frame) => {
    const customer = findOrCreateCustomer(DEMO_CUSTOMER);
    const result = createReservation({ customer, frameId: frame.id });
    if (result) {
      setReservedIds((prev) => new Set(prev).add(frame.id));
      setToast({
        msg: `✅ ${frame.brand} ${frame.model} reserved! Check "My Reservations".`,
        ok: true,
      });
    } else {
      setToast({ msg: "⚠️ Could not reserve — may be out of stock.", ok: false });
    }
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="animate-fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`animate-slide-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-medium text-white shadow-xl ${
            toast.ok ? "bg-emerald-700" : "bg-amber-700"
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Browse Frames</h1>
        <p className="mt-1 text-sm text-slate-500">
          {filtered.length} of {frames.length} frames available
          {hasFilters && " (filtered)"}
        </p>
      </div>

      {/* Search + filters */}
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search brand, style, color…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
              showFilters
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                !
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="animate-fade-in flex flex-wrap gap-2">
            <select
              value={styleFilter}
              onChange={(e) => setStyleFilter(e.target.value as FrameStyle | "")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
            >
              <option value="">All Styles</option>
              {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value as FrameColor | "")}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
            >
              <option value="">All Colors</option>
              {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={maxPrice}
              onChange={(e) =>
                setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-blue-400"
            >
              <option value="">Any Price</option>
              <option value="999">Under ₹999</option>
              <option value="1499">Under ₹1,499</option>
              <option value="1999">Under ₹1,999</option>
              <option value="2499">Under ₹2,499</option>
              <option value="2999">Under ₹2,999</option>
            </select>
            {hasFilters && (
              <button
                onClick={() => { setStyleFilter(""); setColorFilter(""); setMaxPrice(""); }}
                className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white text-center">
          <ShoppingBag className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No frames found</p>
          <p className="mt-1 text-xs text-slate-400">Try adjusting your search or filters</p>
          {hasFilters && (
            <button
              onClick={() => { setStyleFilter(""); setColorFilter(""); setMaxPrice(""); setSearch(""); }}
              className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((frame) => (
            <FrameCard
              key={frame.id}
              frame={frame}
              reserved={alreadyReserved.has(frame.id)}
              onReserve={handleReserve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
