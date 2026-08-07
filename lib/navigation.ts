import {
  LayoutDashboard,
  Package,
  ClipboardList,
  BookmarkCheck,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: string; // optional pill label e.g. "Customer"
};

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview of store activity",
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
    description: "Manage optical frame stock",
  },
  {
    title: "Customer Assistant",
    href: "/whatsapp",
    icon: MessageSquare,
    description: "Simulated WhatsApp customer chat",
    badge: "Customer",
  },
  {
    title: "Reservations",
    href: "/reservations",
    icon: BookmarkCheck,
    description: "Customer frame holds",
  },
  {
    title: "Orders",
    href: "/orders",
    icon: ClipboardList,
    description: "Track custom frame orders",
  },
];
