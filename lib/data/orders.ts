import { getCustomerById, type Customer } from "./customers";
import { type Frame, getFrameById } from "./frames";
import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { broadcastChange } from "../realtimeSync";

export type OrderType = "custom-lens" | "ready-pickup" | "repair";
export type OrderStatus = "pending" | "processing" | "ready_for_pickup" | "collected";

export interface Order {
  id: string;
  customerId: string;
  frameId: string;
  orderType: OrderType;
  status: OrderStatus;
  createdAt: string;
  arrivedAt: string | null;
}

// Global scope initialization to survive page updates and hot reload
if (!(global as any).ordersStore) {
  (global as any).ordersStore = [];
}

const getStore = (): Order[] => (global as any).ordersStore;
const setStore = (val: Order[]) => {
  (global as any).ordersStore = val;
};

let orderCounter = 1001;

function generateOrderId(): string {
  const count = orderCounter++;
  return `VO-${count}`;
}

export interface CreateOrderInput {
  customer: Customer;
  frame: Frame;
  orderType?: OrderType;
}

export function createOrder(input: CreateOrderInput): Order {
  const order: Order = {
    id: generateOrderId(),
    customerId: input.customer.id,
    frameId: input.frame.id,
    orderType: input.orderType ?? "custom-lens",
    status: "processing",
    createdAt: new Date().toISOString(),
    arrivedAt: null,
  };

  setStore([order, ...getStore()]);

  // Sync to other tabs
  broadcastChange({
    table: "orders",
    eventType: "INSERT",
    newRow: order,
  });

  // Sync to Supabase in background
  if (isSupabaseConfigured && supabase) {
    supabase
      .from("ifpos_orders")
      .insert({
        id: order.id,
        customer_id: order.customerId,
        frame_id: order.frameId,
        order_type: order.orderType,
        status: order.status,
        created_at: order.createdAt,
        arrived_at: order.arrivedAt,
      })
      .then();
  }

  return order;
}

export function getOrders(): Order[] {
  return [...getStore()];
}

export function getOrderById(id: string): Order | undefined {
  return getStore().find((o) => o.id === id);
}

export function getOrdersByCustomer(customerId: string): Order[] {
  return getStore().filter((o) => o.customerId === customerId);
}

export interface UpdateOrderResult {
  order: Order;
  newlyArrived: boolean;
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus
): UpdateOrderResult | null {
  const order = getStore().find((o) => o.id === id);
  if (!order) return null;

  const newlyArrived = order.status !== "ready_for_pickup" && status === "ready_for_pickup";
  order.status = status;
  if (status === "ready_for_pickup" && !order.arrivedAt) {
    order.arrivedAt = new Date().toISOString();
  }

  setStore([...getStore()]);

  // Sync to other tabs
  broadcastChange({
    table: "orders",
    eventType: "UPDATE",
    newRow: order,
  });

  // Sync to Supabase in background
  if (isSupabaseConfigured && supabase) {
    supabase
      .from("ifpos_orders")
      .update({
        status: order.status,
        arrived_at: order.arrivedAt,
      })
      .eq("id", id)
      .then();
  }

  return { order, newlyArrived };
}

// Fetch initial orders from Supabase on startup if online
if (isSupabaseConfigured && supabase) {
  supabase
    .from("ifpos_orders")
    .select("*")
    .then(({ data }) => {
      if (data && data.length > 0) {
        const mapped: Order[] = data.map((d) => ({
          id: d.id,
          customerId: d.customer_id,
          frameId: d.frame_id,
          orderType: d.order_type as OrderType,
          status: d.status as OrderStatus,
          createdAt: d.created_at,
          arrivedAt: d.arrived_at,
        }));
        setStore(mapped);
      }
    });
}

