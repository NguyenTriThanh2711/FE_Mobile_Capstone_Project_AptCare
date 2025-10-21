import React, { useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import { Icon } from "@/src/components/Icon.native";
import { router } from "expo-router";
import { useAppDispatch } from "@/src/store";
import { setCurrentRequest } from "../features/requests/requestsSlice";
// Nhớ export action này từ requestsSlice (không phải selector)

function PillColors(isEmergency) {
  return {
    bg: isEmergency ? "#FEE2E2" : "#E5F6FF",
    fg: isEmergency ? "#B91C1C" : "#0C4A6E",
    text: isEmergency ? "Khẩn cấp" : "Bình thường",
  };
}

export default function RequestListItem({ item }) {
  const swipeRef = useRef(null);
  const dispatch = useAppDispatch();
  const p = PillColors(!!item?.isEmergency);

  const goToDetail = () => {
    dispatch(setCurrentRequest(item));
    // Điều hướng theo id
    router.push({
      pathname: "/(resident)/request/[id]",
      params: { id: String(item?.repairRequestId) },
    });
    // đóng swipe nếu đang mở
    if (swipeRef.current) swipeRef.current.close();
  };

  // Component riêng cho phần action (để dùng useAnimatedStyle)
  const RightActions = ({ progress, dragX }) => {
    // dragX.value là số âm khi kéo sang trái
    const animatedStyle = useAnimatedStyle(() => {
      const trans = interpolate(
        dragX.value,
        [-100, 0],      // khi kéo từ -120 -> 0
        [0, 20],        // dịch nút từ 0 -> 60
        Extrapolation.CLAMP
      );
      return { transform: [{ translateX: trans }] };
    });

    return (
      <View style={styles.actionsWrap}>
        <Animated.View style={[styles.actionBtn, animatedStyle]}>
          <Pressable style={styles.detailBtn} onPress={goToDetail}>
            <Icon name="info.circle.fill" size={18} color="#fff" />
            <Text style={styles.detailBtnText}>Chi tiết</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  const renderRightActions = (progress, dragX) => (
    <RightActions progress={progress} dragX={dragX} />
  );

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={24}
      overshootRight={false}
      renderRightActions={renderRightActions}
    >
      <Pressable onPress={goToDetail} style={styles.card}>
        <View style={styles.rowTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item?.object || "Không tiêu đề"}
          </Text>
          <View style={[styles.badge, { backgroundColor: p.bg }]}>
            <Text style={[styles.badgeText, { color: p.fg }]}>{p.text}</Text>
          </View>
        </View>

        {item?.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <Text style={styles.metaLeft}>
            {item?.createdAt ? new Date(item.createdAt).toLocaleString("vi-VN") : ""}
          </Text>
          <Text style={styles.metaRight}>
            {item?.apartment
              ? `Tầng ${item.apartment?.floor ?? ""} - P.${item.apartment?.roomNumber ?? ""}`
              : ""}
          </Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // vùng nút hành động nằm bên phải
  actionsWrap: {
    width: 96,
    justifyContent: "center",
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  actionBtn: {
    width: 88,
    marginRight: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  detailBtn: {
    backgroundColor: "#2563EB",
    height: 72,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  detailBtnText: { color: "#fff", fontWeight: "800" },

  // card hiển thị chính
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1, marginRight: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: "800" },
  desc: { fontSize: 14, color: "#374151", marginBottom: 8 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  metaLeft: { fontSize: 12, color: "#6B7280" },
  metaRight: { fontSize: 12, color: "#007AFF", fontWeight: "600" },
});
