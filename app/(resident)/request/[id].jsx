import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { Icon } from "@/src/components/Icon.native";
import { dotnetArr } from "@/src/helper/dotnetArr";
import { selectCurrentRequest } from "@/src/features/requests/requestsSlice";
import { SafeAreaView } from "react-native-safe-area-context";
import { fmtDateTime } from "@/src/utils/date";

const screen = Dimensions.get("window");

function StatusPill({ isEmergency }) {
  const bg = isEmergency ? "#FEE2E2" : "#E5F6FF";
  const fg = isEmergency ? "#B91C1C" : "#0C4A6E";
  const text = isEmergency ? "Khẩn cấp" : "Bình thường";
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{text}</Text>
    </View>
  );
}

export default function RequestDetail() {
  const { id } = useLocalSearchParams();
  const data = useSelector(selectCurrentRequest);

  // Nếu user vào trực tiếp mà store chưa có current -> có thể redirect về list
  // hoặc hiển thị một empty state nhẹ.
  if (!data || String(data?.repairRequestId) !== String(id)) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Không tìm thấy yêu cầu</Text>
        <Text style={styles.emptySub}>Hãy mở lại từ danh sách yêu cầu.</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron.left" size={18} color="#fff" />
          <Text style={styles.backBtnText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  const medias = useMemo(() => dotnetArr(data?.medias), [data]);
  const trackings = useMemo(() => dotnetArr(data?.requestTrackings), [data]);
  const appts = useMemo(() => dotnetArr(data?.appointments), [data]);

  const createdAt =
    fmtDateTime(data?.createdAt) ||
    fmtDateTime(trackings?.[0]?.updatedAt) ||
    "";

  // Viewer state
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const openViewer = (idx) => {
    if (!medias?.length) return;
    setViewerIndex(idx || 0);
    setViewerOpen(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerLeft} hitSlop={8}>
          <Icon name="chevron.left" size={24} color="#1a1a1a" />
          <Text style={styles.headerBack}>Quay lại</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.titleText} numberOfLines={2}>
              {data?.object || "Không có tiêu đề"}
            </Text>
            <View style={styles.metaRow}>
              <Icon name="calendar" size={14} color="#6B7280" />
              <Text style={styles.metaText}>{'Ngày tạo: '+createdAt || "—"}</Text>
            </View>
          </View>
          <StatusPill isEmergency={!!data?.isEmergency} />
        </View>

        {/* Issue & Apartment */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="wrench.and.screwdriver" size={16} color="#0C4A6E" />
            <Text style={styles.cardLabel}>Vấn đề</Text>
          </View>
          <Text style={styles.cardValue}>
            {data?.issue?.name || "—"}
          </Text>

          <View style={[styles.row, { marginTop: 12 }]}>
            <Icon name="building.2" size={16} color="#0C4A6E" />
            <Text style={styles.cardLabel}>Căn hộ</Text>
          </View>
          <Text style={styles.cardValue}>
            {data?.apartment
              ? `Tầng ${data?.apartment?.floor ?? ""} - P.${data?.apartment?.roomNumber ?? ""}`
              : "—"}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="doc.text" size={16} color="#6B7280" />
            <Text style={styles.cardLabel}>Mô tả</Text>
          </View>
          <Text style={styles.descText}>
            {data?.description || "—"}
          </Text>
        </View>

        {/* Medias */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="photo.fill" size={16} color="#6B7280" />
            <Text style={styles.cardLabel}>Hình ảnh</Text>
          </View>

          {(!medias || medias.length === 0) ? (
            <View style={styles.placeholderBox}>
              <Icon name="photo" size={22} color="#9CA3AF" />
              <Text style={styles.placeholderText}>Chưa có hình</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10, paddingTop: 10 }}
            >
              {medias.map((m, idx) => (
                <Pressable
                  key={m.mediaId || idx}
                  onPress={() => openViewer(idx)}
                  style={styles.thumbBox}
                >
                  <Image
                    source={{ uri: m.filePath }}
                    style={styles.thumb}
                    resizeMode="cover"
                    onError={(e) =>{
                        console.error('Image Error',e?.nativeEvent)
                    }}
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Appointments */}
        {appts?.length ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="calendar" size={16} color="#0C4A6E" />
              <Text style={styles.cardLabel}>Lịch hẹn</Text>
            </View>

            {appts.map((ap) => {
              const techs = dotnetArr(ap?.technicians);
              return (
                <View key={ap.appointmentId} style={styles.apptItem}>
                  <View style={styles.apptRow}>
                    <Icon name="clock.fill" size={14} color="#2563EB" />
                    <Text style={styles.apptTime}>
                      {fmtDateTime(ap.startTime)} — {fmtDateTime(ap.endTime)}
                    </Text>
                  </View>
                  <View style={styles.apptRow}>
                    <Icon name="checkmark.seal.fill" size={14} color="#16A34A" />
                    <Text style={styles.apptStatus}>{ap.status || "—"}</Text>
                  </View>
                  {!!techs?.length && (
                    <View style={styles.apptTechs}>
                      <Icon name="person.fill" size={14} color="#6B7280" />
                      <Text style={styles.apptTechsText}>
                        {techs.map((t) => `${t.firstName || ""} ${t.lastName || ""}`.trim()).join(", ")}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}

        {/* Tracking timeline */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="arrow.up.arrow.down" size={16} color="#6B7280" />
            <Text style={styles.cardLabel}>Tiến trình</Text>
          </View>
          {(!trackings || trackings.length === 0) ? (
            <Text style={styles.emptyLine}>Chưa có cập nhật.</Text>
          ) : (
            <View style={{ marginTop: 8 }}>
              {trackings.map((t) => (
                <View key={t.requestTrackingId} style={styles.trackRow}>
                  <View style={styles.trackDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackStatus}>{t.status}</Text>
                    <Text style={styles.trackTime}>{fmtDateTime(t.updatedAt)}</Text>
                    {t.updatedByUser ? (
                      <Text style={styles.trackBy}>
                        bởi {t.updatedByUser.firstName} {t.updatedByUser.lastName}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Requester */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="person.fill" size={16} color="#6B7280" />
            <Text style={styles.cardLabel}>Người yêu cầu</Text>
          </View>
          <Text style={styles.cardValue}>
            {(data?.user?.firstName || "") + " " + (data?.user?.lastName || "")}
          </Text>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Icon name="phone.fill" size={16} color="#16A34A" />
            <Text style={styles.smallValue}>{data?.user?.phoneNumber || "—"}</Text>
          </View>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Icon name="envelope.fill" size={16} color="#2563EB" />
            <Text style={styles.smallValue}>{data?.user?.email || "—"}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Viewer Modal */}
      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
      >
        <View style={styles.viewerBg}>
          <View style={styles.viewerHeader}>
            <Pressable onPress={() => setViewerOpen(false)} hitSlop={10} style={{ padding: 6 }}>
              <Icon name="xmark.circle.fill" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.viewerTitle}>
              {viewerIndex + 1}/{medias?.length || 0}
            </Text>
            <View style={{ width: 34 }} />
          </View>

          <FlatList
            data={medias}
            keyExtractor={(item, i) => String(item?.mediaId || i)}
            horizontal
            pagingEnabled
            initialScrollIndex={viewerIndex}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / screen.width);
              setViewerIndex(idx);
            }}
            getItemLayout={(_, index) => ({
              length: screen.width,
              offset: screen.width * index,
              index,
            })}
            renderItem={({ item }) => (
              <View
                style={{
                  width: screen.width,
                  height: screen.height,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Image
                  source={{ uri: item?.filePath }}
                  style={{ width: screen.width, height: screen.width }}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const THUMB = 96;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6, width: 92 },
  headerBack: { fontSize: 16, color: "#1a1a1a" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },

  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 },
  titleText: { fontSize: 18, fontWeight: "700", color: "#111827", lineHeight: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  metaText: { fontSize: 12, color: "#6B7280" },

  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  badgeText: { fontSize: 12, fontWeight: "800" },

  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardLabel: { fontSize: 14, fontWeight: "700", color: "#374151" },
  cardValue: { fontSize: 15, color: "#111827", marginTop: 6, fontWeight: "600" },

  descText: { fontSize: 14, color: "#374151", marginTop: 6, lineHeight: 20 },

  // media
  thumbBox: { width: THUMB, height: THUMB, borderRadius: 10, overflow: "hidden", backgroundColor: "#E5E7EB" },
  thumb: { width: "100%", height: "100%" },
  placeholderBox: {
    marginTop: 10,
    height: 100,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FAFAFA",
  },
  placeholderText: { color: "#6B7280", fontSize: 13, fontWeight: "600", marginTop: 6 },

  // appointments
  apptItem: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  apptRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  apptTime: { fontSize: 14, color: "#111827", fontWeight: "600" },
  apptStatus: { fontSize: 13, color: "#111827" },
  apptTechs: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  apptTechsText: { fontSize: 13, color: "#374151" },

  // tracking
  trackRow: { flexDirection: "row", gap: 12, paddingVertical: 8 },
  trackDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2563EB", marginTop: 6 },
  trackStatus: { fontSize: 14, fontWeight: "700", color: "#111827" },
  trackTime: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  trackBy: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  emptyLine: { fontSize: 13, color: "#6B7280", marginTop: 6 },

  // empty current
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: "#F8F9FA" },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  emptySub: { fontSize: 14, color: "#6B7280", marginTop: 6 },
  backBtn: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1e88e5", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  backBtnText: { color: "#fff", fontWeight: "700" },

  // viewer
  viewerBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  viewerHeader: {
    height: 56,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
    paddingHorizontal: 12,
    marginTop: 24,
  },
  viewerTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
