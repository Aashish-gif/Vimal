import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { broadcastChange } from "../realtimeSync";

export type InboxMessageKind = "order-arrived" | "order-collected" | "reservation-created";

export interface InboxMessage {
  id: string;
  customerId: string;
  kind: InboxMessageKind;
  text: string;
  orderId?: string;
  createdAt: string;
  delivered: boolean;
}

// Global scope initialization to survive page updates and hot reload
if (!(global as any).inboxStore) {
  (global as any).inboxStore = [];
}

const getStore = (): InboxMessage[] => (global as any).inboxStore;
const setStore = (val: InboxMessage[]) => {
  (global as any).inboxStore = val;
};

function generateMsgId(): string {
  return "n-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

export function buildOrderArrivedMessage(customerName: string, orderId: string): string {
  const firstName = customerName.split(" ")[0] ?? customerName;
  return `Hi ${firstName} 👋\n\nGood news! Your glasses are ready for pickup at Vimal Opticals.\n\nOrder #${orderId}\n\nWe look forward to seeing you!`;
}

export function pushInboxMessage(input: {
  customerId: string;
  kind: InboxMessageKind;
  text: string;
  orderId?: string;
}): InboxMessage {
  const message: InboxMessage = {
    id: generateMsgId(),
    customerId: input.customerId,
    kind: input.kind,
    text: input.text,
    orderId: input.orderId,
    createdAt: new Date().toISOString(),
    delivered: false,
  };

  setStore([message, ...getStore()]);

  // Sync to other tabs
  broadcastChange({
    table: "messages",
    eventType: "INSERT",
    newRow: message,
  });

  // Sync to Supabase in background
  if (isSupabaseConfigured && supabase) {
    supabase
      .from("ifpos_messages")
      .insert({
        id: message.id,
        customer_id: message.customerId,
        kind: message.kind,
        text: message.text,
        order_id: message.orderId,
        created_at: message.createdAt,
        delivered: message.delivered,
      })
      .then();
  }

  return message;
}

export function getInboxForCustomer(customerId: string): InboxMessage[] {
  return getStore()
    .filter((m) => m.customerId === customerId)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

export function getPendingInboxForCustomer(customerId: string): InboxMessage[] {
  return getInboxForCustomer(customerId).filter((m) => !m.delivered);
}

export function markInboxDelivered(ids: string[]): void {
  const store = getStore();
  let updated = false;

  for (const m of store) {
    if (ids.includes(m.id) && !m.delivered) {
      m.delivered = true;
      updated = true;

      // Sync to other tabs
      broadcastChange({
        table: "messages",
        eventType: "UPDATE",
        newRow: m,
      });

      // Sync to Supabase in background
      if (isSupabaseConfigured && supabase) {
        supabase
          .from("ifpos_messages")
          .update({ delivered: true })
          .eq("id", m.id)
          .then();
      }
    }
  }

  if (updated) {
    setStore([...store]);
  }
}

export function getInboxCountForCustomer(customerId: string): {
  total: number;
  pending: number;
} {
  const all = getInboxForCustomer(customerId);
  return {
    total: all.length,
    pending: all.filter((m) => !m.delivered).length,
  };
}

// Fetch initial messages from Supabase on startup if online
if (isSupabaseConfigured && supabase) {
  supabase
    .from("ifpos_messages")
    .select("*")
    .then(({ data }) => {
      if (data) {
        const mapped = data.map((d) => ({
          id: d.id,
          customerId: d.customer_id,
          kind: d.kind as InboxMessageKind,
          text: d.text,
          orderId: d.order_id,
          createdAt: d.created_at,
          delivered: d.delivered,
        }));
        setStore(mapped);
      }
    });
}
