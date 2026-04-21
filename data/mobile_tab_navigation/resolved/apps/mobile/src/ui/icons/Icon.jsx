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

  clipboardList: "clipboard-outline",
};

export function Icon({ name, size = 20, color = "#000", style }) {
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
}

export default Icon;
