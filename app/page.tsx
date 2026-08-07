import Link from "next/link";
import { Glasses, ShoppingBag, LayoutDashboard, Sparkles } from "lucide-react";

export const metadata = {
  title: "Vimal Opticals — Demo",
  description: "Smart optical shopping and store management prototype",
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Glasses className="h-5 w-5" />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Vimal Opticals
          </span>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-amber-700">
          Prototype Demo
        </span>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="mb-2 flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          <Sparkles className="h-3.5 w-3.5" />
          FDE Evaluation Prototype
        </div>

        <h1 className="mt-4 text-center text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Vimal Opticals
        </h1>
        <p className="mt-3 max-w-md text-center text-lg text-slate-500">
          Smart optical shopping &amp; store management
        </p>

        {/* Role cards */}
        <div className="mt-12 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
          {/* Customer card */}
          <Link
            href="/customer/browse"
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Customer Experience
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Browse frames, find products with AI, and manage your reservations.
            </p>
            <div className="mt-8 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-blue-700">
              Enter Customer Experience
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {/* Decorative */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-50 opacity-60" />
          </Link>

          {/* Staff card */}
          <Link
            href="/staff"
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Staff Portal</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Manage inventory, reservations, customers, and orders.
            </p>
            <div className="mt-8 flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors group-hover:bg-slate-700">
              Enter Staff Portal
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            {/* Decorative */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-slate-50 opacity-60" />
          </Link>
        </div>

        {/* Demo note */}
        <p className="mt-10 max-w-md text-center text-xs text-slate-400">
          Both experiences share the same live data. Actions taken in the staff
          portal instantly reflect in the customer view and vice versa.
        </p>
      </main>

      <footer className="border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        Vimal Opticals · FDE Demo · In-memory data · No real transactions
      </footer>
    </div>
  );
}
