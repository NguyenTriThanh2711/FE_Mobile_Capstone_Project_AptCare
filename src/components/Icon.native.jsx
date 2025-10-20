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
  "chevron.down": "chevron-down",
  "chevron.up": "chevron-up",
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
  "sun.max": "sunny-outline",
  "cloud.fill": "cloud",
  "cloud": "cloud-outline",
  "cloud.sun": "partly-sunny-outline",
  "cloud.fog.fill": "cloudy",         // gần nghĩa sương mù
  "cloud.fog": "cloudy-outline",
  "cloud.drizzle.fill": "rainy",      // gần nghĩa mưa phùn
  "cloud.drizzle": "rainy-outline",
  "cloud.heavyrain.fill": "rainy",    // dùng cùng 'rainy' cho mưa to
  "cloud.heavyrain": "rainy-outline",
  "cloud.snow.fill": "snow",
  "cloud.snow": "snow-outline",
  "cloud.sun.rain.fill": "partly-sunny",
  "cloud.sun.rain": "partly-sunny-outline",
  "cloud.bolt.rain": "thunderstorm-outline",
  "smoke.fill": "cloudy",          
  "smoke": "cloudy-outline",
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
  "door.left.hand.closed": "enter-outline", // không có icon "door", dùng enter như biểu đạt lối vào
  "door.left.hand.closed.fill": "enter",    // gần nghĩa solid

  // Thời gian & cảnh báo (đã có ở trên nhưng thêm alias nếu cần)
  "clock.badge.exclamationmark": "alert-circle-outline",
  "clock.badge.checkmark": "checkmark-done-circle-outline",

  // Thiết bị
  "magnifyingglass": "search-outline",
  "flashlight.off.fill": "flashlight-outline",
  "flashlight.off": "flashlight-outline",
  "xmark.circle": "close-circle-outline",
  "xmark.circle.fill": "close-circle",

  // SF has "hazardsign" (cảnh báo tam giác)
  "hazardsign": "alert-circle-outline",
  "hazardsign.fill": "alert-circle",

  "arrow.up.arrow.down": "swap-vertical", // Ionicons không có outline riêng

  "photo": "image-outline",
  "photo.fill": "image",

  "camera": "camera-outline",
  "camera.fill": "camera",

 // “square.and.arrow.up” (SF Symbol = Share/Upload). Tuỳ ngữ cảnh, chọn upload:
  "square.and.arrow.up": "cloud-upload-outline",

  "tray": "tray-outline",
  "tray.fill": "tray",

  "note-text-outline": "document-text-outline",
  "text-box-outline": "document-text-outline"
};

export function Icon({ name, size = 24, color = "#000", style }) {
  const iconName = MAP[name];
  if (!iconName) {
    // fallback nhẹ nhàng nếu tên không khớp
    return <Ionicons name="help-circle-outline" size={size} color={color} style={style} />;
  }
  return <Ionicons name={iconName} size={size} color={color} style={style} />;
}
