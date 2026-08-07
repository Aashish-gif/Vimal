import { getCustomerById, type Customer } from "./customers";
import { type Frame, frames } from "./frames";

export type OrderType = "custom-lens" | "ready-pickup" | "repair";
export type OrderStatus = "pending" | "processing" | "arrived" | "collected";

export interface Order {
  id: string;
  customerId: string;
  frameId: string;
  orderType: OrderType;
  status: OrderStatus;
  createdAt: string;
  arrivedAt: string | null;
}

let orderCounter = 104;
let ordersStore: Order[] = [];

function nextOrderId(): string {
  const id = `VO-${orderCounter}`;
  orderCounter += 1;
  return id;
}

export function seedDemoOrder(): void {
  if (ordersStore.length > 0) return;
  const customer = getCustomerById("c-rahul");
  let frameId = "f-002";
  const customFrameExists = frames.some((f) => f.id === "f-classic-aviator");
  if (!customFrameExists) {
    frames.unshift({
      id: "f-classic-aviator",
      brand: "Vimal Opticals",
      model: "Classic Black Aviator",
      style: "Aviator",
      color: "Black",
      price: 1499,
      stock: 1,
      imageUrl:
        "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=classic%20black%20aviator%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
    });
  }
  frameId = "f-classic-aviator";
  if (customer) {
    ordersStore = [
      {
        id: "VO-104",
        customerId: customer.id,
        frameId,
        orderType: "custom-lens",
        status: "processing",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
        arrivedAt: null,
      },
    ];
    orderCounter = 105;
  }
}

seedDemoOrder();

export interface CreateOrderInput {
  customer: Customer;
  frame: Frame;
  orderType?: OrderType;
}

export function createOrder(input: CreateOrderInput): Order {
  const order: Order = {
    id: nextOrderId(),
    customerId: input.customer.id,
    frameId: input.frame.id,
    orderType: input.orderType ?? "custom-lens",
    status: "pending",
    createdAt: new Date().toISOString(),
    arrivedAt: null,
  };
  ordersStore = [order, ...ordersStore];
  return order;
}

export function getOrders(): Order[] {
  seedDemoOrder();
  return [...ordersStore];
}

export function getOrderById(id: string): Order | undefined {
  seedDemoOrder();
  return ordersStore.find((o) => o.id === id);
}

export function getOrdersByCustomer(customerId: string): Order[] {
  seedDemoOrder();
  return ordersStore.filter((o) => o.customerId === customerId);
}

export interface UpdateOrderResult {
  order: Order;
  newlyArrived: boolean;
}

export function updateOrderStatus(
  id: string,
  status: OrderStatus
): UpdateOrderResult | null {
  seedDemoOrder();
  const order = ordersStore.find((o) => o.id === id);
  if (!order) return null;
  const newlyArrived = order.status !== "arrived" && status === "arrived";
  order.status = status;
  if (status === "arrived" && !order.arrivedAt) {
    order.arrivedAt = new Date().toISOString();
  }
  return { order, newlyArrived };
}
