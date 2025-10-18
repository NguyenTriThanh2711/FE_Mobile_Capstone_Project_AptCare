import React, { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Icon } from "@/src/components/Icon.native";
// import http from "@/src/services/http";

const COLORS = {
  bg: "#F8F9FA",
  card: "#FFFFFF",
  text: "#111827",
  sub: "#6B7280",
  border: "#E5E7EB",
  blue: "#007AFF",
  red: "#EF4444",
  zinc50: "#F9FAFB",
  zinc100: "#F3F4F6",
};

async function mockGetDevice(id) {
  // Thay bằng: const { data } = await http.get(`/devices/${id}`);
  await new Promise((r) => setTimeout(r, 250));
  return {
    id,
    name: "Máy lạnh Panasonic 1HP",
    category: "hvac",
    status: "ok",
    serial: "AC-PA-1101",
    location: "Phòng ngủ",
    updatedAt: "2025-01-10T08:22:00Z",
    photo:
      "https://images.unsplash.com/photo-1627384113743-6df8fc14f1db?q=80&w=1200&auto=format&fit=crop",
    notes: "Vệ sinh 6 tháng/lần",
  };
}

export default function DeviceDetail() {
  const { id } = useLocalSearchParams();
  const isNew = id === "new";
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    category: "appliance",
    serial: "",
    location: "",
    status: "ok",
    notes: "",
    photoUri: "",
  });

  useEffect(() => {
    if (isNew) return;
    (async () => {
      try {
        setLoading(true);
        const data = await mockGetDevice(String(id));
        setDraft({
          name: data.name || "",
          category: data.category || "appliance",
          serial: data.serial || "",
          location: data.location || "",
          status: data.status || "ok",
          notes: data.notes || "",
          photoUri: data.photo || "",
        });
      } catch (e) {
        Alert.alert("Lỗi", "Không tải được thiết bị.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const ensurePermissions = async () => {
    const cam = await ImagePicker.requestCameraPermissionsAsync();
    const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cam.status !== "granted" || lib.status !== "granted") {
      Alert.alert("Quyền bị từ chối", "Vui lòng cấp quyền camera & thư viện ảnh.");
      return false;
    }
    return true;
  };

  const pickFromCamera = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!res.canceled) {
      setDraft((d) => ({ ...d, photoUri: res.assets?.[0]?.uri || "" }));
    }
  };

  const pickFromLibrary = async () => {
    const ok = await ensurePermissions();
    if (!ok) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      selectionLimit: 1,
    });
    if (!res.canceled) {
      setDraft((d) => ({ ...d, photoUri: res.assets?.[0]?.uri || "" }));
    }
  };

  const onSave = async () => {
    if (!draft.name.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên thiết bị.");
      return;
    }
    try {
      setSaving(true);
      // const form = new FormData();
      // if (draft.photoUri && draft.photoUri.startsWith("file")) {
      //   form.append("photo", { uri: draft.photoUri, type: "image/jpeg", name: "device.jpg" });
      // }
      // form.append("name", draft.name.trim());
      // form.append("category", draft.category);
      // form.append("serial", draft.serial.trim());
      // form.append("location", draft.location.trim());
      // form.append("status", draft.status);
      // form.append("notes", draft.notes || "");

      // if (isNew) await http.post("/devices", form, { headers: { "Content-Type": "multipart/form-data" } });
      // else await http.put(`/devices/${id}`, form, { headers: { "Content-Type": "multipart/form-data" } });

      await new Promise((r) => setTimeout(r, 350)); // mock
      Alert.alert("Thành công", isNew ? "Đã tạo thiết bị." : "Đã lưu thay đổi.");
      router.back();
    } catch (e) {
      Alert.alert("Lỗi", "Không lưu được thiết bị, thử lại sau.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    Alert.alert("Xoá thiết bị", "Bạn chắc chắn muốn xoá thiết bị này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          try {
            setSaving(true);
            // await http.delete(`/devices/${id}`);
            await new Promise((r) => setTimeout(r, 250)); // mock
            Alert.alert("Đã xoá", "Thiết bị đã được xoá.");
            router.back();
          } catch {
            Alert.alert("Lỗi", "Không xoá được thiết bị.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* App bar */}
      <View style={[styles.appbar, 
        { paddingTop: insets.top,
          height: 56 +  insets.top
        }
      ]}>
        <Pressable onPress={() => router.back()} style={styles.navBtn}>
          <Icon name="chevron.left" size={22} color={COLORS.text} />
        </Pressable>
        <Text style={styles.title}>{isNew ? "Thêm thiết bị" : "Chi tiết thiết bị"}</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <Text style={{ color: COLORS.sub }}>Đang tải...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
          {/* Ảnh */}
          <View style={styles.photoRow}>
            {draft.photoUri ? (
              <Image source={{ uri: draft.photoUri }} style={styles.photo} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Icon name="photo" size={28} color={COLORS.sub} />
              </View>
            )}
            <View style={{ gap: 8 }}>
              <Pressable style={styles.pickBtn} onPress={pickFromCamera}>
                <Icon name="camera" size={16} color={COLORS.blue} />
                <Text style={styles.pickBtnText}>Chụp ảnh</Text>
              </Pressable>
              <Pressable style={styles.pickBtn} onPress={pickFromLibrary}>
                <Icon name="square.and.arrow.up" size={16} color={COLORS.blue} />
                <Text style={styles.pickBtnText}>Tải ảnh lên</Text>
              </Pressable>
            </View>
          </View>

          {/* Form */}
          <Field label="Tên thiết bị *">
            <TextInput
              value={draft.name}
              onChangeText={(t) => setDraft((d) => ({ ...d, name: t }))}
              placeholder="VD: Máy lạnh Panasonic 1HP"
              placeholderTextColor={COLORS.sub}
              style={styles.input}
            />
          </Field>

          <Field label="Danh mục">
            <ScrollChips
              value={draft.category}
              onChange={(v) => setDraft((d) => ({ ...d, category: v }))}
              data={[
                { key: "electric", label: "Điện" },
                { key: "water", label: "Nước" },
                { key: "hvac", label: "Điều hoà" },
                { key: "appliance", label: "Gia dụng" },
              ]}
            />
          </Field>

          <View style={styles.row2}>
            <Field label="Serial" flex>
              <TextInput
                value={draft.serial}
                onChangeText={(t) => setDraft((d) => ({ ...d, serial: t }))}
                placeholder="VD: AC-PA-1101"
                placeholderTextColor={COLORS.sub}
                style={styles.input}
                autoCapitalize="none"
              />
            </Field>
            <Field label="Vị trí" flex>
              <TextInput
                value={draft.location}
                onChangeText={(t) => setDraft((d) => ({ ...d, location: t }))}
                placeholder="VD: Phòng ngủ"
                placeholderTextColor={COLORS.sub}
                style={styles.input}
                autoCapitalize="none"
              />
            </Field>
          </View>

          <Field label="Tình trạng">
            <ScrollChips
              value={draft.status}
              onChange={(v) => setDraft((d) => ({ ...d, status: v }))}
              data={[
                { key: "ok", label: "Tốt" },
                { key: "need_check", label: "Cần kiểm tra" },
                { key: "broken", label: "Hỏng" },
              ]}
            />
          </Field>

          <Field label="Ghi chú">
            <TextInput
              value={draft.notes}
              onChangeText={(t) => setDraft((d) => ({ ...d, notes: t }))}
              placeholder="Thông tin thêm"
              placeholderTextColor={COLORS.sub}
              style={[styles.input, { height: 100, textAlignVertical: "top" }]}
              multiline
            />
          </Field>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {!isNew && (
              <Pressable style={styles.btnDanger} onPress={onDelete} disabled={saving}>
                <Icon name="trash" size={16} color="#fff" />
                <Text style={styles.btnDangerText}>Xoá</Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable style={styles.btnGray} onPress={() => router.back()} disabled={saving}>
              <Text style={styles.btnGrayText}>Hủy</Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={onSave} disabled={saving}>
              <Text style={styles.btnPrimaryText}>{isNew ? "Tạo" : "Lưu"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Field({ label, children, flex }) {
  return (
    <View style={[styles.field, flex && { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function ScrollChips({ value, onChange, data }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {data.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onChange(item.key)}
          style={[
            styles.chip,
            value === item.key && { backgroundColor: "#E8F3FF", borderColor: COLORS.blue },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              value === item.key && { color: COLORS.blue, fontWeight: "700" },
            ]}
          >
            {item.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
export const options = {
  headerShown: false,
};
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  appbar: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  navBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: COLORS.text },

  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  field: { marginTop: 12 },
  label: { fontSize: 13, color: COLORS.sub, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.zinc100,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: { fontSize: 13, color: COLORS.text },
  row2: { flexDirection: "row", gap: 10 },

  photoRow: { flexDirection: "row", gap: 12, marginTop: 16, marginBottom: 12 },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: COLORS.zinc100,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  photo: { width: 100, height: 100, borderRadius: 12 },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.zinc50,
  },
  pickBtnText: { color: COLORS.blue, fontWeight: "700", fontSize: 13 },

  actionsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },

  btnPrimary: {
    backgroundColor: COLORS.blue,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnGray: {
    backgroundColor: COLORS.zinc100,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  btnGrayText: { color: COLORS.text, fontWeight: "700" },

  btnDanger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.red,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  btnDangerText: { color: "#fff", fontWeight: "800" },
});
