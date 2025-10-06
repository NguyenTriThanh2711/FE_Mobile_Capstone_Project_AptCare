import React from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

/**
 * Pseudo SF → Ionicons
 * Dùng .fill = solid, không .fill = outline (tùy icon)
 */
const MAP = {
  // Tabs
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

  "plus.circle.fill": "add-circle",
  "plus.circle": "add-circle-outline",

  "plus": "add",                 // New Request nút
  "list.bullet": "list",         // Empty state
  "pencil": "pencil",            // Edit
  "trash": "trash",              // Delete

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

  // Profile
  "person.fill": "person",
  "person": "person-outline",
  "chevron.right": "chevron-forward",
  "chevron.left": "chevron-back",
  "lock": "lock-closed-outline", 
  "bell": "notifications-outline",         // hoặc "notifications"
  "envelope": "mail-outline",              // hoặc "mail"
  "wrench": "construct-outline",           // hoặc "construct"
  "creditcard": "card-outline",            // hoặc "card"
  "questionmark.circle": "help-circle-outline", // hoặc "help-circle"
  "doc.text": "document-text-outline"
};

export function Icon({ name, size = 24, color = "#000", style }) {
  const iconName = MAP[name];
  if (!iconName) {
    // fallback nhẹ nhàng nếu tên không khớp
    return <Ionicons name="help-circle-outline" size={size} color={color} style={style} />;
  }
  return <Ionicons name={iconName} size={size} color={color} style={style} />;
}
