// app/inspection/[id].jsx
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

// ⬇️ màu lấy từ file của bạn (đừng sửa file đó)
import {
  Colors,
  zincColors,
  appleBlue,
  appleGreen,
  appleRed,
  borderColor,
} from "@/src/utils/colors";
import { Icon } from "@/src/components/Icon.native";

// ===== mock data gọn để chạy UI ngay (không import mockRepairRequests/currentUser) =====
const CURRENT_USER = { id: "u-1", role: "technician", name: "Technician A" };
const SAMPLE_INSPECTIONS = [
  {
    id: "insp-1001",
    title: "Rò rỉ nước phòng tắm",
    category: "plumbing",
    description:
      "Nước rò rỉ quanh chân bồn cầu, cần kiểm tra van và ống dẫn. Có mùi ẩm mốc nhẹ.",
    residentName: "Nguyễn Văn B",
    residentId: "res-12",
    apartment: "B2-12.05",
    priority: "high", // low | medium | high
    status: "pending", // pending | in_progress | completed
    technicianName: "Trần Kỹ Thuật",
    createdAt: "2025-01-10T09:45:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
    scheduledDate: "2025-01-11T14:00:00Z",
    appointmentId: "appt-7788",
    faultOwner: "BuildingFault", // BuildingFault | ResidentFault
    solutionType: "Repair",
    solution: "-",
  },
  {
    id: "insp-1002",
    title: "Điện chập chờn phòng khách",
    category: "electric",
    description: "Đèn chớp và ổ cắm nóng. Kiểm tra aptomat và dây nối.",
    residentName: "Lê Thị C",
    residentId: "res-33",
    apartment: "C1-08.02",
    priority: "medium",
    status: "in_progress",
    technicianName: "Trần Kỹ Thuật",
    createdAt: "2025-01-09T07:20:00Z",
    updatedAt: "2025-01-10T03:30:00Z",
    scheduledDate: "2025-01-10T09:00:00Z",
    appointmentId: "appt-8899",
    faultOwner: "ResidentFault",
    solutionType: "Replace",
    solution: "Thay công tắc + ổ cắm chịu tải",
  },
];

const THEME = Colors.light;

const Badge = ({ text, tone = "muted" }) => {
  const map = {
    muted: { bg: zincColors[100], color: zincColors[700] },
    info: { bg: "#F0F9FF", color: appleBlue },
    success: { bg: "#EAFBE7", color: appleGreen },
    warning: { bg: "#FFF7ED", color: "#F59E0B" },
    danger: { bg: "#FEF2F2", color: appleRed },
  };
  const t = map[tone] || map.muted;
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.color }]}>{text}</Text>
    </View>
  );
};

export default function InspectionDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("details");

  const inspection = useMemo(
    () => SAMPLE_INSPECTIONS.find((i) => String(i.id) === String(id)) || SAMPLE_INSPECTIONS[0],
    [id]
  );
  const isTechnician = CURRENT_USER.role === "technician";

  const statusTone =
    inspection.status === "completed"
      ? "success"
      : inspection.status === "in_progress"
      ? "info"
      : "muted";

  const formatDate = (s) => {
    try {
      return new Date(s).toLocaleString("vi-VN", {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return s;
    }
  };

  // ===== hành động bám swimlane =====
  const handleStartRepair = () => {
    Alert.alert("Bắt đầu sửa", "Đánh dấu bắt đầu xử lý?", [
      { text: "Để sau", style: "cancel" },
      { text: "Bắt đầu", onPress: () => console.log("Start repair -> status=in_progress") },
    ]);
  };

  const handleUpdateProgress = () => {
    Alert.alert("Cập nhật tiến độ", "Chọn cập nhật:", [
      { text: "Huỷ", style: "cancel" },
      { text: "Upload ảnh", onPress: () => console.log("Upload photos flow (placeholder)") },
      { text: "Đang xử lý", onPress: () => console.log("status=in_progress") },
      { text: "Hoàn tất", onPress: () => console.log("status=completed") },
    ]);
  };

  const handleMarkCompleted = () => {
    Alert.alert("Thanh toán", "Khách đã thanh toán?", [
      { text: "Chưa", onPress: () => router.push(`/payment?appointmentId=${inspection.appointmentId}`) },
      {
        text: "Rồi",
        onPress: () => {
          console.log("Paid -> Mark completed");
          router.push(
            `/reports/create?inspectionId=${inspection.id}&appointmentId=${inspection.appointmentId}`
          );
        },
      },
    ]);
  };

  const handleCreateReport = () => {
    router.push(
      `/reports/create?inspectionId=${inspection.id}&appointmentId=${inspection.appointmentId}`
    );
  };

  const handleChat = () => router.push(`/chat/${inspection.id}`);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Icon name="wrench.and.screwdriver" size={22} color={appleBlue} />
            <Text style={styles.headerCategory}>INSPECTION</Text>
          </View>
          <Badge
            text={(inspection.priority || "").toUpperCase()}
            tone={inspection.priority === "high" ? "danger" : inspection.priority === "low" ? "muted" : "warning"}
          />
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {inspection.title}
        </Text>

        <View style={styles.metaRow}>
          <Badge text={(inspection.status || "").toUpperCase()} tone={statusTone} />
          {inspection.technicianName ? (
            <View style={styles.metaItem}>
              <Icon name="person" size={16} color={zincColors[500]} />
              <Text style={styles.metaText}>{inspection.technicianName}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["details", "updates", "chat"].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === "details" ? "Chi tiết" : tab === "updates" ? "Tiến độ" : "Chat"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === "details" && (
          <View style={styles.sectionWrap}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{inspection.description}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin </Text>
              <View style={styles.infoBlock}>
                <Item icon="doc.text" label="Inspection ID" value={inspection.id} />
                <Item icon="person" label="User ID" value={inspection.residentId} />
                <Item icon="calendar" label="Appointment ID" value={inspection.appointmentId} />
                <Item icon="flag" label="Fault Owner" value={inspection.faultOwner} />
                <Item icon="wrench" label="Solution Type" value={inspection.solutionType} />
                <Item icon="clock" label="Created" value={formatDate(inspection.createdAt)} />
                <Item icon="list.bullet" label="Solution" value={inspection.solution || "-"} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cư dân / Căn hộ</Text>
              <View style={styles.infoBlock}>
                <Item icon="person.fill" label="Cư dân" value={inspection.residentName} />
                <Item icon="building.2" label="Căn hộ" value={inspection.apartment} />
                {inspection.scheduledDate ? (
                  <Item icon="clock.fill" label="Lịch hẹn" value={formatDate(inspection.scheduledDate)} />
                ) : null}
              </View>
            </View>
          </View>
        )}

        {activeTab === "updates" && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Dòng thời gian</Text>
            <View style={styles.timeline}>
              <TimelineItem
                icon="plus.circle"
                title="Tạo yêu cầu / Inspection"
                date={formatDate(inspection.createdAt)}
                desc={`Tạo bởi ${inspection.residentName}`}
              />
              {(inspection.status === "in_progress" || inspection.status === "completed") && (
                <TimelineItem
                  icon="play.circle"
                  title="Đã bắt đầu sửa"
                  date={formatDate(inspection.updatedAt)}
                  desc="Kỹ thuật viên bắt đầu xử lý"
                />
              )}
              {inspection.status === "completed" && (
                <TimelineItem
                  icon="checkmark.circle"
                  title="Hoàn tất"
                  date={formatDate(inspection.updatedAt)}
                  desc="Đã đánh dấu hoàn tất"
                />
              )}
            </View>
          </View>
        )}

        {activeTab === "chat" && (
          <View style={styles.sectionWrap}>
            <View style={styles.chatPlaceholder}>
              <Icon name="chat" size={44} color={zincColors[500]} />
              <Text style={styles.chatText}>Tin nhắn sẽ hiển thị tại đây</Text>
              <Pressable style={styles.ghostBtn} onPress={handleChat}>
                <Text style={styles.ghostBtnText}>Mở hội thoại</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <Pressable style={styles.primaryBtn} onPress={handleCreateReport}>
          <Icon name="doc.text" size={20} color={THEME.background} />
          <Text style={styles.primaryBtnText}>Tạo báo cáo</Text>
        </Pressable>

        {isTechnician ? (
          <>
            <Pressable style={styles.secondaryBtn} onPress={handleStartRepair}>
              <Icon name="play.circle" size={20} color={appleBlue} />
              <Text style={styles.secondaryBtnText}>Bắt đầu sửa</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={handleUpdateProgress}>
              <Icon name="pencil" size={20} color={appleBlue} />
              <Text style={styles.secondaryBtnText}>Cập nhật</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={handleMarkCompleted}>
              <Icon name="checkmark.circle" size={20} color={appleGreen} />
              <Text style={styles.secondaryBtnText}>Hoàn tất</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.secondaryBtn} onPress={handleChat}>
            <Icon name="chat" size={20} color={appleBlue} />
            <Text style={styles.secondaryBtnText}>Nhắn kỹ thuật</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Item({ icon, label, value }) {
  return (
    <View style={styles.itemRow}>
      <Icon name={icon} size={16} color={zincColors[500]} />
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemValue} numberOfLines={1}>
        {value || "-"}
      </Text>
    </View>
  );
}

function TimelineItem({ icon, title, date, desc }) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIcon}>
        <Icon name={icon} size={20} color={appleBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineDate}>{date}</Text>
        {!!desc && <Text style={styles.timelineDesc}>{desc}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  header: {
    padding: 20,
    backgroundColor: THEME.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerCategory: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
    color: appleBlue,
    letterSpacing: 0.5,
  },
  title: { fontSize: 24, fontWeight: "800", color: THEME.text, marginVertical: 6, lineHeight: 30 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: zincColors[100],
    borderRadius: 10,
  },
  metaText: { color: zincColors[600], fontSize: 12 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: "700" },

  tabContainer: {
    flexDirection: "row",
    backgroundColor: zincColors[50],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: appleBlue },
  tabText: { fontSize: 14, fontWeight: "500", color: zincColors[500] },
  activeTabText: { color: appleBlue, fontWeight: "700" },

  content: { flex: 1 },
  sectionWrap: { padding: 20 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: THEME.text, marginBottom: 14 },
  description: { fontSize: 16, color: THEME.text, lineHeight: 22 },

  infoBlock: { gap: 12 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: zincColors[100],
    borderRadius: 12,
  },
  itemLabel: { marginLeft: 10, color: zincColors[600], fontWeight: "600", flex: 1, fontSize: 14 },
  itemValue: { color: THEME.text, fontWeight: "700", fontSize: 14, maxWidth: "55%" },

  timeline: { paddingLeft: 8, marginTop: 6 },
  timelineItem: { flexDirection: "row", marginBottom: 20 },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    backgroundColor: THEME.background,
    borderWidth: 1,
    borderColor: borderColor,
  },
  timelineTitle: { fontSize: 16, fontWeight: "700", color: THEME.text },
  timelineDate: { marginTop: 2, fontSize: 12, color: zincColors[500] },
  timelineDesc: { marginTop: 6, fontSize: 14, color: zincColors[600], lineHeight: 20 },

  chatPlaceholder: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  chatText: { marginTop: 12, marginBottom: 20, color: zincColors[600], fontSize: 15 },

  actionBar: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: borderColor,
    backgroundColor: THEME.background,
  },
  primaryBtn: {
    flex: 1.1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: appleBlue,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: { marginLeft: 8, color: THEME.background, fontSize: 16, fontWeight: "700" },

  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: zincColors[50],
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: borderColor,
  },
  secondaryBtnText: { marginLeft: 8, color: appleBlue, fontSize: 16, fontWeight: "700" },

  ghostBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appleBlue,
    backgroundColor: "transparent",
  },
  ghostBtnText: { color: appleBlue, fontWeight: "700" },
});
