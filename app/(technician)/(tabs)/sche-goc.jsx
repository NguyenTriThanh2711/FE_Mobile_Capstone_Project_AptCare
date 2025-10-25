// import React, { useMemo, useState } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Pressable,
//   Alert,
//   Modal,
//   TextInput,
// } from "react-native";
// import { Icon } from "@/src/components/Icon.native";
// import { router } from "expo-router";
// const colors = {
//   primary: "#007AFF",
//   success: "#34C759",
//   warning: "#FF9500",
//   danger: "#FF3B30",
//   text: "#1a1a1a",
//   textSecondary: "#666",
//   bg: "#f8f9fa",
//   white: "#fff",
//   border: "#e5e5e5",
// };

// function formatViDate(d) {
//   return d.toLocaleDateString("vi-VN", {
//     weekday: "long",
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   });
// }

// function getPriorityColor(priority) {
//   switch (priority) {
//     case "urgent":
//       return colors.danger;
//     case "high":
//       return "#F57C00";
//     case "medium":
//       return colors.primary;
//     default:
//       return "#34C759";
//   }
// }

// function getStatusChip(job) {
//   switch (job.status) {
//     case "scheduled":
//       return { label: "Đã xếp lịch", bg: "#8E8E93" };
//     case "in_progress":
//       return { label: "Đang thực hiện", bg: colors.primary };
//     case "awaiting_approval":
//       return { label: "Chờ duyệt", bg: colors.warning };
//     case "awaiting_contractor":
//       return { label: "Chờ nhà thầu", bg: colors.warning };
//     case "awaiting_payment":
//       return { label: "Chờ thanh toán", bg: "#FB8C00" };
//     case "completed":
//       return { label: "Hoàn tất", bg: colors.success };
//     case "cancelled":
//       return { label: "Đã huỷ", bg: "#9E9E9E" };
//     default:
//       return { label: job.status, bg: "#9E9E9E" };
//   }
// }

// // Tính actions theo loại + trạng thái
// function getAvailableActions(job) {
//   const actions = [];
//   if (job.status === "scheduled") {
//     actions.push({ key: "start", label: "Bắt đầu", icon: "play.fill", kind: "primary" });
//   }
//   if (job.status === "in_progress") {
//     if (job.type === "inspection") {
//       actions.push({ key: "report", label: "Tạo báo cáo", icon: "doc.text", kind: "primary" });
//     } else {
//       actions.push({ key: "progress", label: "Tiến độ", icon: "pencil", kind: "secondary" });
//       actions.push({ key: "photos", label: "Ảnh", icon: "photo.on.rectangle", kind: "secondary" });
//       actions.push({ key: "finishRepair", label: "Kết thúc", icon: "checkmark", kind: "primary" });
//     }
//   }
//   if (job.status === "awaiting_payment") {
//     actions.push({ key: "markPaid", label: "Đã thanh toán", icon: "creditcard", kind: "primary" });
//   }
//   // Luôn có Xem chi tiết (nếu muốn)
//   actions.push({ key: "details", label: "Chi tiết", icon: "info.circle", kind: "link" });
//   return actions;
// }

// export default function TechnicianSchedule() {
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [jobs, setJobs] = useState(() => {
//     const todayISO = new Date().toISOString();
//     return [
//       {
//         id: "J1",
//         type: "inspection", // inspection | repair
//         startTime: todayISO,
//         durationMins: 60,
//         apartmentId: "A-204",
//         floor: "2",
//         contact: { name: "Anh Huy", phone: "0901234567" },
//         title: "Khảo sát rò rỉ nước",
//         priority: "high", // low|medium|high|urgent
//         status: "scheduled",
//         inspection: {},
//         events: [{ id: "e1", type: "scheduled", at: todayISO, by: "system" }],
//       },
//       {
//         id: "J2",
//         type: "repair",
//         startTime: todayISO,
//         apartmentId: "B-105",
//         floor: "1",
//         contact: { name: "Chị Lan", phone: "0912345678" },
//         title: "Sửa điều hoà",
//         priority: "urgent",
//         status: "in_progress",
//         repair: { steps: [], progressNotes: [], photos: [] },
//         events: [{ id: "e1", type: "started", at: todayISO, by: "KT01" }],
//       },
//       {
//         id: "J3",
//         type: "repair",
//         startTime: todayISO,
//         apartmentId: "C-301",
//         floor: "3",
//         contact: { name: "Anh Minh", phone: "0987654321" },
//         title: "Sửa ổ cắm",
//         priority: "medium",
//         status: "scheduled",
//         repair: { steps: [], progressNotes: [], photos: [] },
//         events: [{ id: "e1", type: "scheduled", at: todayISO, by: "system" }],
//       },
//     ];
//   });

//   // ====== Modal states ======
//   const [showReportModal, setShowReportModal] = useState(false);
//   const [reportPayload, setReportPayload] = useState({
//     jobId: null,
//     findings: "",
//     solution: "",
//     severity: "light", // light | heavy
//   });

//   const [showProgressModal, setShowProgressModal] = useState(false);
//   const [progressPayload, setProgressPayload] = useState({ jobId: null, note: "" });

//   const [showFinishModal, setShowFinishModal] = useState(false);
//   const [finishPayload, setFinishPayload] = useState({ jobId: null, actualCost: "" });

//   // ====== Helpers mutation ======
//   const patchJob = (jobId, updater) => {
//     setJobs((prev) => prev.map((j) => (j.id === jobId ? updater({ ...j }) : j)));
//   };
//   const pushEvent = (job, type, meta = {}) => {
//     const at = new Date().toISOString();
//     const e = { id: `ev-${Date.now()}`, type, at, by: "KT01", meta };
//     job.events = [...(job.events || []), e];
//   };

//   // ====== Action handlers ======
//   const handleAction = (job, actionKey) => {
//     switch (actionKey) {
//       case "start": {
//         patchJob(job.id, (j) => {
//           j.status = "in_progress";
//           pushEvent(j, "started");
//           return j;
//         });
//         return;
//       }
//       case "report": {
//         setReportPayload({
//           jobId: job.id,
//           findings: "",
//           solution: "",
//           severity: "light",
//         });
//         setShowReportModal(true);
//         return;
//       }
//       case "progress": {
//         setProgressPayload({ jobId: job.id, note: "" });
//         setShowProgressModal(true);
//         return;
//       }
//       case "photos": {
//         Alert.alert("Ảnh", "Tính năng tải ảnh sẽ tích hợp sau (MediaPicker).");
//         // Sau này: mở MediaPicker, nhận files -> patch repair.photos + pushEvent photo_uploaded
//         return;
//       }
//       case "finishRepair": {
//         setFinishPayload({ jobId: job.id, actualCost: "" });
//         setShowFinishModal(true);
//         return;
//       }
//       case "markPaid": {
//         patchJob(job.id, (j) => {
//           j.status = "completed";
//           j.payment = { ...(j.payment || {}), status: "paid" };
//           pushEvent(j, "completed");
//           return j;
//         });
//         return;
//       }
//       case "details": {
//           const path =
//             job.type === "inspection"
//               ? `/appointment/${1}`
//               : `/appointment/${1}`;
//           router.push(path);
//         return;
//       }
//     }
//   };

//   // ====== Submit modals ======
//   const submitReport = () => {
//     const { jobId, findings, solution, severity } = reportPayload;
//     if (!findings.trim()) return Alert.alert("Thiếu", "Nhập nhận định (findings).");

//     patchJob(jobId, (j) => {
//       if (!j.inspection) j.inspection = {};
//       j.inspection.findings = findings;
//       j.inspection.solutionProposal = solution;
//       j.inspection.severity = severity;

//       pushEvent(j, "inspection_report_created", { findings });
//       pushEvent(j, "solution_proposed", { solution });

//       if (severity === "heavy") {
//         j.inspection.escalateToContractor = true;
//         j.status = "awaiting_approval";
//         pushEvent(j, "escalated_to_contractor");
//       } else {
//         // Nhẹ: tuỳ chọn — ở đây giữ nguyên in_progress để có thể tiếp tục,
//         // hoặc bạn có thể cho “Hoàn tất inspection” luôn.
//         j.status = "completed";
//         pushEvent(j, "completed");
//       }
//       return j;
//     });

//     setShowReportModal(false);
//   };

//   const submitProgress = () => {
//     const { jobId, note } = progressPayload;
//     if (!note.trim()) return Alert.alert("Thiếu", "Nhập ghi chú tiến độ.");
//     patchJob(jobId, (j) => {
//       if (!j.repair) j.repair = { steps: [], progressNotes: [], photos: [] };
//       j.repair.progressNotes = [...(j.repair.progressNotes || []), note];
//       pushEvent(j, "repair_progress_updated", { note });
//       return j;
//     });
//     setShowProgressModal(false);
//   };

//   const submitFinish = () => {
//     const { jobId, actualCost } = finishPayload;
//     const n = Number(actualCost);
//     if (Number.isNaN(n)) return Alert.alert("Sai định dạng", "Chi phí phải là số.");
//     patchJob(jobId, (j) => {
//       j.status = "awaiting_payment";
//       j.payment = { ...(j.payment || {}), actual: n, status: "awaiting" };
//       pushEvent(j, "awaiting_payment", { actual: n });
//       return j;
//     });
//     setShowFinishModal(false);
//   };

//   // ====== Week dates ======
//   const weekDates = useMemo(() => {
//     const today = new Date();
//     const start = new Date(today);
//     // Bắt đầu từ Chủ nhật
//     start.setDate(today.getDate() - today.getDay());
//     return Array.from({ length: 7 }, (_, i) => {
//       const d = new Date(start);
//       d.setDate(start.getDate() + i);
//       return d;
//     });
//   }, []);

//   // Lọc jobs theo ngày (demo: tất cả là hôm nay)
//   const jobsToday = jobs; // tuỳ dữ liệu thật lọc theo selectedDate

//   return (
//     <View style={styles.container}>
//       {/* Week selector */}
//       <View style={styles.dateSelector}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
//           {weekDates.map((d, idx) => {
//             const isSelected = d.toDateString() === selectedDate.toDateString();
//             const isToday = d.toDateString() === new Date().toDateString();
//             return (
//               <Pressable
//                 key={idx}
//                 style={[styles.dateItem, isSelected && styles.dateItemSelected, isToday && !isSelected && styles.dateItemToday]}
//                 onPress={() => setSelectedDate(d)}
//               >
//                 <Text style={[styles.dayText, isSelected && styles.dayTextSel, isToday && !isSelected && styles.dayTextToday]}>
//                   {d.toLocaleDateString("vi-VN", { weekday: "short" })}
//                 </Text>
//                 <Text style={[styles.dateNum, isSelected && styles.dayTextSel, isToday && !isSelected && styles.dayTextToday]}>
//                   {d.getDate()}
//                 </Text>
//               </Pressable>
//             );
//           })}
//         </ScrollView>
//       </View>

//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.title}>Lịch ngày {formatViDate(selectedDate)}</Text>
//         <Text style={styles.subTitle}>{jobsToday.length} công việc</Text>
//       </View>

//       {/* List */}
//       <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
//         {jobsToday.map((job) => {
//           const chip = getStatusChip(job);
//           return (
//             <View key={job.id} style={styles.card}>
//               {/* Thời gian & trạng thái */}
//               <View style={styles.rowTop}>
//                 <View style={styles.timeCol}>
//                   <Icon name="clock" size={16} color={colors.textSecondary} />
//                   <Text style={styles.timeText}>
//                     {new Date(job.startTime).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} 
//                   </Text>
//                 </View>
//                 <View style={[styles.statusChip, { backgroundColor: chip.bg }]}>
//                   <Text style={styles.statusText}>{chip.label}</Text>
//                 </View>
//               </View>

//               {/* Info */}
//               <View style={styles.rowMid}>
//                 <Text style={styles.apartment}>{job.apartmentId}</Text>
//                 <View style={[styles.priorityPill, { backgroundColor: getPriorityColor(job.priority) }]}>
//                   <Text style={styles.pillText}>
//                     {job.priority === "urgent" ? "Khẩn cấp" : job.priority === "high" ? "Cao" : job.priority === "medium" ? "Trung bình" : "Thấp"}
//                   </Text>
//                 </View>
//                 <View style={[styles.typePill, job.type === "inspection" ? styles.inspect : styles.repair]}>
//                   <Text style={styles.typeText}>{job.type === "inspection" ? "Khảo sát" : "Sửa chữa"}</Text>
//                 </View>
//               </View>

//               {/* Liên hệ & địa điểm */}
//               <View style={styles.rowMeta}>
//                 <View style={styles.metaItem}>
//                   <Icon name="building.2" size={14} color={colors.textSecondary} />
//                   <Text style={styles.metaTxt}>Lầu: <Text style={styles.metaStrong}>{job.floor}</Text></Text>
//                 </View>
//                 <View style={styles.metaItem}>
//                   <Icon name="door.left.hand.closed" size={14} color={colors.textSecondary} />
//                   <Text style={styles.metaTxt}>Phòng: <Text style={styles.metaStrong}>{job.apartmentId}</Text></Text>
//                 </View>
//                 <View style={styles.metaItem}>
//                   <Icon name="phone" size={14} color={colors.primary} />
//                   <Text style={[styles.metaTxt, styles.metaStrong]}>{job.contact?.phone}</Text>
//                 </View>
//               </View>

//               {/* Mô tả ngắn */}
//               <Text style={styles.titleText}>{job.title}</Text>

//               {/* Actions */}
//               <View style={styles.actions}>
//                 {getAvailableActions(job).map((a) => {
//                   if (a.kind === "link") {
//                     return (
//                       <Pressable key={a.key} style={styles.linkBtn} onPress={() => handleAction(job, a.key)}>
//                         <Text style={styles.linkText}>{a.label}</Text>
//                         <Icon name="chevron.right" size={16} color={colors.primary} />
//                       </Pressable>
//                     );
//                   }
//                   const btnStyle = a.kind === "primary" ? styles.btnPrimary : styles.btnSecondary;
//                   const txtStyle = a.kind === "primary" ? styles.btnPrimaryText : styles.btnSecondaryText;
//                   return (
//                     <Pressable key={a.key} style={[styles.btn, btnStyle]} onPress={() => handleAction(job, a.key)}>
//                       <Icon name={a.icon} size={16} color={a.kind === "primary" ? "#fff" : colors.primary} />
//                       <Text style={[styles.btnText, txtStyle]}>{a.label}</Text>
//                     </Pressable>
//                   );
//                 })}
//               </View>
//             </View>
//           );
//         })}

//         <View style={{ height: 24 }} />
//       </ScrollView>

//       {/* ===== Modals ===== */}

//       {/* Inspection Report */}
//       <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
//         <View style={styles.modalBackdrop}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>Tạo báo cáo khảo sát</Text>

//             <Text style={styles.label}>Mức độ</Text>
//             <View style={styles.rowSeg}>
//               {[
//                 { k: "light", label: "Nhẹ" },
//                 { k: "heavy", label: "Nặng (Cần nhà thầu)" },
//               ].map((opt) => (
//                 <Pressable
//                   key={opt.k}
//                   onPress={() => setReportPayload((p) => ({ ...p, severity: opt.k }))}
//                   style={[styles.segBtn, reportPayload.severity === opt.k && styles.segBtnActive]}
//                 >
//                   <Text style={[styles.segTxt, reportPayload.severity === opt.k && styles.segTxtActive]}>
//                     {opt.label}
//                   </Text>
//                 </Pressable>
//               ))}
//             </View>

//             <Text style={styles.label}>Nhận định</Text>
//             <TextInput
//               placeholder="Mô tả kết quả khảo sát…"
//               value={reportPayload.findings}
//               onChangeText={(t) => setReportPayload((p) => ({ ...p, findings: t }))}
//               style={styles.inputMulti}
//               multiline
//             />

//             <Text style={styles.label}>Đề xuất phương án</Text>
//             <TextInput
//               placeholder="Giải pháp/đề xuất xử lý…"
//               value={reportPayload.solution}
//               onChangeText={(t) => setReportPayload((p) => ({ ...p, solution: t }))}
//               style={styles.inputMulti}
//               multiline
//             />

//             <View style={styles.modalActions}>
//               <Pressable style={[styles.mBtn, styles.mGhost]} onPress={() => setShowReportModal(false)}>
//                 <Text style={[styles.mBtnTxt, { color: colors.textSecondary }]}>Huỷ</Text>
//               </Pressable>
//               <Pressable style={[styles.mBtn, styles.mPrimary]} onPress={submitReport}>
//                 <Text style={[styles.mBtnTxt, { color: "#fff" }]}>Lưu báo cáo</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Repair Progress */}
//       <Modal visible={showProgressModal} transparent animationType="fade" onRequestClose={() => setShowProgressModal(false)}>
//         <View style={styles.modalBackdrop}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>Cập nhật tiến độ</Text>
//             <TextInput
//               placeholder="Nhập ghi chú tiến độ…"
//               value={progressPayload.note}
//               onChangeText={(t) => setProgressPayload((p) => ({ ...p, note: t }))}
//               style={styles.inputMulti}
//               multiline
//             />
//             <View style={styles.modalActions}>
//               <Pressable style={[styles.mBtn, styles.mGhost]} onPress={() => setShowProgressModal(false)}>
//                 <Text style={[styles.mBtnTxt, { color: colors.textSecondary }]}>Huỷ</Text>
//               </Pressable>
//               <Pressable style={[styles.mBtn, styles.mPrimary]} onPress={submitProgress}>
//                 <Text style={[styles.mBtnTxt, { color: "#fff" }]}>Cập nhật</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       {/* Finish Repair (Cost) */}
//       <Modal visible={showFinishModal} transparent animationType="fade" onRequestClose={() => setShowFinishModal(false)}>
//         <View style={styles.modalBackdrop}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>Kết thúc sửa chữa</Text>
//             <Text style={styles.label}>Chi phí thực tế (VND)</Text>
//             <TextInput
//               placeholder="VD: 350000"
//               keyboardType="numeric"
//               value={finishPayload.actualCost}
//               onChangeText={(t) => setFinishPayload((p) => ({ ...p, actualCost: t }))}
//               style={styles.input}
//             />
//             <View style={styles.modalActions}>
//               <Pressable style={[styles.mBtn, styles.mGhost]} onPress={() => setShowFinishModal(false)}>
//                 <Text style={[styles.mBtnTxt, { color: colors.textSecondary }]}>Huỷ</Text>
//               </Pressable>
//               <Pressable style={[styles.mBtn, styles.mPrimary]} onPress={submitFinish}>
//                 <Text style={[styles.mBtnTxt, { color: "#fff" }]}>Xác nhận</Text>
//               </Pressable>
//             </View>
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// // ============== styles ==============
// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: colors.bg },

//   dateSelector: {
//     backgroundColor: colors.white,
//     paddingVertical: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   dateScroll: { paddingHorizontal: 16, gap: 10 },
//   dateItem: {
//     alignItems: "center",
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     borderRadius: 12,
//     minWidth: 60,
//     backgroundColor: "#F4F6F8",
//     borderWidth: 1,
//     borderColor: colors.border,
//   },
//   dateItemSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
//   dateItemToday: { borderColor: colors.primary, borderWidth: 2 },
//   dayText: { fontSize: 12, color: colors.textSecondary, marginBottom: 2, fontWeight: "500" },
//   dayTextSel: { color: "#fff" },
//   dayTextToday: { color: colors.primary },
//   dateNum: { fontSize: 16, fontWeight: "700", color: colors.text },

//   header: {
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     backgroundColor: colors.white,
//     borderBottomWidth: 1,
//     borderBottomColor: colors.border,
//   },
//   title: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 2 },
//   subTitle: { fontSize: 13, color: colors.textSecondary },

//   list: { flex: 1, padding: 16 },

//   card: {
//     backgroundColor: colors.white,
//     borderRadius: 12,
//     padding: 14,
//     marginBottom: 12,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.08,
//     shadowRadius: 3,
//     elevation: 2,
//   },

//   rowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
//   timeCol: { flexDirection: "row", alignItems: "center", gap: 6 },
//   timeText: { fontSize: 13, color: colors.textSecondary },

//   statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
//   statusText: { fontSize: 11, color: "#fff", fontWeight: "700" },

//   rowMid: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
//   apartment: { fontSize: 15, fontWeight: "700", color: colors.text },
//   priorityPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
//   pillText: { fontSize: 11, color: "#fff", fontWeight: "700" },
//   typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
//   inspect: { backgroundColor: "#E3F2FD" },
//   repair: { backgroundColor: "#FFF3E0" },
//   typeText: { fontSize: 11, color: colors.text, fontWeight: "700" },

//   rowMeta: { flexDirection: "row", gap: 14, alignItems: "center", marginBottom: 8, flexWrap: "wrap" },
//   metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
//   metaTxt: { fontSize: 12, color: colors.textSecondary },
//   metaStrong: { color: colors.text, fontWeight: "700" },

//   titleText: { fontSize: 14, color: "#333", marginBottom: 10, lineHeight: 18 },

//   actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center", justifyContent: "flex-end" },
//   btn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
//   btnPrimary: { backgroundColor: colors.primary },
//   btnSecondary: { backgroundColor: "#EAF3FF", borderWidth: 1, borderColor: "#CFE3FF" },
//   btnText: { fontSize: 13, fontWeight: "700" },
//   btnPrimaryText: { color: "#fff" },
//   btnSecondaryText: { color: colors.primary },
//   linkBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 6 },
//   linkText: { fontSize: 14, color: colors.primary, fontWeight: "600" },

//   // ===== Modal =====
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.35)",
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 18,
//   },
//   modalCard: { width: "100%", maxWidth: 420, backgroundColor: "#fff", borderRadius: 14, padding: 14 },
//   modalTitle: { fontSize: 16, fontWeight: "700", textAlign: "center", marginBottom: 10, color: colors.text },
//   label: { fontSize: 13, fontWeight: "700", color: colors.text, marginTop: 8, marginBottom: 6 },
//   input: {
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 14,
//     color: colors.text,
//   },
//   inputMulti: {
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     fontSize: 14,
//     color: colors.text,
//     minHeight: 90,
//   },
//   rowSeg: { flexDirection: "row", gap: 8 },
//   segBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: "#F4F6F8", borderWidth: 1, borderColor: colors.border, alignItems: "center" },
//   segBtnActive: { backgroundColor: "#E7F0FF", borderColor: colors.primary },
//   segTxt: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
//   segTxtActive: { color: colors.primary },

//   modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 12 },
//   mBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
//   mGhost: { backgroundColor: "#F4F6F8" },
//   mPrimary: { backgroundColor: colors.primary },
//   mBtnTxt: { fontSize: 15, fontWeight: "700" },
// });