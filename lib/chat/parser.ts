import type { SearchCriteria } from "../data/frames";

const STYLE_ALIASES: Record<string, string> = {
  aviator: "Aviator",
  aviators: "Aviator",
  "aviator style": "Aviator",
  round: "Round",
  "round glasses": "Round",
  "round frames": "Round",
  "round shape": "Round",
  circular: "Round",
  square: "Square",
  "square frames": "Square",
  "square glasses": "Square",
  rectangle: "Rectangle",
  rectangular: "Rectangle",
  "rectangle frames": "Rectangle",
  cateye: "Cat-Eye",
  "cat-eye": "Cat-Eye",
  "cat eye": "Cat-Eye",
  "cat's eye": "Cat-Eye",
  wayfarer: "Wayfarer",
  wayfarers: "Wayfarer",
  clubmaster: "Clubmaster",
  "club master": "Clubmaster",
  browline: "Browline",
  "brow line": "Browline",
  oval: "Oval",
  "oval frames": "Oval",
};

const COLOR_ALIASES: Record<string, string> = {
  black: "Black",
  "black color": "Black",
  "black frames": "Black",
  "the black one": "Black",
  "black ones": "Black",
  brown: "Brown",
  "brown color": "Brown",
  "brown frames": "Brown",
  "the brown one": "Brown",
  "brown ones": "Brown",
  gold: "Gold",
  golden: "Gold",
  "gold color": "Gold",
  "the gold one": "Gold",
  silver: "Silver",
  "silver color": "Silver",
  "the silver one": "Silver",
  tortoise: "Tortoise",
  tortoiseshell: "Tortoise",
  "tortoise shell": "Tortoise",
  blue: "Blue",
  "blue color": "Blue",
  "the blue one": "Blue",
  "blue ones": "Blue",
  red: "Red",
  "red color": "Red",
  "the red one": "Red",
  "red ones": "Red",
  gunmetal: "Gunmetal",
  "gun metal": "Gunmetal",
  grey: "Gunmetal",
  "gray metal": "Gunmetal",
  havana: "Havana",
  "havana brown": "Havana",
  clear: "Clear",
  transparent: "Clear",
  "clear frames": "Clear",
};

const BRAND_ALIASES: Record<string, string> = {
  rayban: "Ray-Ban",
  "ray ban": "Ray-Ban",
  "ray-ban": "Ray-Ban",
  raybans: "Ray-Ban",
  oakley: "Oakley",
  persol: "Persol",
  vogue: "Vogue",
  lenskart: "LensKart",
  "lens kart": "LensKart",
  "tom ford": "Tom Ford",
  tomford: "Tom Ford",
  "vince camuto": "Vince Camuto",
  vincentcamuto: "Vince Camuto",
  titan: "Titan",
  fastrack: "Fastrack",
};

export interface ParsedQuery {
  intent: "search" | "reserve" | "greeting" | "unknown";
  criteria: SearchCriteria;
  reserveDescription?: {
    color?: string;
    ordinal?: number;
    style?: string;
    brand?: string;
  };
  rawText: string;
}

const PRICE_PATTERNS: RegExp[] = [
  /(?:under|below|less\s+than|cheaper\s+than|within|max|maximum|upto|up\s+to)\s*(?:₹|rs\.?|inr)?\s*(\d{1,6}(?:[.,]\d{1,2})?)/i,
  /(?:₹|rs\.?|inr)\s*(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:or\s+less|and\s+under|max|maximum)/i,
  /(?:₹|rs\.?|inr)\s*(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:\-|–|to|—)\s*(?:₹|rs\.?|inr)?\s*(\d{1,6}(?:[.,]\d{1,2})?)/i,
];

const MIN_PRICE_PATTERNS: RegExp[] = [
  /(?:above|over|more\s+than|greater\s+than|at\s+least|min|minimum|starts\s+at|from)\s*(?:₹|rs\.?|inr)?\s*(\d{1,6}(?:[.,]\d{1,2})?)/i,
];

const ANY_PRICE: RegExp = /(?:₹|rs\.?|inr)\s*(\d{1,6}(?:[.,]\d{1,2})?)/gi;

function normalizePrice(raw: string): number {
  return parseInt(raw.replace(/[.,]/g, "").replace(/\D/g, ""), 10);
}

function extractStyle(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const key of Object.keys(STYLE_ALIASES)) {
    if (lower.includes(key)) {
      return STYLE_ALIASES[key];
    }
  }
  return undefined;
}

function extractColor(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const key of Object.keys(COLOR_ALIASES)) {
    if (lower.includes(key)) {
      return COLOR_ALIASES[key];
    }
  }
  return undefined;
}

function extractBrand(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const key of Object.keys(BRAND_ALIASES)) {
    if (lower.includes(key)) {
      return BRAND_ALIASES[key];
    }
  }
  return undefined;
}

function extractPrices(text: string): {
  maxPrice?: number;
  minPrice?: number;
} {
  for (const pattern of PRICE_PATTERNS) {
    const m = text.match(pattern);
    if (!m) continue;
    if (m.length >= 3 && m[2]) {
      return {
        minPrice: normalizePrice(m[1]),
        maxPrice: normalizePrice(m[2]),
      };
    }
    return { maxPrice: normalizePrice(m[1]) };
  }

  for (const pattern of MIN_PRICE_PATTERNS) {
    const m = text.match(pattern);
    if (m) {
      return { minPrice: normalizePrice(m[1]) };
    }
  }

  const matches = Array.from(text.matchAll(ANY_PRICE));
  if (matches.length === 1) {
    const value = normalizePrice(matches[0][1]);
    const lower = text.toLowerCase();
    if (
      lower.includes("under") ||
      lower.includes("below") ||
      lower.includes("less than") ||
      lower.includes("within") ||
      lower.includes("upto") ||
      lower.includes("up to") ||
      lower.includes("max") ||
      lower.includes("or less")
    ) {
      return { maxPrice: value };
    }
    if (
      lower.includes("above") ||
      lower.includes("over") ||
      lower.includes("more than") ||
      lower.includes("at least") ||
      lower.includes("min") ||
      lower.includes("starts at") ||
      lower.includes("from")
    ) {
      return { minPrice: value };
    }
    return { maxPrice: value };
  }
  if (matches.length >= 2) {
    const values = matches.map((m) => normalizePrice(m[1])).sort((a, b) => a - b);
    return { minPrice: values[0], maxPrice: values[values.length - 1] };
  }

  return {};
}

function detectIntent(text: string): "search" | "reserve" | "greeting" | "unknown" {
  const lower = text.toLowerCase().trim();

  const greetings = [
    "hi",
    "hello",
    "hey",
    "hola",
    "good morning",
    "good afternoon",
    "good evening",
    "namaste",
  ];
  if (greetings.some((g) => lower === g || lower.startsWith(g + " ") || lower.startsWith(g + ","))) {
    return "greeting";
  }

  const reserveKeywords = [
    "reserve",
    "book",
    "hold",
    "keep",
    "save",
    "block",
    "i want the",
    "i'll take the",
    "i will take the",
    "give me the",
    "can i have the",
    "get me the",
    "pick the",
    "select the",
    "choose the",
  ];
  if (reserveKeywords.some((kw) => lower.includes(kw))) {
    return "reserve";
  }

  const searchKeywords = [
    "show",
    "do you have",
    "have you got",
    "looking for",
    "want",
    "need",
    "find",
    "search",
    "browse",
    "any",
    "what",
    "which",
    "suggest",
    "recommend",
  ];
  if (searchKeywords.some((kw) => lower.includes(kw))) {
    return "search";
  }

  if (
    lower.includes("glasses") ||
    lower.includes("frames") ||
    lower.includes("sunglasses") ||
    lower.includes("spectacles") ||
    lower.includes("eyeglasses")
  ) {
    return "search";
  }

  if (
    extractStyle(lower) ||
    extractColor(lower) ||
    extractBrand(lower) ||
    extractPrices(lower).maxPrice ||
    extractPrices(lower).minPrice
  ) {
    return "search";
  }

  return "unknown";
}

function extractReserveDescription(text: string): ParsedQuery["reserveDescription"] {
  const lower = text.toLowerCase();
  const desc: ParsedQuery["reserveDescription"] = {};

  const ordinalMatch = lower.match(
    /(?:first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|last)\s*(?:one|item|product|frame)?/i
  );
  if (ordinalMatch) {
    const token = ordinalMatch[0].toLowerCase();
    if (token.includes("first") || token.includes("1st")) desc.ordinal = 0;
    else if (token.includes("second") || token.includes("2nd")) desc.ordinal = 1;
    else if (token.includes("third") || token.includes("3rd")) desc.ordinal = 2;
    else if (token.includes("fourth") || token.includes("4th")) desc.ordinal = 3;
    else if (token.includes("fifth") || token.includes("5th")) desc.ordinal = 4;
    else if (token.includes("last")) desc.ordinal = -1;
  }

  const directIdx = lower.match(/number\s*(\d)|#\s*(\d)|(\d)(?:st|nd|rd|th)/i);
  if (directIdx && desc.ordinal === undefined) {
    const n = parseInt(directIdx[1] || directIdx[2] || directIdx[3], 10);
    if (!isNaN(n) && n >= 1) desc.ordinal = n - 1;
  }

  const color = extractColor(lower);
  if (color) desc.color = color;

  const style = extractStyle(lower);
  if (style) desc.style = style;

  const brand = extractBrand(lower);
  if (brand) desc.brand = brand;

  const genericMatches = [
    /(?:the|this|that)\s+one\s+with\s+(\w+)/i,
    /(?:the|this|that)\s+(\w+)\s+one/i,
  ];
  if (!desc.color && !desc.style) {
    for (const gp of genericMatches) {
      const m = lower.match(gp);
      if (m) {
        const word = m[1].toLowerCase();
        const c = extractColor(word);
        const s = extractStyle(word);
        if (c) desc.color = c;
        if (s) desc.style = s;
        break;
      }
    }
  }

  return Object.keys(desc).length ? desc : undefined;
}

export function parseQuery(text: string): ParsedQuery {
  const trimmed = text.trim();
  const intent = detectIntent(trimmed);
  const prices = extractPrices(trimmed);

  const criteria: SearchCriteria = {
    style: extractStyle(trimmed),
    color: extractColor(trimmed),
    brand: extractBrand(trimmed),
    maxPrice: prices.maxPrice,
    minPrice: prices.minPrice,
    inStockOnly: true,
  };

  return {
    intent,
    criteria,
    reserveDescription: extractReserveDescription(trimmed),
    rawText: trimmed,
  };
}
