"use client";

import { useRealtimeStatus } from "@/lib/realtimeSync";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export function RealtimeStatusBanner() {
  const status = useRealtimeStatus();

  if (status === "connected") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-600/10">
        <Wifi className="h-3 w-3 animate-pulse" />
        Supabase Realtime
      </div>
    );
  }

  if (status === "local") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-600/10" title="Offline fallback: synchronizes tabs in real-time but doesn't persist across page reloads. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable database synchronization.">
        <RefreshCw className="h-3 w-3 animate-spin [animation-duration:8s]" />
        Local Sync Mode
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-rose-600/10">
      <WifiOff className="h-3 w-3" />
      Sync Offline
    </div>
  );
}
