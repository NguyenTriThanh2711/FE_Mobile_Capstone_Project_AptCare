import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Image, StyleSheet, Modal, FlatList, Dimensions, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Icon } from "@/src/components/Icon.native";

function normalizePickedAsset(asset) {
  const uri = asset?.uri;
  const nameFromPicker = asset?.fileName || uri?.split("/").pop() || `photo_${Date.now()}.jpg`;
  const ext = (nameFromPicker.split(".").pop() || "jpg").toLowerCase();
  const mime = asset?.mimeType || (ext === "png" ? "image/png" : ext === "heic" ? "image/heic" : "image/jpeg");
  return { uri, name: nameFromPicker, type: mime, width: asset?.width, height: asset?.height };
}

export default function ImagePickerStrip({
  value = [],
  onChange,
  maxCount = 10,
  title = "Ảnh đính kèm",
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(Dimensions.get("window").width); // fallback

  // khoảng padding ngang bên trong hàng ảnh + gap giữa 2 ảnh
  const PADDING_H = 16;
  const GAP = 10;

  // dùng bề rộng THỰC CỦA CARD để tính size, không dùng screen.width
  const thumbSize = useMemo(() => {
    const inner = Math.max(0, cardWidth - PADDING_H * 2);
    const s = Math.floor((inner - GAP) / 2); // 2 cột => (inner - gap)/2
    return s;
  }, [cardWidth]);

  const askCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return Alert.alert("Quyền truy cập", "Cần quyền Camera.");
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8, exif: false });
    if (!res.canceled && res.assets?.length) {
      const next = [...value, ...res.assets.map(normalizePickedAsset)];
      onChange?.(next.slice(0, maxCount));
    }
  };

  const askLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Quyền truy cập", "Cần quyền Thư viện ảnh.");
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: Math.max(1, maxCount - value.length),
      exif: false,
    });
    if (!res.canceled && res.assets?.length) {
      const next = [...value, ...res.assets.map(normalizePickedAsset)];
      onChange?.(next.slice(0, maxCount));
    }
  };

  const openViewer = (startIndex = 0) => {
    if (!value.length) return;
    setViewerIndex(startIndex);
    setViewerOpen(true);
  };

  const removeAt = (idx) => onChange?.(value.filter((_, i) => i !== idx));

  const overCount = Math.max(0, value.length - 2);
  const firstTwo = value.slice(0, 2);

  return (
    <View
      style={styles.card}
      onLayout={(e) => setCardWidth(e.nativeEvent.layout.width)} // << đo bề rộng thực
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.actions}>
          <Pressable style={[styles.pillBtn]} onPress={askCamera}>
            <Icon name="camera.fill" size={16} color="#fff" />
            <Text style={styles.pillBtnText}>Chụp</Text>
          </Pressable>
          <Pressable style={[styles.pillBtn, styles.pillSecondary]} onPress={askLibrary}>
            <Icon name="photo.fill" size={16} color="#fff" />
            <Text style={styles.pillBtnText}>Thư viện</Text>
          </Pressable>
        </View>
      </View>

      {/* Thumbs / Placeholder */}
      {value.length === 0 ? (
        <Pressable onPress={askLibrary} style={[styles.placeholder, { paddingHorizontal: PADDING_H }]}>
          <View style={styles.placeholderBox}>
            <Icon name="photo" size={22} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Chưa có ảnh — chạm để thêm</Text>
          </View>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => openViewer(0)}
          style={[styles.thumbsRow, { paddingHorizontal: PADDING_H, columnGap: GAP }]}
        >
          {firstTwo.map((f, idx) => (
            <View key={idx} style={[styles.thumbBox, { width: thumbSize, height: thumbSize }]}>
              <Image source={{ uri: f.uri }} style={styles.thumb} resizeMode="cover" />
              <Pressable
                style={styles.closeBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  removeAt(idx);
                }}
              >
                <Text style={styles.closeTxt}>×</Text>
              </Pressable>
              {idx === 1 && overCount > 0 ? (
                <View style={styles.overlay}>
                  <Text style={styles.overlayTxt}>+{overCount}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </Pressable>
      )}

      {/* Viewer */}
      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewerBg}>
          <View style={styles.viewerHeader}>
            <Pressable onPress={() => setViewerOpen(false)} hitSlop={10} style={{ padding: 6 }}>
              <Icon name="xmark" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.viewerTitle}>{viewerIndex + 1}/{value.length}</Text>
            <View style={{ width: 34 }} />
          </View>

          {/* full width x full height content area, ảnh contain để không tràn */}
          <FlatList
            data={value}
            keyExtractor={(item, i) => item.uri + i}
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(e) => {
              const winW = Dimensions.get("window").width;
              const idx = Math.round(e.nativeEvent.contentOffset.x / winW);
              setViewerIndex(idx);
            }}
            renderItem={({ item }) => (
              <View style={styles.viewerItem}>
                <Image style={styles.viewerImage} source={{ uri: item.uri }} resizeMode="contain" />
                <Pressable
                  onPress={() => {
                    const idx = viewerIndex;
                    const next = value.filter((_, i) => i !== idx);
                    onChange?.(next);
                    setViewerIndex(Math.max(0, next.length - 1));
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
  card: {
    marginTop: 14,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { fontSize: 14, fontWeight: "700", color: "#111827" },

  actions: { flexDirection: "row", gap: 8 },
  pillBtn: {
    backgroundColor: "#1e88e5",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillSecondary: { backgroundColor: "#0ea5e9" },
  pillBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  thumbsRow: {
    flexDirection: "row",
    paddingBottom: 16,
  },
  thumbBox: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
  },
  thumb: { width: "100%", height: "100%" },

  placeholder: { paddingBottom: 16 },
  placeholderBox: {
    height: 120,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FAFAFA",
  },
  placeholderText: { color: "#6B7280", fontSize: 13, fontWeight: "600" },

  closeBtn: {
    position: "absolute",
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: { color: "#fff", fontWeight: "800", marginTop: -2, fontSize: 14 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  overlayTxt: { color: "#fff", fontWeight: "800", fontSize: 18 },

  /* Viewer */
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

  viewerItem: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  viewerImage: { width: "100%", height: "100%" },

  viewerRemoveBtn: {
    position: "absolute",
    bottom: 48,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewerRemoveTxt: { color: "#fff", fontWeight: "700" },
});
