import { isSupabaseConfigured, supabase } from "../supabaseClient";
import { broadcastChange } from "../realtimeSync";

export type FrameStyle =
  | "Aviator"
  | "Round"
  | "Square"
  | "Rectangle"
  | "Cat-Eye"
  | "Wayfarer"
  | "Clubmaster"
  | "Oval"
  | "Browline";

export type FrameColor =
  | "Black"
  | "Brown"
  | "Gold"
  | "Silver"
  | "Tortoise"
  | "Blue"
  | "Red"
  | "Gunmetal"
  | "Havana"
  | "Clear";

export interface Frame {
  id: string;
  brand: string;
  model: string;
  style: FrameStyle;
  color: FrameColor;
  price: number;
  stock: number;
  imageUrl: string;
}

// Initial local seed frames
export const frames: Frame[] = [
  {
    id: "f-001",
    brand: "Ray-Ban",
    model: "RB3025 Classic",
    style: "Aviator",
    color: "Gold",
    price: 1299,
    stock: 4,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gold%20aviator%20sunglasses%20ray-ban%20style%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-002",
    brand: "Ray-Ban",
    model: "RB3025 Black",
    style: "Aviator",
    color: "Black",
    price: 1399,
    stock: 2,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20aviator%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-003",
    brand: "Ray-Ban",
    model: "RB2140 Original",
    style: "Wayfarer",
    color: "Black",
    price: 1199,
    stock: 5,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20wayfarer%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-004",
    brand: "Ray-Ban",
    model: "RB2140 Tortoise",
    style: "Wayfarer",
    color: "Tortoise",
    price: 1249,
    stock: 3,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=tortoise%20shell%20wayfarer%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-005",
    brand: "Oakley",
    model: "Holbrook",
    style: "Square",
    color: "Black",
    price: 1899,
    stock: 2,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20square%20oakley%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-006",
    brand: "Oakley",
    model: "Latch",
    style: "Round",
    color: "Silver",
    price: 1749,
    stock: 1,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=silver%20round%20sunglasses%20oakley%20style%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-007",
    brand: "Persol",
    model: "PO3092V",
    style: "Round",
    color: "Tortoise",
    price: 2199,
    stock: 3,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=tortoise%20round%20vintage%20eyeglasses%20frames%20persol%20style%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-008",
    brand: "Persol",
    model: "PO3103S",
    style: "Aviator",
    color: "Gunmetal",
    price: 2299,
    stock: 1,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gunmetal%20grey%20aviator%20sunglasses%20persol%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-009",
    brand: "Vogue",
    model: "VO2714",
    style: "Cat-Eye",
    color: "Black",
    price: 999,
    stock: 6,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20cat%20eye%20eyeglasses%20frames%20womens%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-010",
    brand: "Vogue",
    model: "VO5206S",
    style: "Cat-Eye",
    color: "Red",
    price: 1099,
    stock: 4,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=red%20cat%20eye%20sunglasses%20womens%20vogue%20style%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-011",
    brand: "Vogue",
    model: "VO5104S",
    style: "Oval",
    color: "Havana",
    price: 1149,
    stock: 2,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=havana%20brown%20oval%20sunglasses%20womens%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-012",
    brand: "LensKart",
    model: "LR E10136",
    style: "Round",
    color: "Black",
    price: 799,
    stock: 8,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20round%20eyeglasses%20frames%20affordable%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-013",
    brand: "LensKart",
    model: "LR E11240",
    style: "Round",
    color: "Clear",
    price: 699,
    stock: 5,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=clear%20transparent%20round%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-014",
    brand: "LensKart",
    model: "LR E13581",
    style: "Rectangle",
    color: "Brown",
    price: 849,
    stock: 7,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=brown%20rectangle%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-015",
    brand: "LensKart",
    model: "LR E14902",
    style: "Square",
    color: "Blue",
    price: 899,
    stock: 4,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=blue%20square%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-016",
    brand: "Tom Ford",
    model: "TF5401",
    style: "Rectangle",
    color: "Black",
    price: 2899,
    stock: 1,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=black%20rectangle%20luxury%20tom%20ford%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-017",
    brand: "Tom Ford",
    model: "TF5506",
    style: "Clubmaster",
    color: "Havana",
    price: 2799,
    stock: 2,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=havana%20clubmaster%20browline%20luxury%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-018",
    brand: "Vince Camuto",
    model: "VC1001",
    style: "Browline",
    color: "Gunmetal",
    price: 1499,
    stock: 3,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gunmetal%20browline%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-019",
    brand: "Vince Camuto",
    model: "VC1056",
    style: "Cat-Eye",
    color: "Tortoise",
    price: 1599,
    stock: 2,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=tortoise%20cat%20eye%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-020",
    brand: "Titan",
    model: "T1025A",
    style: "Rectangle",
    color: "Silver",
    price: 1299,
    stock: 5,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=silver%20rectangle%20titan%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-021",
    brand: "Titan",
    model: "T1146B",
    style: "Clubmaster",
    color: "Gold",
    price: 1599,
    stock: 4,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=gold%20black%20clubmaster%20browline%20titan%20eyeglasses%20frames%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-022",
    brand: "Fastrack",
    model: "FT1015",
    style: "Aviator",
    color: "Silver",
    price: 899,
    stock: 6,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=silver%20aviator%20fastrack%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-023",
    brand: "Fastrack",
    model: "FT1089",
    style: "Square",
    color: "Brown",
    price: 749,
    stock: 3,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=brown%20square%20fastrack%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
  {
    id: "f-024",
    brand: "Fastrack",
    model: "FT1150",
    style: "Wayfarer",
    color: "Blue",
    price: 799,
    stock: 0,
    imageUrl:
      "https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=blue%20wayfarer%20sunglasses%20on%20white%20background%20product%20photography&image_size=square_hd",
  },
];

export interface SearchCriteria {
  style?: string;
  color?: string;
  maxPrice?: number;
  minPrice?: number;
  brand?: string;
  inStockOnly?: boolean;
}

export function searchInventory(criteria: SearchCriteria = {}): Frame[] {
  let results = [...frames];

  if (criteria.style) {
    const s = criteria.style.toLowerCase();
    results = results.filter((f) => f.style.toLowerCase() === s);
  }

  if (criteria.color) {
    const c = criteria.color.toLowerCase();
    results = results.filter((f) => f.color.toLowerCase() === c);
  }

  if (criteria.brand) {
    const b = criteria.brand.toLowerCase();
    results = results.filter((f) => f.brand.toLowerCase().includes(b));
  }

  if (typeof criteria.maxPrice === "number") {
    results = results.filter((f) => f.price <= criteria.maxPrice!);
  }

  if (typeof criteria.minPrice === "number") {
    results = results.filter((f) => f.price >= criteria.minPrice!);
  }

  if (criteria.inStockOnly) {
    results = results.filter((f) => f.stock > 0);
  }

  return results;
}

export function getFrameById(id: string): Frame | undefined {
  return frames.find((f) => f.id === id);
}

export function updateFrame(id: string, updates: Partial<Frame>): Frame | null {
  const frame = frames.find((f) => f.id === id);
  if (!frame) return null;

  // Apply updates locally
  Object.assign(frame, updates);

  // Broadcast update to other tabs
  broadcastChange({
    table: "frames",
    eventType: "UPDATE",
    newRow: frame,
  });

  // Update Supabase in background
  if (isSupabaseConfigured && supabase) {
    const dbUpdates: any = {};
    if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
    if (updates.model !== undefined) dbUpdates.model = updates.model;
    if (updates.style !== undefined) dbUpdates.style = updates.style;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;

    supabase
      .from("ifpos_frames")
      .update(dbUpdates)
      .eq("id", id)
      .then();
  }

  return frame;
}

export function updateFrameStock(id: string, newStock: number): Frame | null {
  return updateFrame(id, { stock: newStock });
}

// Fetch initial inventory from Supabase on startup if online
if (isSupabaseConfigured && supabase) {
  supabase
    .from("ifpos_frames")
    .select("*")
    .then(({ data }) => {
      if (data && data.length > 0) {
        const mapped: Frame[] = data.map((d) => ({
          id: d.id,
          brand: d.brand,
          model: d.model,
          style: d.style as FrameStyle,
          color: d.color as FrameColor,
          price: Number(d.price),
          stock: Number(d.stock),
          imageUrl: d.image_url,
        }));
        
        // In-place clear and push to frames array
        frames.length = 0;
        frames.push(...mapped);
      }
    });
}
