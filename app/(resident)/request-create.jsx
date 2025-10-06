import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useSelector } from "react-redux";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { Icon } from "@/src/components/Icon.native";
import MUITextField from "@/src/components/common/MUITextField";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import WheelDateTimePicker from "@/src/components/common/WheelDateTimePicker"; // <- mới

const CATEGORIES = ["Plumbing", "Electrical", "HVAC", "Appliances", "General Maintenance", "Other"];
const PRIORITIES = ["Medium", "Urgent"];
const FOOTER_HEIGHT = 64;

const fmtVi = (iso) => {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
};

export default function RequestCreate() {
  const [openPicker, setOpenPicker] = useState(false);
  const user = useSelector((s) => s.auth.user);
  const defaultFloor = user?.Apartment?.Floor ?? "";
  const defaultRoom  = user?.Apartment?.ApartmentName ?? "";
  const defaultName  = user?.FullName ?? "";
  const defaultPhone = user?.Phone ?? "";

  const insets = useSafeAreaInsets();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onTouched",
    defaultValues: {
      floor: String(defaultFloor),
      roomName: String(defaultRoom),
      residentName: defaultName,
      residentPhone: defaultPhone,
      category: "",
      priority: "Medium",
      shortSummary: "",
      description: "",
      preferredAt: new Date().toISOString(),
    },
  });

  const category = watch("category");
  const priority = watch("priority");
  const preferredAtISO = watch("preferredAt");

  const onSubmit = async (values) => {
    if (!values.category || !values.shortSummary) {
      Alert.alert("Thiếu thông tin", "Vui lòng chọn danh mục và nhập mô tả ngắn gọn.");
      return;
    }
    const preferredAt = values.priority === "Urgent" ? undefined : values.preferredAt;

    const payload = {
      apartment: { floor: values.floor, roomName: values.roomName },
      resident:  { name: values.residentName, phone: values.residentPhone },
      request: {
        category: values.category,
        priority: values.priority,
        shortSummary: values.shortSummary,
        description: values.description,
        preferredAt,
      },
    };
    console.log("Submitting maintenance request:", payload);
    Alert.alert("Đã gửi yêu cầu", "Bộ phận kỹ thuật sẽ liên hệ bạn sớm.");
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerLeft} hitSlop={8}>
          <Icon name="chevron.left" size={24} color="#1a1a1a" />
          <Text style={styles.headerBack}>Quay lại</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Tạo yêu cầu sửa chữa</Text>
        <View style={{ width: 72 }} />
      </View>

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
          <Controller name="floor" control={control} render={({ field: { value } }) =>
            <MUITextField label="Tầng" value={value} variant="outlined" startIcon="office-building" disabled />
          }/>
          <Controller name="roomName" control={control} render={({ field: { value } }) =>
            <MUITextField label="Tên phòng" value={value} variant="outlined" startIcon="door" disabled />
          }/>
        </View>

        {/* Thông tin cư dân */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Thông tin cư dân</Text>
        <View style={{ gap: 12 }}>
          <Controller name="residentName" control={control} render={({ field: { value } }) =>
            <MUITextField label="Họ và tên" value={value} variant="outlined" startIcon="account-outline" disabled />
          }/>
          <Controller name="residentPhone" control={control} render={({ field: { value } }) =>
            <MUITextField label="Số điện thoại" value={value} variant="outlined" keyboardType="phone-pad" startIcon="phone-outline" disabled />
          }/>
        </View>

        {/* Chi tiết yêu cầu */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Chi tiết yêu cầu</Text>

        {/* Danh mục */}
        <Text style={styles.fieldLabel}>Danh mục *</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, marginBottom: 8 }}>
          {CATEGORIES.map((c) => (
            <Pressable
              key={c}
              onPress={() => setValue("category", c, { shouldDirty: true })}
              style={[styles.chip, category === c && styles.chipSelected]}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextSelected]}>{c}</Text>
            </Pressable>
          ))}
        </View>

        {/* Mức độ ưu tiên */}
        <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Mức độ ưu tiên</Text>
        <View style={{ flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 8 }}>
          {PRIORITIES.map((p) => (
            <Pressable
              key={p}
              onPress={() => setValue("priority", p, { shouldDirty: true })}
              style={[styles.priorityBtn, watch("priority") === p && styles.priorityBtnSelected]}
            >
              <Text style={[styles.priorityText, watch("priority") === p && styles.priorityTextSelected]}>{p}</Text>
            </Pressable>
          ))}
        </View>

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
              style={{ marginBottom: 12 }}
            />
          )}
        />

        {/* Thời gian phù hợp – ẨN khi Urgent */}
        {priority !== "Urgent" ? (
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
            Yêu cầu khẩn cấp — điều phối kỹ thuật viên sớm nhất có thể (không chọn thời gian).
          </Text>
        </View>
      )}
      </KeyboardAwareScrollView>

      {/* Footer cố định */}
      <View style={[styles.footer, { height: FOOTER_HEIGHT + insets.bottom }]}>
        <Pressable
          disabled={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={[styles.submitBtn, isSubmitting && { backgroundColor: "#cfd8dc" }]}
        >
          <Text style={styles.submitText}>{isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}</Text>
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

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },

  chip: { backgroundColor: "#f0f0f0", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
  chipSelected: { backgroundColor: "#1e88e5" },
  chipText: { fontSize: 14, color: "#666", fontWeight: "500" },
  chipTextSelected: { color: "white" },

  priorityBtn: { flex: 1, backgroundColor: "#f0f0f0", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  priorityBtnSelected: { backgroundColor: "#1e88e5" },
  priorityText: { fontSize: 14, color: "#666", fontWeight: "500" },
  priorityTextSelected: { color: "white" },

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
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  urgentText: { color: "#991b1b", fontSize: 13, flex: 1 },

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
});
