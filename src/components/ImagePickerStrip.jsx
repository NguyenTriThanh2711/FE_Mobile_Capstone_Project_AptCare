import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet, Modal, FlatList, Dimensions, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Icon } from "@/src/components/Icon.native";

const screen = Dimensions.get("window");
const thumbSize = 84;

function normalizePickedAsset(asset) {
  // asset từ expo-image-picker có: uri, width, height, fileName?, mimeType?
  const uri = asset?.uri;
  const nameFromPicker = asset?.fileName || uri?.split("/").pop() || `photo_${Date.now()}.jpg`;
  const ext = (nameFromPicker.split(".").pop() || "jpg").toLowerCase();
  const mime =
    asset?.mimeType ||
    (ext === "png" ? "image/png" : ext === "heic" ? "image/heic" : "image/jpeg");

  return {
    uri,
    name: nameFromPicker,
    type: mime,
    width: asset?.width,
    height: asset?.height,
    // fileSize: asset?.fileSize // iOS có thể không có
  };
}

export default function ImagePickerStrip({
  value = [],               // mảng file { uri, name, type }
  onChange,                 // (files) => void
  maxCount = 10,
  title = "Ảnh đính kèm",
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const canAddMore = value.length < maxCount;

  const askCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền truy cập", "Ứng dụng cần quyền dùng Camera để chụp ảnh.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        exif: false,
      });
      if (!res.canceled && res.assets?.length) {
        const next = [...value, ...res.assets.map(normalizePickedAsset)];
        onChange?.(next.slice(0, maxCount));
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Lỗi", "Không chụp được ảnh.");
    }
  };

  const askLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Quyền truy cập", "Ứng dụng cần quyền truy cập thư viện ảnh.");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxCount - value.length > 0 ? maxCount - value.length : 1,
        exif: false,
      });
      if (!res.canceled && res.assets?.length) {
        const next = [...value, ...res.assets.map(normalizePickedAsset)];
        onChange?.(next.slice(0, maxCount));
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Lỗi", "Không chọn được ảnh.");
    }
  };

  const openViewer = (startIndex = 0) => {
    if (value.length === 0) return;
    setViewerIndex(startIndex);
    setViewerOpen(true);
  };

  const removeAt = (idx) => {
    const next = value.filter((_, i) => i !== idx);
    onChange?.(next);
  };

  const overCount = Math.max(0, value.length - 2);
  const firstTwo = value.slice(0, 2);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Pressable style={[styles.pillBtn]} onPress={askCamera}>
          <Icon name="camera.fill" size={16} color="#fff" />
          <Text style={styles.pillBtnText}>Chụp ảnh</Text>
        </Pressable>
        <Pressable style={[styles.pillBtn, { backgroundColor: "#0ea5e9" }]} onPress={askLibrary}>
          <Icon name="photo.fill" size={16} color="#fff" />
          <Text style={styles.pillBtnText}>Chọn ảnh</Text>
        </Pressable>
      </View>

      {/* Thumbs - bấm vào cụm ảnh để xem toàn bộ */}
      <Pressable
        onPress={() => openViewer(0)}
        disabled={value.length === 0}
        style={[styles.thumbsRow, value.length === 0 && { opacity: 0.5 }]}
      >
        {firstTwo.map((f, idx) => (
          <View key={idx} style={styles.thumbBox}>
            <Image
              source={{ uri: f.uri }}
              style={styles.thumb}
              resizeMode="cover"
            />
            {/* nút xoá nhỏ trên góc phải */}
            <Pressable style={styles.closeBtn} onPress={(e) => { e.stopPropagation(); removeAt(idx); }}>
              <Text style={styles.closeTxt}>×</Text>
            </Pressable>

            {/* overlay +N ở ảnh thứ 2 nếu còn thừa */}
            {idx === 1 && overCount > 0 ? (
              <View style={styles.overlay}>
                <Text style={styles.overlayTxt}>+{overCount}</Text>
              </View>
            ) : null}
          </View>
        ))}

        {value.length === 0 ? (
          <View style={[styles.thumbBox, styles.thumbEmpty]}>
            <Icon name="photo" size={20} color="#6b7280" />
            <Text style={{ color: "#6b7280", marginTop: 6 }}>Chưa có ảnh</Text>
          </View>
        ) : null}
      </Pressable>

      {/* Viewer Modal */}
      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewerBg}>
          {/* Header viewer */}
          <View style={styles.viewerHeader}>
            <Pressable onPress={() => setViewerOpen(false)} hitSlop={10} style={{ padding: 6 }}>
              <Icon name="xmark" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.viewerTitle}>{viewerIndex + 1}/{value.length}</Text>
            <View style={{ width: 34 }} />
          </View>

          <FlatList
            data={value}
            keyExtractor={(item, i) => item.uri + i}
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
            renderItem={({ item, index }) => (
              <View style={{ width: screen.width, height: screen.height, justifyContent: "center", alignItems: "center" }}>
                <Image
                  source={{ uri: item.uri }}
                  style={{ width: screen.width, height: screen.width }}
                  resizeMode="contain"
                />

                {/* Remove button in viewer */}
                <Pressable
                  onPress={() => {
                    const idx = index;
                    const next = value.filter((_, i) => i !== idx);
                    onChange?.(next);
                    if (idx >= next.length) {
                      setViewerIndex(Math.max(0, next.length - 1));
                    }
                    if (next.length === 0) setViewerOpen(false);
                  }}
                  style={styles.viewerRemoveBtn}
                >
                  <Icon name="trash" size={16} color="#fff" />
                  <Text style={styles.viewerRemoveTxt}>Xoá ảnh này</Text>
                </Pressable>
              </View>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 14 ,borderBlockColor: "#d1d5db", borderWidth: 1, paddingTop: 12 },
  title: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8 },
  actions: { flexDirection: "row", gap: 10, marginBottom: 10 },
  pillBtn: {
    backgroundColor: "#1e88e5",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillBtnText: { color: "#fff", fontWeight: "700" },

  thumbsRow: { flexDirection: "row", gap: 10 },
  thumbBox: { width: thumbSize, height: thumbSize, borderRadius: 10, overflow: "hidden", backgroundColor: "#e5e7eb" },
  thumb: { width: "100%", height: "100%" },
  thumbEmpty: { justifyContent: "center", alignItems: "center" },

  closeBtn: {
    position: "absolute", right: 4, top: 4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
  },
  closeTxt: { color: "#fff", fontWeight: "800", marginTop: -2 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayTxt: { color: "#fff", fontWeight: "800", fontSize: 18 },

  viewerBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)" },
  viewerHeader: {
    height: 56, alignItems: "center", justifyContent: "space-between",
    flexDirection: "row", paddingHorizontal: 12, marginTop: 24,
  },
  viewerTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  viewerRemoveBtn: {
    position: "absolute", bottom: 48,
    backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8,
  },
  viewerRemoveTxt: { color: "#fff", fontWeight: "700" },
});
