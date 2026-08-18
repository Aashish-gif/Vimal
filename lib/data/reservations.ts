import { getFrameById, type Frame, frames } from "./frames";
import type { Customer } from "./customers";
import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { broadcastChange } from "../realtimeSync";

// "pending"   = reservation is active, awaiting staff action
// "converted" = staff converted it to an Order
// "cancelled" = staff cancelled the reservation
export type ReservationStatus = "pending" | "converted" | "cancelled";

export interface Reservation {
  id: string;
  customerId: string;
  frameId: string;
  status: ReservationStatus;
  createdAt: string;
}

// Map reservation ID to created order ID after conversion
const conversionMap = new Map<string, string>();

/** Retrieve the order ID that a reservation was converted to, if any */
export function getConvertedOrderId(reservationId: string): string | undefined {
  return conversionMap.get(reservationId);
}

/** Record the conversion of a reservation to an order */
export function setConvertedOrderId(reservationId: string, orderId: string): void {
  conversionMap.set(reservationId, orderId);
}

// Global scope initialization to prevent hot-reload memory split
if (!(global as any).reservationsStore) {
  (global as any).reservationsStore = [];
}

const getStore = (): Reservation[] => (global as any).reservationsStore;
const setStore = (val: Reservation[]) => {
  (global as any).reservationsStore = val;
};

function generateReservationId(): string {
  return "r-" + Math.random().toString(36).slice(2, 9);
}

function setStock(frameId: string, delta: number): Frame | null {
  const frame = frames.find((f) => f.id === frameId);
  if (!frame) return null;
  const next = frame.stock + delta;
  if (next < 0) return null;
  frame.stock = next;

  // Broadcast frame update
  broadcastChange({
    table: "frames",
    eventType: "UPDATE",
    newRow: frame,
  });

  // Sync frame stock change to Supabase in background
  if (isSupabaseConfigured && supabase) {
    supabase
      .from("ifpos_frames")
      .update({ stock: next })
      .eq("id", frameId)
      .then();
  }

  return frame;
}

export function createReservation(
  input: CreateReservationInput
): Reservation | null {
  const frame = getFrameById(input.frameId);
  if (!frame) return null;
  if (frame.stock <= 0) return null;

  const updated = setStock(input.frameId, -1);
  if (!updated) return null;

  const reservation: Reservation = {
    id: generateReservationId(),
    customerId: input.customer.id,
    frameId: input.frameId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  setStore([reservation, ...getStore()]);

  // Sync to other tabs
  broadcastChange({
    table: "reservations",
    eventType: "INSERT",
    newRow: reservation,
  });

  // Sync to Supabase in background
  if (isSupabaseConfigured && supabase) {
    supabase
      .from("ifpos_reservations")
      .insert({
        id: reservation.id,
        customer_id: reservation.customerId,
        frame_id: reservation.frameId,
        status: reservation.status,
        created_at: reservation.createdAt,
      })
      .then();
  }

  return reservation;
}

export function getReservations(): Reservation[] {
  return [...getStore()];
}

export function getReservationById(id: string): Reservation | undefined {
  return getStore().find((r) => r.id === id);
}

export function getReservationsByCustomer(customerId: string): Reservation[] {
  return getStore().filter((r) => r.customerId === customerId);
}

export function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Reservation | null {
  const reservation = getStore().find((r) => r.id === id);
  if (!reservation) return null;

  const oldStatus = reservation.status;
  // Return stock when a pending reservation is cancelled or converted to an order
  if (oldStatus === "pending" && status !== "pending") {
    setStock(reservation.frameId, 1);
  }

  reservation.status = status;
  setStore([...getStore()]);

  // Sync to other tabs
  broadcastChange({
    table: "reservations",
    eventType: "UPDATE",
    newRow: reservation,
  });

  // Sync to Supabase in background
  if (isSupabaseConfigured && supabase) {
    supabase
      .from("ifpos_reservations")
      .update({ status })
      .eq("id", id)
      .then();
  }

  return reservation;
}

export interface CreateReservationInput {
  customer: Customer;
  frameId: string;
}

export function seedDemoReservations(): void {}

// Fetch initial data from Supabase once on startup if online
if (isSupabaseConfigured && supabase) {
  supabase
    .from("ifpos_reservations")
    .select("*")
    .then(({ data }) => {
      if (data) {
        const mapped = data.map((d) => ({
          id: d.id,
          customerId: d.customer_id,
          frameId: d.frame_id,
          // Normalise legacy Supabase values
          status: (d.status === "active" ? "pending"
                 : d.status === "collected" ? "converted"
                 : d.status) as ReservationStatus,
          createdAt: d.created_at,
        }));
        setStore(mapped);
      }
    });
}
