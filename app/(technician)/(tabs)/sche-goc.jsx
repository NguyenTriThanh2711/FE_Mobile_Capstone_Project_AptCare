import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { Icon } from "@/src/components/Icon.native";
import { router } from "expo-router";
import {
  fetchMySchedule,
  selectWorkSlotsRaw,
  selectWorkSlotsLoading,
  selectWorkSlotsError,
} from "@/src/features/technician/workSlotsSlice";
import { useDispatch, useSelector } from "react-redux";
import BouncingDots from "@/src/components/common/BouncingDots";

// .NET $values helper (giữ nguyên “thô”)
const dotnetArr = (o) => (o && Array.isArray(o.$values) ? o.$values : []);

const colors = {
  primary: "#007AFF",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  text: "#1a1a1a",
  textSecondary: "#666",
  bg: "#f8f9fa",
  white: "#fff",
  border: "#e5e5e5",
};

const ymd = (d) => new Date(d).toISOString().slice(0, 10);
function formatViDate(d) {
  return d.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function TechnicianSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateListRef = useRef(null);
  const dispatch = useDispatch();
  const raw = useSelector(selectWorkSlotsRaw);       // toàn bộ payload thô
  const loading = useSelector(selectWorkSlotsLoading);
  const error = useSelector(selectWorkSlotsError);

  // Load lịch cho ±7 ngày quanh baseDate
  const loadRange = useCallback(
    (baseDate) => {
      const base = baseDate || selectedDate;
      const from = new Date(base);
      const to = new Date(base);
      from.setDate(from.getDate() - 7);
      to.setDate(to.getDate() + 7);
      return dispatch(fetchMySchedule({ fromDate: ymd(from), toDate: ymd(to) }));
    },
    [dispatch, selectedDate]
  );
  // Lần đầu & khi đổi ngày thì fetch (theo tuần chứa selectedDate)
  useEffect(() => {
    loadRange(selectedDate);
  }, [selectedDate, loadRange]);

  // Tạo danh sách 14 ngày của tuần chứa selectedDate (bắt đầu CN)
  const twoWeekDates = useMemo(() => {
    const base = new Date(selectedDate);
    const start = new Date(base);
    start.setHours(0,0,0,0);
    start.setDate(base.getDate() - 7);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);
  useEffect(() => {
    const idx = twoWeekDates.findIndex((d => d.toDateString() === selectedDate.toDateString()));
    if (idx < 0 || !dateListRef.current) return;
    const x = 16 + idx * (50 + 10); // padding + itemWidth + gap - half screen
    requestAnimationFrame(() => {
      dateListRef.current.scrollTo({ x, animated: true });
    });
  }, [twoWeekDates, selectedDate]);

  // Lấy mảng slot của ngày đang chọn
  const slotsToday = useMemo(() => {
    if (!raw) return [];
    const dayObj = dotnetArr(raw).find((d) => d?.date === ymd(selectedDate));
    if (!dayObj) return [];
    return dotnetArr(dayObj.slots); // [{ slotId, technicianWorkSlots }]
  }, [raw, selectedDate]);

  // Tổng số technicianWorkSlots trong ngày đang chọn (đếm thô)
  const totalToday = useMemo(() => {
    return slotsToday
      .map((s) => dotnetArr(s.technicianWorkSlots).length)
      .reduce((a, b) => a + b, 0);
  }, [slotsToday]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const promise = loadRange(selectedDate);
      // unwrap nếu là createAsyncThunk
      if (promise?.unwrap) await promise.unwrap();
      else await promise;
    } catch {}
    setRefreshing(false);
  }, [loadRange, selectedDate]);

  // ====== (Các modal cũ giữ nguyên – tuỳ bạn dùng sau này) ======
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPayload, setReportPayload] = useState({
    jobId: null,
    findings: "",
    solution: "",
    severity: "light",
  });

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressPayload, setProgressPayload] = useState({ jobId: null, note: "" });

  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishPayload, setFinishPayload] = useState({ jobId: null, actualCost: "" });

  return (
    <View style={styles.container}>
      {/* Week selector */}
      <View style={styles.dateSelector}>
        <ScrollView
          ref={dateListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
          {twoWeekDates.map((d, idx) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <Pressable
                key={idx}
                style={[
                  styles.dateItem,
                  isSelected && styles.dateItemSelected,
                  isToday && !isSelected && styles.dateItemToday,
                ]}
                onPress={() => setSelectedDate(d)}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSel,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {d.toLocaleDateString("vi-VN", { weekday: "short" })}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    isSelected && styles.dayTextSel,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lịch ngày {formatViDate(selectedDate)}</Text>
        <Text style={styles.subTitle}>{totalToday} công việc</Text>
      </View>

      {/* Danh sách slot của ngày */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={[styles.card, { borderColor: colors.danger, borderWidth: 1 }]}>
            <Text style={{ color: colors.danger, fontWeight: "700" }}>
              Lỗi tải dữ liệu: {String(error)}
            </Text>
          </View>
        ) : null}

        {slotsToday.map((slot, idx) => {
          const tws = dotnetArr(slot?.technicianWorkSlots); // mảng các technicianWorkSlot
          return (
            <View key={`${slot.slotId}-${idx}`} style={styles.card}>
              {/* Slot header */}
              <View style={styles.rowTop}>
                <View style={styles.timeCol}>
                  <Icon name="clock" size={16} color={colors.textSecondary} />
                  <Text style={styles.timeText}>Ca #{slot?.slotId}</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: "#8E8E93" }]}>
                  <Text style={styles.statusText}>{tws.length} công việc</Text>
                </View>
              </View>

              {/* Hiển thị nguyên xi từng technicianWorkSlot (workSlotId, status, technician...) */}
              {tws.map((w, i2) => {
                const t = w?.technician;
                return (
                  <View
                    key={`${w?.workSlotId ?? i2}`}
                    style={{
                      paddingVertical: 10,
                      borderTopWidth: i2 === 0 ? 0 : 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text style={{ fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                      workSlotId: {String(w?.workSlotId ?? "")}
                    </Text>
                    <Text style={{ color: colors.textSecondary, marginBottom: 6 }}>
                      status: <Text style={{ color: colors.text }}>{String(w?.status ?? "")}</Text>
                    </Text>

                    {/* block technician */}
                    <View style={{ backgroundColor: "#F8FAFF", borderRadius: 10, padding: 10 }}>
                      <Text style={{ fontWeight: "700", color: colors.text, marginBottom: 4 }}>
                        technician:
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        userId: <Text style={{ color: colors.text }}>{String(t?.userId ?? "")}</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        firstName:{" "}
                        <Text style={{ color: colors.text }}>{String(t?.firstName ?? "")}</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        lastName:{" "}
                        <Text style={{ color: colors.text }}>{String(t?.lastName ?? "")}</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        phoneNumber:{" "}
                        <Text style={{ color: colors.text }}>{String(t?.phoneNumber ?? "")}</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        email: <Text style={{ color: colors.text }}>{String(t?.email ?? "")}</Text>
                      </Text>
                      <Text style={{ color: colors.textSecondary }}>
                        status: <Text style={{ color: colors.text }}>{String(t?.status ?? "")}</Text>
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ===== Modals cũ giữ lại (tuỳ bạn dùng) ===== */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Tạo báo cáo khảo sát</Text>

            <Text style={styles.label}>Mức độ</Text>
            <View style={styles.rowSeg}>
              {[
                { k: "light", label: "Nhẹ" },
                { k: "heavy", label: "Nặng (Cần nhà thầu)" },
              ].map((opt) => (
                <Pressable
                  key={opt.k}
                  onPress={() => setReportPayload((p) => ({ ...p, severity: opt.k }))}
                  style={[
                    styles.segBtn,
                    reportPayload.severity === opt.k && styles.segBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.segTxt,
                      reportPayload.severity === opt.k && styles.segTxtActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Nhận định</Text>
            <TextInput
              placeholder="Mô tả kết quả khảo sát…"
              value={reportPayload.findings}
              onChangeText={(t) => setReportPayload((p) => ({ ...p, findings: t }))}
              style={styles.inputMulti}
              multiline
            />

            <Text style={styles.label}>Đề xuất phương án</Text>
            <TextInput
              placeholder="Giải pháp/đề xuất xử lý…"
              value={reportPayload.solution}
              onChangeText={(t) => setReportPayload((p) => ({ ...p, solution: t }))}
              style={styles.inputMulti}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.mBtn, styles.mGhost]}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={[styles.mBtnTxt, { color: colors.textSecondary }]}>Huỷ</Text>
              </Pressable>
              <Pressable style={[styles.mBtn, styles.mPrimary]} onPress={() => null}>
                <Text style={[styles.mBtnTxt, { color: "#fff" }]}>Lưu báo cáo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showProgressModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProgressModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cập nhật tiến độ</Text>
            <TextInput
              placeholder="Nhập ghi chú tiến độ…"
              value={progressPayload.note}
              onChangeText={(t) => setProgressPayload((p) => ({ ...p, note: t }))}
              style={styles.inputMulti}
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.mBtn, styles.mGhost]}
                onPress={() => setShowProgressModal(false)}
              >
                <Text style={[styles.mBtnTxt, { color: colors.textSecondary }]}>Huỷ</Text>
              </Pressable>
              <Pressable style={[styles.mBtn, styles.mPrimary]} onPress={() => null}>
                <Text style={[styles.mBtnTxt, { color: "#fff" }]}>Cập nhật</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFinishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Kết thúc sửa chữa</Text>
            <Text style={styles.label}>Chi phí thực tế (VND)</Text>
            <TextInput
              placeholder="VD: 350000"
              keyboardType="numeric"
              value={finishPayload.actualCost}
              onChangeText={(t) => setFinishPayload((p) => ({ ...p, actualCost: t }))}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.mBtn, styles.mGhost]}
                onPress={() => setShowFinishModal(false)}
              >
                <Text style={[styles.mBtnTxt, { color: colors.textSecondary }]}>Huỷ</Text>
              </Pressable>
              <Pressable style={[styles.mBtn, styles.mPrimary]} onPress={() => null}>
                <Text style={[styles.mBtnTxt, { color: "#fff" }]}>Xác nhận</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  dateSelector: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateScroll: { paddingHorizontal: 16, gap: 10 },
  dateItem: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 60,
    backgroundColor: "#F4F6F8",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateItemSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateItemToday: { borderColor: colors.primary, borderWidth: 2 },
  dayText: { fontSize: 12, color: colors.textSecondary, marginBottom: 2, fontWeight: "500" },
  dayTextSel: { color: "#fff" },
  dayTextToday: { color: colors.primary },
  dateNum: { fontSize: 16, fontWeight: "700", color: colors.text },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 2 },
  subTitle: { fontSize: 13, color: colors.textSecondary },

  list: { flex: 1, padding: 16 },

  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  timeCol: { flexDirection: "row", alignItems: "center", gap: 6 },
  timeText: { fontSize: 13, color: colors.textSecondary },

  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusText: { fontSize: 11, color: "#fff", fontWeight: "700" },

  rowMid: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },

  rowMeta: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 8, flexWrap: "wrap" },

  titleText: { fontSize: 14, color: "#333", marginBottom: 10, lineHeight: 18 },

  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "flex-end" },
  btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  btnPrimary: { backgroundColor: colors.primary },
  btnSecondary: { backgroundColor: "#EAF3FF", borderWidth: 1, borderColor: "#CFE3FF" },
  btnText: { fontSize: 13, fontWeight: "700" },
  btnPrimaryText: { color: "#fff" },
  btnSecondaryText: { color: colors.primary },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 6 },
  linkText: { fontSize: 14, color: colors.primary, fontWeight: "600" },

  // ===== Modal =====
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: { width: "100%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 14, padding: 14 },
  modalTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 10, color: colors.text },
  label: { fontSize: 13, fontWeight: "700", color: colors.text, marginTop: 8, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  inputMulti: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 90,
  },
  rowSeg: { flexDirection: "row", gap: 8 },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F4F6F8",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  segBtnActive: { backgroundColor: "#E7F0FF", borderColor: colors.primary },
  segTxt: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  segTxtActive: { color: colors.primary },

  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 },
  mBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  mGhost: { backgroundColor: "#F4F6F8" },
  mPrimary: { backgroundColor: colors.primary },
  mBtnTxt: { fontSize: 15, fontWeight: "700" },
});
