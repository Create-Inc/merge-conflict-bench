import {
  LayoutDashboard,
  CheckSquare,
  Plane,
  Package,
  Truck,
  DollarSign,
  Users,
  Building2,
  MessageSquare,
  Target,
  TrendingUp,
  Sparkles,
  CalendarDays,
  FileText,
} from "lucide-react";

export const tradeShowTabs = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "tasks", label: "Tasks", icon: CheckSquare },
  { key: "leads", label: "Contacts", icon: Target },
  { key: "travel", label: "Travel", icon: Plane },
  { key: "schedule", label: "Schedule", icon: CalendarDays },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "budget", label: "Budget", icon: DollarSign },
  { key: "team", label: "Team", icon: Users },
  { key: "vendors", label: "Vendors", icon: Building2 },
  { key: "roi", label: "ROI Analysis", icon: TrendingUp },
  { key: "reports", label: "Reports", icon: FileText },
  {
    key: "ai-concierge",
    label: "Concierge",
    icon: Sparkles,
    // Paid add-on (not included in free trial)
    addon: "concierge",
  },
  { key: "chat", label: "Chat", icon: MessageSquare },
];
