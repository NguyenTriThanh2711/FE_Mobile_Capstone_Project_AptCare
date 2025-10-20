import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, Modal } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { router, useLocalSearchParams } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { Icon } from "@/src/components/Icon.native";
import MUITextField from "@/src/components/common/MUITextField";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import WheelDateTimePicker from "@/src/components/common/WheelDateTimePicker"; 
import ImagePickerStrip from "@/src/components/ImagePickerStrip";
import { createEmergencyRepairRequest, createNormalRepairRequest, selectRequestCreateError, selectRequestCreateResult, selectRequestCreating } from "@/src/features/requests/requestsSlice";
import {  fetchIssues, selectIssues, selectIssuesLoading } from "@/src/features/issues/issuesSlice";
import { ScrollView } from "react-native";
import Toast from "react-native-toast-message";
import { dotnetArr } from "@/src/helper/dotnetArr";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "react-native-paper";

const FOOTER_HEIGHT = 64;

export default function RequestCreate() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const priority = "Medium"; 
  const { emergency } = useLocalSearchParams(); 
  const isEmergency = emergency === "true" || emergency === true;
  const theme = useTheme();

  const [openPicker, setOpenPicker] = useState(false);
  const user = useSelector((s) => s.auth.user);
  const [images, setImages] = useState([]);
  console.log('apartments of user', user.apartments.$values)
  // const apartmentId  = user?.apartments?.$values?.[0]?.apartmentId;
  // const defaultFloor = user?.apartments?.$values?.[0]?.floor ?? "";
  // const defaultRoom  = user?.apartments?.$values?.[0]?.roomNumber ?? "";
  const apartments = useMemo(() => dotnetArr(user?.apartments), [user]);
  const firstAptId = apartments?.[0]?.apartmentId ?? null;

  const creating = useSelector(selectRequestCreating);
  const createErr = useSelector(selectRequestCreateError);
  const createRes = useSelector(selectRequestCreateResult);
  
  const issues = useSelector(selectIssues);
  const issuesLoading = useSelector(selectIssuesLoading);


  useEffect(() => {
    dispatch(fetchIssues());
  }, [dispatch]);
  // Form setup
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      apartmentId: firstAptId,
      issueId : null,
      otherIssue: "",
      shortSummary: "",
      description: "",
      preferredAt: new Date().toISOString(),
    },
  });
  const selectedApartmentId = watch("apartmentId");
  const selectedApartment = useMemo(
    () => apartments.find((apt) => apt.apartmentId === selectedApartmentId),
    [apartments, selectedApartmentId]
  );
  const defaultFloor = selectedApartment?.floor ?? "";
  const defaultRoom = selectedApartment?.roomNumber ?? "";

  const issueId = watch("issueId");
  const preferredAtISO = watch("preferredAt");
  const [openIssuePicker, setOpenIssuePicker] = useState(false);
  const [openAptPicker, setOpenAptPicker] = useState(false);

  const currentIssueLabel =
    issueId == null
      ? (issues?.length ? "Khác" : "Chọn vấn đề")
      : (issues.find((i) => i.issueId === issueId)?.name || "Chọn vấn đề");

  const onSubmit = async (values) => {
    try {
      
      if ( !values.shortSummary) {
        Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Chọn danh mục và mô tả ngắn.' });
        return;
      }
      if (!values.apartmentId) {
        Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Vui lòng chọn căn hộ.' });
        return;
      }
      if (isEmergency !== true && !values.issueId) {
        Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Khẩn cấp yêu cầu chọn Vấn đề.' });
        return;
      }
    if (isEmergency) {
      const payload = {
        ApartmentId: values.apartmentId ?? firstAptId,
        IssueId: values.issueId,              
        Object: values.shortSummary?.trim(),
        Description: values.description?.trim() || "",
        Files: images,
      };
      console.log("Submitting emergency maintenance request:", payload);
      await dispatch(createEmergencyRepairRequest(payload)).unwrap();
    } else {
      const payload = {
        ApartmentId: values.apartmentId ?? firstAptId,
        IssueId: values.issueId ?? null,               // null => không append trong thunk
        Object: values.shortSummary?.trim(),
        Description: values.description?.trim() || "",
        PreferredAppointment: values.preferredAt, //normal
        Files: images,
      };
      console.log("Submitting maintenance request:", payload);
      await dispatch(createNormalRepairRequest(payload)).unwrap();
    }
    Toast.show({ type: 'success', text1: 'Thành công', text2: 'Yêu cầu đã được gửi.' });
    router.back();
  } catch (e) {
    Toast.show({ type: 'error', text1: 'Gửi thất bại', text2: e?.message || 'Vui lòng thử lại.' });
    console.log('Error in onSubmit:', e);
  }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      {isEmergency ? (
        <LinearGradient
          colors={["#ef4444", "#f59e0b"]} // đỏ → vàng
          start={{ x : 0, y: 0}}
          end={{ x: 1, y: 0 } }
          style={[styles.header, { paddingTop: insets.top + 6 }]}
        >
         
          <Pressable onPress={() => router.back()} style={styles.headerLeft} hitSlop={8}>
            <Icon name="chevron.left" size={24} color="#1a1a1a" />
            <Text style={styles.headerBack}>Quay lại</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: "#fff" }]}>
            Tạo yêu cầu sửa chữa khẩn cấp
          </Text>
          <View style={{ width: 72 }} /> 
        </LinearGradient>
      ) : (
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft} hitSlop={8}>
            <Icon name="chevron.left" size={24} color="#1a1a1a" />
            <Text style={styles.headerBack}>Quay lại</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{ "Tạo yêu cầu sửa chữa"}</Text>
        <View style={{ width: 72 }} />
      </View>
      )}
      {isEmergency && (
        <View style={styles.emergencyNoteWrap}>
          <Icon name="exclamationmark.triangle.fill" size={16} color="#b45309" />
          <Text style={styles.emergencyNoteText}>
            Chỉ chọn “Khẩn cấp” khi tình huống có nguy cơ mất an toàn (rò rỉ điện, nước tràn, cháy, mùi khét...). 
            Kỹ thuật sẽ được điều phối sớm nhất có thể.
          </Text>
        </View>
      )}
      {/* Form */}
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT + insets.bottom + 25 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={80}
        extraHeight={80}
      >
        {/* Thông tin căn hộ */}
        <Text style={styles.sectionTitle}>Thông tin căn hộ</Text>
        <View style={{ gap: 12 }}>
          <Text style={styles.fieldLabel}>Căn hộ *</Text>
          <Pressable onPress={() => setOpenAptPicker(true)} style={styles.selectBox}>
            {selectedApartment ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                {/* icon tầng */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="building.2" size={16} color="#6b7280" />
                  <Text style={{ fontSize: 14, color: "#111827" }}>Tầng {selectedApartment.floor}</Text>
                </View>
                <View style={{ width: 1, height: 16, backgroundColor: '#E5E7EB' }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon name="door.left.hand.closed.fill" size={16} color="#6b7280" />
                  <Text style={{ fontSize: 14, color: "#111827" }}>Phòng {selectedApartment.roomNumber}</Text>
                </View>
              </View>
            ) :(
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Icon name="building.2" size={16} color="#6b7280" />
                <Text style={{ fontSize: 14, color: "#6b7280" }}>Chọn căn hộ</Text>
              </View>
            )}
            <Icon name="chevron.down" size={18} color="#6b7280" />
          </Pressable>
        </View>
        <Modal visible={openAptPicker} transparent animationType="fade" onRequestClose={() => setOpenAptPicker(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "700" }}>Chọn căn hộ</Text>
              </View>
              <ScrollView style={{ paddingHorizontal: 6 }}>
                {apartments.map((apt) => {
                  const active =selectedApartmentId === apt.apartmentId;
                  return (
                    <Pressable
                      key={apt.apartmentId}
                      onPress={() => {
                        setValue("apartmentId", apt.apartmentId, { shouldDirty: true });
                        setOpenAptPicker(false);
                      }}
                      style={[styles.optionItem, active && styles.optionItemActive]}
                    >
                      <Text style={[styles.optionText,active && styles.optionTextActive]}>
                        {`Tầng ${apt.floor} - Phòng ${apt.roomNumber}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Chi tiết yêu cầu */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Chi tiết yêu cầu</Text>

        <Text style={styles.fieldLabel}>Vấn đề *</Text>
        <Pressable
          onPress={() => setOpenIssuePicker(true)}
          style={[styles.selectBox, { marginBottom: 12 ,borderColor: "#373C37", borderRadius: 8 ,paddingHorizontal: 15, paddingVertical: 15 ,backgroundColor: theme.colors.surface }]}
        >
          <Text style={styles.selectText}>
            {currentIssueLabel}
          </Text>
          <Icon name="chevron.down" size={18} color="#6b7280" />
        </Pressable>

        <Modal visible={openIssuePicker} transparent animationType="fade" onRequestClose={() => setOpenIssuePicker(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: "700" }}>Chọn vấn đề</Text>
                {issuesLoading ? (
                  <Text style={{ color: "#6b7280", marginTop: 6 }}>Đang tải danh sách...</Text>
                ) : null}
              </View>

              <ScrollView style={{ paddingHorizontal: 6 }}>
                {issues.map((it) => (
                  <Pressable
                    key={it.issueId}
                    onPress={() => {
                      setValue("issueId", it.issueId, { shouldDirty: true });
                      setOpenIssuePicker(false);
                    }}
                    style={[ styles.optionItem, issueId === it.issueId && styles.optionItemActive]}
                  >
                    <Text style={[styles.optionText, issueId === it.issueId && styles.optionTextActive]}>
                      {it.name}
                    </Text>
                  </Pressable>
                ))}

                {/* KHÁC */}
                <Pressable
                  onPress={() => {
                    setValue("issueId", null, { shouldDirty: true });
                    setOpenIssuePicker(false);
                  }}
                  style={[styles.optionItem, issueId == null && styles.optionItemActive, { marginBottom: 8 }]}
                >
                  <Text style={[styles.optionText, issueId == null && styles.optionTextActive]}>
                    Khác
                  </Text>
                </Pressable>
              </ScrollView>

              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 10, padding: 10 }}>
                <Pressable
                  onPress={() => setOpenIssuePicker(false)}
                  style={styles.mGhost}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#6b7280" }}>Đóng</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        

        {/* Mô tả ngắn gọn */}
        <Controller
          control={control}
          name="shortSummary"
          rules={{ required: "Vui lòng nhập mô tả ngắn gọn" }}
          render={({ field: { onChange, onBlur, value } }) => (
            <MUITextField
              label="Mô tả ngắn gọn vấn đề *"
              placeholder="VD: Rò rỉ vòi nước bếp, ổ cắm phòng ngủ chập..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              variant="outlined"
              startIcon="note-text-outline"
              error={!!errors.shortSummary}
              helperText={errors.shortSummary?.message}
              style={{ marginBottom: 12 }}
            />
          )}
        />

        {/* Mô tả chi tiết */}
        <Controller
          control={control}
          name="description"
          rules={{ required: "Vui lòng nhập mô tả chi tiết" }}
          render={({ field: { onChange, onBlur, value } }) => (
            <MUITextField
              label="Mô tả chi tiết"
              placeholder="Mô tả rõ triệu chứng, thời điểm xuất hiện, đã thử khắc phục gì..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              variant="outlined"
              multiline
              numberOfLines={4}
              startIcon="text-box-outline"
              error={!!errors.description}
              helperText={errors.description?.message}
              style={{ marginBottom: 12 }}
            />
          )}
        />
        <ImagePickerStrip
         value={images}
         onChange={setImages}
         maxCount={10}
         title="Ảnh đính kèm"
        />
        {/* Thời gian phù hợp – ẨN khi Urgent */}
        {isEmergency !== true ? (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Thời gian phù hợp để kỹ thuật viên đến</Text>

          <Pressable style={styles.timeDisplay} onPress={() => setOpenPicker(true)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.timeLabel}>Thời gian mong muốn</Text>
              <Text style={styles.timeValue}>
                {new Date(preferredAtISO).toLocaleString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </Text>
            </View>
            <Text style={styles.timeChoose}>Chọn</Text>
          </Pressable>

          <WheelDateTimePicker
            visible={openPicker}
            onClose={() => setOpenPicker(false)}
            onConfirm={(date) => setValue("preferredAt", date.toISOString(), { shouldDirty: true })}
            initialDate={new Date(preferredAtISO)}
            daysAhead={45}
            locale="vi-VN"
            title="Chọn ngày & giờ"
            cancelText="Huỷ"
            confirmText="Xong"
          />
        </View>
      ) : (
        <View style={[styles.card, styles.urgentBox]}>
          <Text style={styles.urgentText}>
            Yêu cầu khẩn cấp — điều phối kỹ thuật viên sớm nhất có thể ('Không thể chọn thời gian mong muốn').
          </Text>
        </View>
      )}
      </KeyboardAwareScrollView>

      {/* Footer cố định */}
      <View style={[styles.footer, { height: FOOTER_HEIGHT + insets.bottom }]}>
        <Pressable
          disabled={isSubmitting || creating}
          onPress={handleSubmit(onSubmit)}
          style={[styles.submitBtn, (isSubmitting || creating) && { backgroundColor: "#cfd8dc" }]}
        >
          <Text style={styles.submitText}>{(isSubmitting || creating) ? "Đang gửi..." : "Gửi yêu cầu"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6, width: 92 },
  headerBack: { fontSize: 16, color: "#1a1a1a" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },

  emergencyNoteWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#FEF3C7",
    borderBottomWidth: 1,
    borderBottomColor: "#FDE68A",
  },
  emergencyNoteText: { flex: 1, color: "#B45309", fontSize: 13, lineHeight: 18 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },

  chip: { backgroundColor: "#f0f0f0", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  chipSelected: { backgroundColor: "#1e88e5" },
  chipText: { fontSize: 14, color: "#666", fontWeight: "500" },
  chipTextSelected: { color: "white" },

  card: { marginTop: 8 },

  timeDisplay: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  timeLabel: { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  timeValue: { fontSize: 16, color: "#111827", fontWeight: "600" },
  timeChoose: { color: "#1e88e5", fontWeight: "700" },

  urgentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  urgentText: { color: "#B45309", fontSize: 13, flex: 1 },

  footer: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  submitBtn: { backgroundColor: "#1e88e5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  submitText: { color: "white", fontWeight: "700", fontSize: 16 },
  selectText: { fontSize: 16, color: "#111827" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 18 },
  modalCard: { backgroundColor: "#fff", borderRadius: 14, paddingVertical: 10, maxHeight: "70%" },
  optionItem: { paddingVertical: 12, paddingHorizontal: 10, marginHorizontal: 10, borderRadius: 10 },
  optionItemActive: { backgroundColor: "#E7F0FF" },
  optionText: { fontSize: 15, color: "#111827", fontWeight: "500" },
  optionTextActive: { fontWeight: "700" },
  mGhost: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: "#F4F6F8" },


  selectBox: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 12,
  paddingVertical: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  backgroundColor: '#fff',
},
});
