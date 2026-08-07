import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabaseClient";
import { frames as localFrames, type Frame } from "./data/frames";
import { getReservations as localReservations, type Reservation } from "./data/reservations";
import { getOrders as localOrders, type Order } from "./data/orders";
import { getCustomers as localCustomers, type Customer } from "./data/customers";
import { getInboxForCustomer as localMessages, type InboxMessage } from "./data/inbox";

// Local multi-tab synchronization fallback channel
const localSyncChannel =
  typeof window !== "undefined" ? new BroadcastChannel("vimal_opticals_realtime_channel") : null;

export interface RealtimePayload {
  table: "frames" | "reservations" | "orders" | "messages" | "customers";
  eventType: "INSERT" | "UPDATE" | "DELETE";
  newRow: any;
  oldRow?: any;
}

type SyncListener = (payload: RealtimePayload) => void;
const listeners = new Set<SyncListener>();

// Initialize local sync listener
if (localSyncChannel) {
  localSyncChannel.onmessage = (event) => {
    const payload = event.data as RealtimePayload;
    // Apply changes locally to mock stores
    applyPayloadLocally(payload);
    // Notify React listeners
    listeners.forEach((listener) => listener(payload));
  };
}

// Subscribes to table updates. Returns unsubscribe function.
export function subscribeToTable(
  table: "frames" | "reservations" | "orders" | "messages" | "customers",
  callback: (payload: RealtimePayload) => void
): () => void {
  const listener: SyncListener = (payload) => {
    if (payload.table === table) {
      callback(payload);
    }
  };

  listeners.add(listener);

  // Setup Supabase Realtime Subscription if configured
  let supabaseChannel: any = null;
  if (isSupabaseConfigured && supabase) {
    const dbTableName = "ifpos_" + table;
    supabaseChannel = supabase
      .channel(`${table}_realtime_changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: dbTableName },
        (dbPayload) => {
          const mappedNew = mapDbToRow(table, dbPayload.new);
          const mappedOld = mapDbToRow(table, dbPayload.old);
          const payload: RealtimePayload = {
            table,
            eventType: dbPayload.eventType as any,
            newRow: mappedNew,
            oldRow: mappedOld,
          };
          // Apply changes locally so pages get the latest in-memory values as fallback
          applyPayloadLocally(payload);
          callback(payload);
        }
      )
      .subscribe();
  }

  return () => {
    listeners.delete(listener);
    if (supabaseChannel) {
      supabase.removeChannel(supabaseChannel);
    }
  };
}

// Broadcasts changes to other tabs (fallback for local realtime offline mode)
export function broadcastChange(payload: RealtimePayload) {
  applyPayloadLocally(payload);
  if (localSyncChannel) {
    localSyncChannel.postMessage(payload);
  }
}

// Applies updates to the local JavaScript in-memory array structures
function applyPayloadLocally(payload: RealtimePayload) {
  const { table, eventType, newRow } = payload;

  if (table === "frames") {
    const idx = localFrames.findIndex((f) => f.id === newRow.id);
    if (eventType === "INSERT" && idx === -1) {
      localFrames.push(newRow);
    } else if (eventType === "UPDATE" && idx !== -1) {
      localFrames[idx] = newRow;
    } else if (eventType === "DELETE" && idx !== -1) {
      localFrames.splice(idx, 1);
    }
  } else if (table === "reservations") {
    const store = (global as any).reservationsStore || [];
    const idx = store.findIndex((r: any) => r.id === newRow.id);
    if (eventType === "INSERT" && idx === -1) {
      store.push(newRow);
    } else if (eventType === "UPDATE" && idx !== -1) {
      store[idx] = newRow;
    } else if (eventType === "DELETE" && idx !== -1) {
      store.splice(idx, 1);
    }
    (global as any).reservationsStore = store;
  } else if (table === "orders") {
    const store = (global as any).ordersStore || [];
    const idx = store.findIndex((o: any) => o.id === newRow.id);
    if (eventType === "INSERT" && idx === -1) {
      store.push(newRow);
    } else if (eventType === "UPDATE" && idx !== -1) {
      store[idx] = newRow;
    } else if (eventType === "DELETE" && idx !== -1) {
      store.splice(idx, 1);
    }
    (global as any).ordersStore = store;
  } else if (table === "messages") {
    const store = (global as any).inboxStore || [];
    const idx = store.findIndex((m: any) => m.id === newRow.id);
    if (eventType === "INSERT" && idx === -1) {
      store.push(newRow);
    } else if (eventType === "UPDATE" && idx !== -1) {
      store[idx] = newRow;
    } else if (eventType === "DELETE" && idx !== -1) {
      store.splice(idx, 1);
    }
    (global as any).inboxStore = store;
  }
}

// Maps Supabase database columns (snake_case) to Frontend properties (camelCase)
function mapDbToRow(table: string, dbObj: any): any {
  if (!dbObj || Object.keys(dbObj).length === 0) return dbObj;

  if (table === "frames") {
    return {
      id: dbObj.id,
      brand: dbObj.brand,
      model: dbObj.model,
      style: dbObj.style,
      color: dbObj.color,
      price: Number(dbObj.price),
      stock: Number(dbObj.stock),
      imageUrl: dbObj.image_url,
    };
  }
  if (table === "reservations") {
    return {
      id: dbObj.id,
      customerId: dbObj.customer_id,
      frameId: dbObj.frame_id,
      status: dbObj.status,
      createdAt: dbObj.created_at,
    };
  }
  if (table === "orders") {
    return {
      id: dbObj.id,
      customerId: dbObj.customer_id,
      frameId: dbObj.frame_id,
      orderType: dbObj.order_type,
      status: dbObj.status,
      createdAt: dbObj.created_at,
      arrivedAt: dbObj.arrived_at,
    };
  }
  if (table === "messages") {
    return {
      id: dbObj.id,
      customerId: dbObj.customer_id,
      kind: dbObj.kind,
      text: dbObj.text,
      orderId: dbObj.order_id,
      createdAt: dbObj.created_at,
      delivered: dbObj.delivered,
    };
  }
  if (table === "customers") {
    return {
      id: dbObj.id,
      name: dbObj.name,
      phone: dbObj.phone,
    };
  }
  return dbObj;
}

// React hook to access realtime connection status
export function useRealtimeStatus() {
  const [status, setStatus] = useState<"connected" | "local" | "disconnected">("local");

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      setStatus("connected");
    } else {
      setStatus("local");
    }
  }, []);

  return status;
}
