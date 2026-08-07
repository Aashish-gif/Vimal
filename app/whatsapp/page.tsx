"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Search as SearchIcon,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Info,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  searchInventory,
  getFrameById,
  type Frame,
  type SearchCriteria,
} from "@/lib/data/frames";
import {
  createReservation,
  type Reservation,
} from "@/lib/data/reservations";
import { findOrCreateCustomer, type Customer } from "@/lib/data/customers";
import {
  getPendingInboxForCustomer,
  markInboxDelivered,
  type InboxMessage,
} from "@/lib/data/inbox";
import { parseQuery, type ParsedQuery } from "@/lib/chat/parser";

const DEMO_CUSTOMER_INPUT = {
  name: "Rahul Sharma",
  phone: "+91 98765 43210",
};

const INITIAL_CUSTOMER: Customer = findOrCreateCustomer(DEMO_CUSTOMER_INPUT);

type MessageRole = "user" | "assistant";
type MessageStatus = "sending" | "sent" | "delivered" | "read";

interface MessageAttachment {
  type: "product-list";
  products: Frame[];
}

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
  status?: MessageStatus;
  attachment?: MessageAttachment;
}

const ASSISTANT_NAME = "Vimal Opticals";
const ASSISTANT_PHONE = "+91 44000 12345";

function generateMsgId(): string {
  return "m-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatPrice(price: number): string {
  return "₹" + price.toLocaleString("en-IN");
}

function buildCriteriaSummary(c: SearchCriteria): string[] {
  const parts: string[] = [];
  if (c.style) parts.push(c.style);
  if (c.color) parts.push(c.color);
  if (c.brand) parts.push(c.brand);
  if (c.maxPrice !== undefined && c.minPrice !== undefined) {
    parts.push(`between ${formatPrice(c.minPrice)} and ${formatPrice(c.maxPrice)}`);
  } else if (c.maxPrice !== undefined) {
    parts.push(`under ${formatPrice(c.maxPrice)}`);
  } else if (c.minPrice !== undefined) {
    parts.push(`above ${formatPrice(c.minPrice)}`);
  }
  return parts;
}

function pickFrameFromRecent(
  recent: Frame[],
  desc?: ParsedQuery["reserveDescription"]
): Frame | null {
  if (!recent.length) return null;
  if (!desc) return recent[0] ?? null;

  let pool = recent.slice();

  if (desc.color) {
    const filtered = pool.filter(
      (f) => f.color.toLowerCase() === desc.color!.toLowerCase()
    );
    if (filtered.length) pool = filtered;
  }
  if (desc.style) {
    const filtered = pool.filter(
      (f) => f.style.toLowerCase() === desc.style!.toLowerCase()
    );
    if (filtered.length) pool = filtered;
  }
  if (desc.brand) {
    const filtered = pool.filter((f) =>
      f.brand.toLowerCase().includes(desc.brand!.toLowerCase())
    );
    if (filtered.length) pool = filtered;
  }
  if (!pool.length) return null;
  if (typeof desc.ordinal === "number") {
    const idx = desc.ordinal === -1 ? pool.length - 1 : desc.ordinal;
    return pool[idx] ?? pool[0] ?? null;
  }
  return pool[0] ?? null;
}

/* ─── Status tick ────────────────────────────────────── */
function StatusCheck({ status }: { status?: MessageStatus }) {
  if (!status || status === "sending")
    return <Clock className="h-3 w-3 opacity-60" />;
  if (status === "sent") return <Check className="h-3 w-3 opacity-60" />;
  if (status === "delivered")
    return <CheckCheck className="h-3 w-3 opacity-60" />;
  return <CheckCheck className="h-3 w-3 text-sky-400" />;
}

/* ─── Product card inside chat ───────────────────────── */
function ProductCard({
  product,
  onReserve,
  disabled,
}: {
  product: Frame;
  onReserve: (frame: Frame) => void;
  disabled?: boolean;
}) {
  const isReserved = disabled;
  const outOfStock = product.stock <= 0;

  return (
    <div className="mb-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm last:mb-0">
      {/* Image */}
      <div className="relative h-32 w-full overflow-hidden bg-slate-50">
        <Image
          src={product.imageUrl}
          alt={`${product.brand} ${product.model}`}
          fill
          sizes="280px"
          className="object-contain p-3"
          unoptimized
        />
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {product.brand}
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold text-slate-900">
              {product.model}
            </p>
          </div>
          <p className="shrink-0 text-base font-bold text-emerald-700">
            {formatPrice(product.price)}
          </p>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[10px]">
            {product.style}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {product.color}
          </Badge>
          <Badge
            variant={product.stock > 0 ? "success" : "destructive"}
            className="text-[10px]"
          >
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </Badge>
        </div>

        <button
          disabled={isReserved || outOfStock}
          onClick={() => onReserve(product)}
          className={cn(
            "mt-3 w-full rounded-xl py-2 text-sm font-semibold transition-colors",
            isReserved
              ? "bg-emerald-50 text-emerald-700 cursor-default"
              : outOfStock
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-[#008069] text-white hover:bg-[#006b57]"
          )}
        >
          {isReserved ? "✓ Reserved" : outOfStock ? "Unavailable" : "Reserve"}
        </button>
      </div>
    </div>
  );
}

/* ─── Initial greeting ───────────────────────────────── */
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: generateMsgId(),
    role: "assistant",
    text: "Hi Rahul! 👋 Welcome to Vimal Opticals.\n\nI can help you find the perfect eyewear. Try asking things like:\n\n• \"Do you have aviators under ₹1500?\"\n• \"Show me black frames\"\n• \"Round glasses under ₹2000\"",
    timestamp: formatTime(new Date(Date.now() - 1000 * 60 * 2)),
  },
];

/* ─── Page ───────────────────────────────────────────── */
export default function WhatsAppPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [recentResults, setRecentResults] = useState<Frame[]>([]);
  const [reservedFrameIds, setReservedFrameIds] = useState<Set<string>>(
    new Set()
  );
  const [currentCustomer] = useState<Customer>(INITIAL_CUSTOMER);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const deliveredNotificationIds = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Poll for inbox notifications (order-arrived etc.)
  useEffect(() => {
    if (!currentCustomer) return;
    const flushPending = () => {
      const pending = getPendingInboxForCustomer(currentCustomer.id);
      const undelivered = pending.filter(
        (m) => !deliveredNotificationIds.current.has(m.id)
      );
      if (!undelivered.length) return;

      const items: Array<{ inboxMsg: InboxMessage; chatMsg: ChatMessage }> = [];
      for (const inboxMsg of undelivered) {
        items.push({
          inboxMsg,
          chatMsg: {
            id: "in-" + inboxMsg.id,
            role: "assistant",
            text: inboxMsg.text,
            timestamp: formatTime(new Date(inboxMsg.createdAt)),
          },
        });
        deliveredNotificationIds.current.add(inboxMsg.id);
      }
      markInboxDelivered(items.map((i) => i.inboxMsg.id));
      setMessages((prev) => [...prev, ...items.map((i) => i.chatMsg)]);
    };

    flushPending();
    const id = setInterval(flushPending, 1200);
    return () => clearInterval(id);
  }, [currentCustomer]);

  const updateMessageStatus = (id: string, status: MessageStatus) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
  };

  const pushAssistantMessage = (
    text: string,
    attachment?: MessageAttachment,
    delay = 900
  ) => {
    setIsTyping(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsTyping(false);
        const now = new Date();
        setMessages((prev) => [
          ...prev,
          {
            id: generateMsgId(),
            role: "assistant",
            text,
            timestamp: formatTime(now),
            attachment,
          },
        ]);
        resolve();
      }, delay);
    });
  };

  const performReserve = (frame: Frame) => {
    if (reservedFrameIds.has(frame.id)) {
      return pushAssistantMessage(
        "That frame is already reserved. Would you like to look at similar options?"
      );
    }
    const fresh = getFrameById(frame.id);
    if (!fresh || fresh.stock <= 0) {
      return pushAssistantMessage(
        "Sorry, that frame just went out of stock. Let me show you similar ones.",
        {
          type: "product-list",
          products: searchInventory({ style: frame.style, inStockOnly: true }).slice(0, 4),
        }
      );
    }

    const customer: Customer = findOrCreateCustomer(DEMO_CUSTOMER_INPUT);
    const reservation: Reservation | null = createReservation({
      customer,
      frameId: fresh.id,
    });
    if (!reservation) {
      return pushAssistantMessage(
        "Sorry, that frame is currently unavailable. Try another one!"
      );
    }

    setReservedFrameIds((prev) => new Set(prev).add(frame.id));
    const updated = getFrameById(fresh.id);
    const reservedCard: MessageAttachment = {
      type: "product-list",
      products: [
        { ...fresh, stock: updated ? updated.stock : Math.max(0, fresh.stock) },
      ],
    };

    return pushAssistantMessage(
      "Done! ✅ I've reserved this frame for you. You can try it at Vimal Opticals.\n\nIt will be held for 24 hours. See you soon! 👓",
      reservedCard,
      1100
    );
  };

  const handleSearch = (parsed: ParsedQuery) => {
    const results = searchInventory({ ...parsed.criteria, inStockOnly: true });
    const summary = buildCriteriaSummary(parsed.criteria);
    const summaryText = summary.length ? `for ${summary.join(", ")}` : "in our catalog";

    if (!results.length) {
      const fallback = searchInventory({ inStockOnly: true }).slice(0, 4);
      setRecentResults(fallback);
      return pushAssistantMessage(
        `Hmm, I couldn't find any frames ${summaryText}. Let me show you some popular options instead:`,
        { type: "product-list", products: fallback }
      );
    }

    const shown = results.slice(0, 6);
    setRecentResults(shown);
    const countText =
      results.length === 1
        ? "1 match"
        : results.length > shown.length
        ? `${shown.length} of ${results.length} matches`
        : `${results.length} matches`;

    return pushAssistantMessage(
      `Here you go! 👓 I found ${countText} ${summaryText}:`,
      { type: "product-list", products: shown }
    );
  };

  const handleReserveByText = (parsed: ParsedQuery) => {
    if (!recentResults.length) {
      return pushAssistantMessage(
        "Sure! Could you first tell me what you're looking for? Try: \"Show me black aviators.\""
      );
    }
    const frame = pickFrameFromRecent(recentResults, parsed.reserveDescription);
    if (!frame) {
      const clues: string[] = [];
      if (parsed.reserveDescription?.color) clues.push(parsed.reserveDescription.color);
      if (parsed.reserveDescription?.style) clues.push(parsed.reserveDescription.style);
      if (parsed.reserveDescription?.brand) clues.push(parsed.reserveDescription.brand);
      const hint = clues.length ? `a ${clues.join(" ")} one` : "that";
      return pushAssistantMessage(
        `I couldn't find ${hint} in the last results. Which one would you like? Tap "Reserve" on any product card.`
      );
    }
    return performReserve(frame);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsgId = generateMsgId();
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text,
      timestamp: formatTime(new Date()),
      status: "sending",
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => updateMessageStatus(userMsgId, "sent"), 200);
    setTimeout(() => updateMessageStatus(userMsgId, "delivered"), 500);
    setTimeout(() => updateMessageStatus(userMsgId, "read"), 900);

    const parsed = parseQuery(text);

    if (parsed.intent === "greeting") {
      await pushAssistantMessage(
        "Hello! 😊 How can I help you find the perfect eyewear today? Ask me for frames by style, color, brand, or price."
      );
      return;
    }
    if (parsed.intent === "reserve") {
      await handleReserveByText(parsed);
      return;
    }
    if (parsed.intent === "search") {
      await handleSearch(parsed);
      return;
    }

    await pushAssistantMessage(
      "I'm not sure I understood that. 🤔 You can ask me things like:\n\n• \"Do you have round glasses?\"\n• \"Aviators under ₹1500\"\n• \"Show me black frames from Ray-Ban\""
    );
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = useMemo(
    () => [
      "Aviators under ₹1500",
      "Show me black frames",
      "Round glasses under ₹2000",
      "Blue wayfarers",
    ],
    []
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      {/* Demo banner */}
      <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-800">
        <Info className="h-3.5 w-3.5 shrink-0 text-amber-500" />
        <span>
          <strong>Demo Simulation</strong> — This is a simulated WhatsApp customer
          experience for FDE evaluation. No real messages are sent.
        </span>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col lg:my-4 lg:h-[calc(100vh-7rem)] lg:overflow-hidden lg:rounded-2xl lg:shadow-2xl">
        {/* WhatsApp header */}
        <div className="flex items-center gap-3 bg-[#008069] px-3 py-2.5 text-white sm:px-4 lg:rounded-t-2xl">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 text-white hover:bg-white/10 lg:hidden"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Avatar */}
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/20">
            <span className="text-sm font-bold">V</span>
            {/* Online dot */}
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#008069]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {ASSISTANT_NAME}
            </p>
            <p className="truncate text-[11px] text-emerald-100/90">
              {isTyping ? "typing…" : `online · ${ASSISTANT_PHONE}`}
            </p>
          </div>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10"
              aria-label="Video call"
            >
              <Video className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10"
              aria-label="Voice call"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10"
              aria-label="Search chat"
            >
              <SearchIcon className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-white hover:bg-white/10"
              aria-label="More options"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages area */}
        <div
          className="relative flex-1 overflow-y-auto px-2 py-3 sm:px-4"
          style={{
            backgroundColor: "#efeae2",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d8d2c4' fill-opacity='0.35' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-1.5 pb-2">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex w-full",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "relative max-w-[90%] sm:max-w-[80%] rounded-2xl px-3 py-2",
                    m.role === "user"
                      ? "rounded-br-sm bg-[#d9fdd3] text-slate-900"
                      : "rounded-bl-sm bg-white text-slate-900"
                  )}
                  style={{ boxShadow: "0 1px 1px rgba(0,0,0,0.07)" }}
                >
                  {/* Product cards */}
                  {m.attachment?.type === "product-list" &&
                  m.attachment.products.length ? (
                    <div className="mb-2 min-w-[240px] sm:min-w-[280px]">
                      {m.attachment.products.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          onReserve={performReserve}
                          disabled={reservedFrameIds.has(p.id)}
                        />
                      ))}
                    </div>
                  ) : null}

                  {/* Message text */}
                  <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">
                    {m.text}
                  </p>

                  {/* Timestamp + tick */}
                  <div
                    className={cn(
                      "mt-0.5 flex items-center justify-end gap-1",
                      m.role === "user" ? "text-slate-500" : "text-slate-400"
                    )}
                  >
                    <span className="text-[10px] leading-none">{m.timestamp}</span>
                    {m.role === "user" && <StatusCheck status={m.status} />}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping ? (
              <div className="flex justify-start">
                <div
                  className="rounded-2xl rounded-bl-sm bg-white px-4 py-3"
                  style={{ boxShadow: "0 1px 1px rgba(0,0,0,0.07)" }}
                >
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="border-t border-slate-200 bg-[#f0f2f5] px-2 py-2 sm:px-3 lg:rounded-b-2xl">
          {/* Quick suggestions (only before user sends first message) */}
          {messages.length <= 1 ? (
            <div className="mx-auto mb-2 flex max-w-2xl flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mx-auto flex max-w-2xl items-end gap-2">
            <div className="flex min-w-0 flex-1 items-end rounded-2xl bg-white px-3 shadow-sm ring-1 ring-slate-200 focus-within:ring-[#008069] transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Type a message"
                className="max-h-32 min-h-[42px] flex-1 resize-none bg-transparent py-2.5 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <Button
              type="button"
              onClick={handleSend}
              disabled={!input.trim()}
              variant="default"
              size="icon"
              className="h-[42px] w-[42px] shrink-0 rounded-full bg-[#008069] text-white hover:bg-[#006b57] disabled:bg-slate-300"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          <p className="mx-auto mt-1.5 max-w-2xl text-center text-[10px] text-slate-400">
            Rahul Sharma · Simulated customer session · Powered by Vimal Opticals AI
          </p>
        </div>
      </div>
    </div>
  );
}
