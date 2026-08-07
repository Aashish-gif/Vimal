"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X, Package } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { frames, type Frame, type FrameStyle, type FrameColor } from "@/lib/data/frames";
import {
  createReservation,
  getReservations,
} from "@/lib/data/reservations";
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

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0)
    return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
  if (stock <= 2)
    return <Badge variant="warning" className="text-[10px]">{stock} left</Badge>;
  return <Badge variant="success" className="text-[10px]">{stock} in stock</Badge>;
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
    <Card className="group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-50">
        <Image
          src={frame.imageUrl}
          alt={`${frame.brand} ${frame.model}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
        {frame.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        {/* Brand / Model */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {frame.brand}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 leading-tight">
            {frame.model}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="text-[10px]">{frame.style}</Badge>
          <Badge variant="secondary" className="text-[10px]">{frame.color}</Badge>
          <StockBadge stock={frame.stock} />
        </div>

        {/* Price + Action */}
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-slate-900 tabular-nums">
            {formatPrice(frame.price)}
          </span>
          <Button
            size="sm"
            disabled={frame.stock === 0 || reserved}
            onClick={() => onReserve(frame)}
            className={
              reserved
                ? "h-8 text-xs bg-emerald-100 text-emerald-700 cursor-default hover:bg-emerald-100"
                : "h-8 text-xs bg-slate-900 text-white hover:bg-slate-700"
            }
          >
            {reserved ? "✓ Reserved" : frame.stock === 0 ? "Unavailable" : "Reserve"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState<FrameStyle | "">("");
  const [colorFilter, setColorFilter] = useState<FrameColor | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const activeReserved = useMemo(() => {
    const res = getReservations().filter((r) => r.status === "active");
    const ids = new Set(res.map((r) => r.frameId));
    return new Set([...reservedIds, ...ids]);
  }, [reservedIds]);

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
  }, [search, styleFilter, colorFilter, maxPrice]);

  const handleReserve = (frame: Frame) => {
    const customer = findOrCreateCustomer(DEMO_CUSTOMER);
    const result = createReservation({ customer, frameId: frame.id });
    if (result) {
      setReservedIds((prev) => new Set(prev).add(frame.id));
      setToastMsg(`✅ Reserved ${frame.brand} ${frame.model} for ${customer.name}`);
      setTimeout(() => setToastMsg(null), 3500);
    } else {
      setToastMsg("⚠️ Could not reserve — frame may be out of stock.");
      setTimeout(() => setToastMsg(null), 3500);
    }
  };

  const hasFilters = styleFilter || colorFilter || maxPrice !== "";

  return (
    <AppShell
      title="Inventory"
      description="Browse and manage the optical frame catalog"
      badge={{ label: "Staff Portal", variant: "outline" }}
    >
      {/* Toast */}
      {toastMsg && (
        <div className="animate-slide-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toastMsg}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Frame Catalog</CardTitle>
              <CardDescription>
                {filtered.length} of {frames.length} frames
                {hasFilters && " (filtered)"}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters((v) => !v)}
              className={showFilters ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 hover:text-white" : ""}
            >
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filters
              {hasFilters && (
                <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                  !
                </span>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search brand, model, style, color…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
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

          {/* Filter controls */}
          {showFilters && (
            <div className="animate-fade-in flex flex-wrap gap-3">
              <select
                value={styleFilter}
                onChange={(e) => setStyleFilter(e.target.value as FrameStyle | "")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="">All Styles</option>
                {STYLES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <select
                value={colorFilter}
                onChange={(e) => setColorFilter(e.target.value as FrameColor | "")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="">All Colors</option>
                {COLORS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-400"
              >
                <option value="">Any Price</option>
                <option value="999">Under ₹999</option>
                <option value="1499">Under ₹1,499</option>
                <option value="1999">Under ₹1,999</option>
                <option value="2499">Under ₹2,499</option>
                <option value="2999">Under ₹2,999</option>
              </select>

              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStyleFilter("");
                    setColorFilter("");
                    setMaxPrice("");
                  }}
                  className="text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <Package className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No frames found</p>
              <p className="mt-1 text-xs text-slate-400">
                Try adjusting your search or filters
              </p>
              {hasFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setStyleFilter("");
                    setColorFilter("");
                    setMaxPrice("");
                    setSearch("");
                  }}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((frame) => (
                <FrameCard
                  key={frame.id}
                  frame={frame}
                  reserved={activeReserved.has(frame.id)}
                  onReserve={handleReserve}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
