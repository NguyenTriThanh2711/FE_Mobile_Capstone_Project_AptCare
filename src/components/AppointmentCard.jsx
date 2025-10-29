import React, { memo } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Icon } from "@/src/components/Icon.native";

const colors = {
  primary: "#007AFF",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  text: "#111827",
  textSecondary: "#6B7280",
  white: "#FFFFFF",
  border: "#E5E7EB",
};

function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (["completed", "done", "resolved"].includes(s)) return { bg: "#EAFBE7", fg: "#2E7D32", label: "Hoàn tất" };
  if (["assigned", "working", "in_progress"].includes(s)) return { bg: "#E6F0FF", fg: "#1565C0", label: "Đã giao" };
  if (["pending", "new", "created"].includes(s)) return { bg: "#F3F4F6", fg: "#374151", label: "Mới" };
  if (["cancelled", "rejected"].includes(s)) return { bg: "#FEF2F2", fg: "#B91C1C", label: "Huỷ" };
  return { bg: "#F3F4F6", fg: "#374151", label: status || "-" };
}

function fmtHM(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function Pill({ icon, children }) {
  return (
    <View style={sx.pill}>
      {icon ? <Icon name={icon} size={14} color={colors.primary} /> : null}
      <Text style={sx.pillTxt} numberOfLines={1}>{children}</Text>
    </View>
  );
}

/**
 * AppointmentCard (flat)
 * - KHÔNG vẽ box bên trong
 * - Để parent bọc box (mỗi appointment 1 box riêng)
 */
function AppointmentCard({ appt, onPress }) {
  const tone = statusTone(appt?.status);

  const room = appt?.apartment?.roomNumber || "-";
  const floor = appt?.apartment?.floor ?? appt?.floor;
  const resident = appt?.resident || {};
  const residentName =
    (resident?.firstName || resident?.lastName)
      ? `${resident?.firstName || ""} ${resident?.lastName || ""}`.trim()
      : undefined;
  const residentPhone = resident?.phoneNumber;
  const timeLabel = `${fmtHM(appt?.startTime)}${appt?.endTime ? ` - ${fmtHM(appt.endTime)}` : ""}`;

  const openDetail = () => {
    if (onPress) return onPress();
    const id = appt?.repairRequestId ?? appt?.appointmentId;
    if (id) router.push(`/inspection/${id}`);
  };

  return (
    <Pressable onPress={openDetail} style={({ pressed }) => [sx.wrap, pressed && { opacity: 0.95 }]}>
      {/* Top: Time + Status */}
      <View style={sx.topRow}>
        <View style={sx.timePill}>
          <Icon name="clock" size={14} color={colors.primary} />
          <Text style={sx.timeTxt}>{timeLabel}</Text>
        </View>
        <View style={[sx.statusChip, { backgroundColor: tone.bg }]}>
          <Text style={[sx.statusTxt, { color: tone.fg }]} numberOfLines={1}>{tone.label}</Text>
        </View>
      </View>

      {/* Title */}
      <View style={sx.titleRow}>
        <View style={sx.thumb}>
          <Icon name="wrench.and.screwdriver" size={18} color="#fff" />
        </View>
        <Text style={sx.title} numberOfLines={1}>{appt?.object || appt?.title || "Cuộc hẹn sửa chữa"}</Text>
      </View>

      {/* Meta row */}
      <View style={sx.metaRow}>
        <Pill icon="building.2">Căn hộ {room}</Pill>
        {floor !== undefined && floor !== null ? <Pill icon="list.number">Tầng {String(floor)}</Pill> : null}
        {!!appt?.appointmentId && <Pill icon="number">{`#${appt.appointmentId}`}</Pill>}
      </View>

      {/* Resident */}
      {(residentName || residentPhone) && (
        <View style={sx.residentBlock}>
          {residentName ? <Text style={sx.residentName} numberOfLines={1}>{residentName}</Text> : null}
          {residentPhone ? (
            <View style={sx.phoneRow}>
              <Icon name="phone" size={14} color={colors.textSecondary} />
              <Text style={sx.phoneTxt}>{residentPhone}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Note */}
      {!!appt?.note && (
        <View style={sx.noteRow}>
          <Icon name="doc.text" size={14} color={colors.textSecondary} />
          <Text style={sx.noteTxt} numberOfLines={2}>{appt.note}</Text>
        </View>
      )}
    </Pressable>
  );
}

const sx = StyleSheet.create({
  wrap: { /* flat, parent lo box */ },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  timePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, backgroundColor: "#EAF2FF", borderWidth: 1, borderColor: "#D6E5FF",
  },
  timeTxt: { fontSize: 12, color: colors.primary, fontWeight: "700" },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusTxt: { fontSize: 12, fontWeight: "800" },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  thumb: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
  },
  title: { flex: 1, fontSize: 15, fontWeight: "800", color: colors.text },

  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1, borderColor: colors.border, backgroundColor: "#F8FAFF",
  },
  pillTxt: { fontSize: 12, fontWeight: "700", color: colors.primary },

  residentBlock: { marginTop: 8 },
  residentName: { fontSize: 13, fontWeight: "700", color: colors.text },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  phoneTxt: { fontSize: 12, color: colors.textSecondary },

  noteRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginTop: 8 },
  noteTxt: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});

export default memo(AppointmentCard);
