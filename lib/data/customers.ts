import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { broadcastChange } from "../realtimeSync";

export interface Customer {
  id: string;
  name: string;
  phone: string;
}

// Global scope initialization to survive page updates and hot reload
if (!(global as any).customersStore) {
  (global as any).customersStore = [];
}

const getStore = (): Customer[] => (global as any).customersStore;
const setStore = (val: Customer[]) => {
  (global as any).customersStore = val;
};

function generateCustomerId(): string {
  return "c-" + Math.random().toString(36).slice(2, 9);
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function seed(): void {
  if (getStore().length === 0) {
    const defaultCustomer = {
      id: "c-rahul",
      name: "Rahul Sharma",
      phone: "+91 98765 43210",
    };
    setStore([defaultCustomer]);
  }
}

seed();

export function getCustomers(): Customer[] {
  seed();
  return [...getStore()];
}

export function getCustomerById(id: string): Customer | undefined {
  seed();
  return getStore().find((c) => c.id === id);
}

export function getCustomerByPhone(phone: string): Customer | undefined {
  seed();
  const norm = normalizePhone(phone);
  return getStore().find((c) => normalizePhone(c.phone) === norm);
}

export function findOrCreateCustomer(input: {
  name?: string;
  phone?: string;
}): Customer {
  seed();
  const phone = input.phone ?? "+91 98765 43210";
  const existing = getCustomerByPhone(phone);
  if (existing) return existing;

  const customer: Customer = {
    id: generateCustomerId(),
    name: input.name?.trim() || "Walk-in Customer",
    phone,
  };
  
  setStore([customer, ...getStore()]);

  // Sync to other tabs
  broadcastChange({
    table: "customers",
    eventType: "INSERT",
    newRow: customer,
  });

  // Sync to Supabase in background
  if (isSupabaseConfigured && supabase) {
    supabase
      .from("ifpos_customers")
      .insert({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      })
      .then();
  }

  return customer;
}

// Fetch initial customers from Supabase on startup if online
if (isSupabaseConfigured && supabase) {
  supabase
    .from("ifpos_customers")
    .select("*")
    .then(({ data }) => {
      if (data && data.length > 0) {
        const mapped = data.map((d) => ({
          id: d.id,
          name: d.name,
          phone: d.phone,
        }));
        setStore(mapped);
      }
    });
}
