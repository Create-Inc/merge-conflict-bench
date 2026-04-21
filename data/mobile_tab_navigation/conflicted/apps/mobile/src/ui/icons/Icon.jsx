<<<<<<< ours
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Path } from "react-native-svg";
import { View } from "react-native";

const IONICON_NAME_MAP = {
  arrowLeft: "arrow-back",
  chevronLeft: "chevron-back",
  chevronRight: "chevron-forward",
  plus: "add",
  calendar: "calendar-outline",
  calendarCheck: "calendar",
  creditCard: "card-outline",
  trendingUp: "trending-up-outline",
  receipt: "receipt-outline",
  info: "information-circle-outline",
  shield: "shield-outline",
  alertTriangle: "warning-outline",
  alertCircle: "alert-circle-outline",
  user: "person-outline",
  users: "people-outline",
  settings: "settings-outline",
  helpCircle: "help-circle-outline",
  logOut: "log-out-outline",
  mapPin: "location-outline",
  warehouse: "home-outline",
  edit: "create-outline",
  trash2: "trash-outline",
  camera: "camera-outline",
  x: "close",
  moon: "moon-outline",
  layoutGrid: "grid-outline",
  messageCircle: "chatbubble-outline",
  dollarSign: "cash-outline",
  clock: "time-outline",
  logIn: "log-in-outline",
  thermometer: "thermometer-outline",
  search: "search-outline",

  // not in the provided map, but used in a few spots (tasks shortcut)
  clipboardList: "clipboard-outline",
};

export default function Icon({ name, size = 20, color = "#000", style }) {
  if (name === "horse") {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={style}
      >
        <Path
          d="M12 3C7.5 3 4 6.5 4 11v7c0 .5.4 1 1 1s1-.5 1-1v-7c0-3.3 2.7-6 6-6s6 2.7 6 6v7c0 .5.4 1 1 1s1-.5 1-1v-7c0-4.5-3.5-8-8-8z"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M5 18v1c0 .5.4 1 1 1s1-.5 1-1v-1M18 18v1c0 .5.4 1 1 1s1-.5 1-1v-1"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  const ion = IONICON_NAME_MAP[name];
  if (ion) {
    return <Ionicons name={ion} size={size} color={color} style={style} />;
  }

  return <View style={[{ width: size, height: size }, style]} />;
=======
import React from "react";
import {
  AlertTriangle,
  TriangleAlert,
  MessageSquare,
  MessagesSquare,
  Calendar,
  Horse,
  Users,
  ClipboardList,
  Search,
  Bell,
  Clock,
  MapPin,
  DollarSign,
  CloudRain,
  ChevronRight,
  Thermometer,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  StickyNote,
} from "lucide-react-native";

/**
 * BarnOps Icon Wrapper (Option B)
 * Use <Icon name="alerts" size={20} color="#fff" />
 * Never import lucide-react-native directly anywhere else in the app.
 */

// Safe fallbacks for version differences
const AlertsIcon = TriangleAlert || AlertTriangle;
const ChatIcon = MessagesSquare || MessageSquare;

// Registry = your app’s stable icon names
const REGISTRY = {
  alerts: AlertsIcon,
  chat: ChatIcon,
  calendar: Calendar,
  horse: Horse,
  staff: Users,
  tasks: ClipboardList,
  search: Search,
  bell: Bell,
  clock: Clock,
  mapPin: MapPin,
  dollar: DollarSign,
  rain: CloudRain,
  chevronRight: ChevronRight,
  thermometer: Thermometer,
  clipboardCheck: ClipboardCheck,
  check: CheckCircle2,
  x: XCircle,
  logIn: LogIn,
  logOut: LogOut,
  note: StickyNote,
};

export function Icon({ name, size = 20, color = "#fff" }) {
  const C = REGISTRY[name] || AlertTriangle; // final fallback: never crash
  return <C size={size} color={color} />;
>>>>>>> theirs
}
