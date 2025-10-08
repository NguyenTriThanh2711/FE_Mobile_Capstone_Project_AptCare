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
  "doc.text": "document-text-outline",

   // ===== kỹ thuật viên =====
  // Lịch
  "calendar": "calendar",
  "calendar.fill": "calendar", // Ionicons không có fill riêng

  // Check/Done
  "checkmark.circle": "checkmark-circle-outline",
  "checkmark.circle.fill": "checkmark-circle",
  "checkmark.seal": "shield-checkmark-outline",    
  "checkmark.seal.fill": "shield-checkmark",
  // Thời tiết
  "cloud.sun.fill": "partly-sunny",
  "sun.max.fill": "sunny",
  "cloud.rain.fill": "rainy",
  "cloud.bolt.rain.fill": "thunderstorm",
  "drop.fill": "water",
  "wind": "leaf",
  // Tools / sửa chữa
  "wrench.and.screwdriver": "construct-outline",
  "wrench.and.screwdriver.fill": "construct",

  // Play / Pause / Stop (circle)
  "play.circle.fill": "play-circle",
  "play.circle": "play-circle-outline",
  "pause.circle.fill": "pause-circle",
  "pause.circle": "pause-circle-outline",
  "stop.circle.fill": "stop-circle",
  "stop.circle": "stop-circle-outline",

  // Tòa nhà & phòng
  "building.2": "business",                 // biểu tượng tòa nhà
  "building.2.fill": "business",            // không có fill riêng
  "door.left.hand.closed": "enter-outline", // không có icon "door", dùng enter như biểu đạt lối vào
  "door.left.hand.closed.fill": "enter",    // gần nghĩa solid

  // Thời gian & cảnh báo (đã có ở trên nhưng thêm alias nếu cần)
  "clock.badge.exclamationmark": "alert-circle-outline",
  "clock.badge.checkmark": "checkmark-done-circle-outline",
};

export function Icon({ name, size = 24, color = "#000", style }) {
  const iconName = MAP[name];
  if (!iconName) {
    // fallback nhẹ nhàng nếu tên không khớp
    return <Ionicons name="help-circle-outline" size={size} color={color} style={style} />;
  }
  return <Ionicons name={iconName} size={size} color={color} style={style} />;
}
