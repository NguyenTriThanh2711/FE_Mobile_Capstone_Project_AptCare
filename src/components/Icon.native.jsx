import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

/**
 * Pseudo SF → Ionicons
 * Dùng .fill cho dạng solid, bỏ .fill = outline
 */
const MAP = {
  // Tabs cơ bản
  "home.fill": "home",
  "home": "home-outline",

  "requests.fill": "list",
  "requests": "list-outline",

  "payments.fill": "card",
  "payments": "card-outline",

  "chat.fill": "chatbubbles",
  "chat": "chatbubbles-outline",

  "profile.fill": "person",
  "profile": "person-outline",

  // Quick actions / info (bổ sung)
  "plus.circle.fill": "add-circle",
  "plus.circle": "add-circle-outline",

  "exclamationmark.triangle.fill": "warning",
  "exclamationmark.triangle": "warning-outline",

  "star.fill": "star",
  "star": "star-outline",

  "flag.fill": "flag",
  "flag": "flag-outline",

  "phone.fill": "call",
  "phone": "call-outline",

  "clock.fill": "time",
  "clock": "time-outline",

  "envelope.fill": "mail",
  "envelope": "mail-outline",
};

export function Icon({ name, size = 24, color = "#000", style }) {
  const iconName = MAP[name];
  if (!iconName) return null;
  return <Ionicons name={iconName} size={size} color={color} style={style} />;
}
