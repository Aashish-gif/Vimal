"use client";

import Image from "next/image";
import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, X, Package, Edit, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { frames, type Frame, type FrameStyle, type FrameColor, updateFrame } from "@/lib/data/frames";
import { createReservation, getReservations } from "@/lib/data/reservations";
import { findOrCreateCustomer } from "@/lib/data/customers";
import { subscribeToTable } from "@/lib/realtimeSync";

const DEMO_CUSTOMER = { name: "Rahul Sharma", phone: "+91 98765 43210" };

function formatPrice(p: number) { return "₹" + p.toLocaleString("en-IN"); }

const STYLES: FrameStyle[] = ["Aviator","Round","Square","Rectangle","Cat-Eye","Wayfarer","Clubmaster","Oval","Browline"];
const COLORS: FrameColor[] = ["Black","Brown","Gold","Silver","Tortoise","Blue","Red","Gunmetal","Havana","Clear"];

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>;
  if (stock <= 2) return <Badge variant="warning" className="text-[10px]">{stock} left</Badge>;
  return <Badge variant="success" className="text-[10px]">{stock} in stock</Badge>;
}

function FrameCard({
  frame,
  reserved,
  onReserve,
  onEditSave,
}: {
  frame: Frame;
  reserved: boolean;
  onReserve: (f: Frame) => void;
  onEditSave: (id: string, updates: Partial<Frame>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editBrand, setEditBrand] = useState(frame.brand);
  const [editModel, setEditModel] = useState(frame.model);
  const [editPrice, setEditPrice] = useState(frame.price.toString());
  const [editStock, setEditStock] = useState(frame.stock.toString());

  // Update inputs if frame updates from realtime database
  useEffect(() => {
    if (!isEditing) {
      setEditBrand(frame.brand);
      setEditModel(frame.model);
      setEditPrice(frame.price.toString());
      setEditStock(frame.stock.toString());
    }
  }, [frame, isEditing]);

  const handleSave = () => {
    const priceNum = parseFloat(editPrice) || 0;
    const stockNum = parseInt(editStock, 10) || 0;
    onEditSave(frame.id, {
      brand: editBrand,
      model: editModel,
      price: priceNum,
      stock: stockNum,
    });
    setIsEditing(false);
  };

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      {/* Product Image */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-50">
        <Image src={frame.imageUrl} alt={`${frame.brand} ${frame.model}`} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain p-4 transition-transform duration-300 group-hover:scale-105" unoptimized />
        {frame.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Out of Stock</span>
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-3.5 p-4 bg-white">
        {isEditing ? (
          /* Editing Layout */
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Brand</label>
              <input
                type="text"
                value={editBrand}
                onChange={(e) => setEditBrand(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Model</label>
              <input
                type="text"
                value={editModel}
                onChange={(e) => setEditModel(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price (₹)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stock</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs focus:border-slate-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1.5">
              <button
                onClick={handleSave}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                <Save className="h-3.5 w-3.5" /> Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Normal Display Layout */
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{frame.brand}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900 truncate">{frame.model}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px]">{frame.style}</Badge>
              <Badge variant="secondary" className="text-[10px]">{frame.color}</Badge>
              <StockBadge stock={frame.stock} />
            </div>
            <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span className="text-base font-bold text-slate-900 tabular-nums">{formatPrice(frame.price)}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  title="Edit details"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                <button
                  disabled={frame.stock === 0 || reserved}
                  onClick={() => onReserve(frame)}
                  className={reserved
                    ? "rounded-lg bg-emerald-100 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700"
                    : frame.stock === 0
                    ? "rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-400 cursor-not-allowed"
                    : "rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-700 transition-colors"
                  }
                >
                  {reserved ? "✓ Reserved" : frame.stock === 0 ? "Unavailable" : "Reserve"}
                </button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function StaffInventoryPage() {
  const [search, setSearch] = useState("");
  const [styleFilter, setStyleFilter] = useState<FrameStyle | "">("");
  const [colorFilter, setColorFilter] = useState<FrameColor | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [reservedIds, setReservedIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [framesVersion, setFramesVersion] = useState(0);
  const [reservationsVersion, setReservationsVersion] = useState(0);

  useEffect(() => {
    const unsubFrames = subscribeToTable("frames", () => {
      setFramesVersion((v) => v + 1);
    });
    const unsubReservations = subscribeToTable("reservations", () => {
      setReservedIds(new Set()); // Reset local reserve states on db reload to prevent stale tags
      setReservationsVersion((v) => v + 1);
    });
    return () => {
      unsubFrames();
      unsubReservations();
    };
  }, []);

  const activeReserved = useMemo(() => {
    const res = getReservations().filter((r) => r.status === "pending");
    return new Set([...res.map((r) => r.frameId), ...reservedIds]);
  }, [reservedIds, reservationsVersion]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return frames.filter((f) => {
      if (q && !f.brand.toLowerCase().includes(q) && !f.model.toLowerCase().includes(q) && !f.style.toLowerCase().includes(q) && !f.color.toLowerCase().includes(q)) return false;
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
      setToast(`✅ Reserved ${frame.brand} ${frame.model} for ${customer.name}`);
    } else {
      setToast("⚠️ Could not reserve — frame may be out of stock.");
    }
    setTimeout(() => setToast(null), 3500);
  };

  const handleEditSave = (id: string, updates: Partial<Frame>) => {
    const result = updateFrame(id, updates);
    if (result) {
      setToast(`✅ Saved modifications for ${result.brand} ${result.model}`);
    } else {
      setToast("⚠️ Could not edit frame details.");
    }
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="animate-fade-in">
      {toast && (
        <div className="animate-slide-up fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="mt-1 text-sm text-slate-500">{filtered.length} of {frames.length} frames{hasFilters && " (filtered)"}</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Frame Catalog</CardTitle>
              <CardDescription>All frames in stock</CardDescription>
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${showFilters ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search brand, model, style, color…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm focus:border-slate-400 focus:bg-white focus:outline-none transition-colors"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
          </div>

          {showFilters && (
            <div className="animate-fade-in flex flex-wrap gap-3">
              <select value={styleFilter} onChange={(e) => setStyleFilter(e.target.value as FrameStyle | "")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none">
                <option value="">All Styles</option>
                {STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value as FrameColor | "")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none">
                <option value="">All Colors</option>
                {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none">
                <option value="">Any Price</option>
                <option value="999">Under ₹999</option>
                <option value="1499">Under ₹1,499</option>
                <option value="1999">Under ₹1,999</option>
                <option value="2499">Under ₹2,499</option>
              </select>
              {hasFilters && (
                <button onClick={() => { setStyleFilter(""); setColorFilter(""); setMaxPrice(""); }} className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center">
              <Package className="mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-medium text-slate-700">No frames found</p>
              <p className="mt-1 text-xs text-slate-400">Adjust your filters</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((frame) => (
                <FrameCard
                  key={frame.id}
                  frame={frame}
                  reserved={activeReserved.has(frame.id)}
                  onReserve={handleReserve}
                  onEditSave={handleEditSave}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
