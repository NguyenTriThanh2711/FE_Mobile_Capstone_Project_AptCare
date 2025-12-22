import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { Icon } from "@/src/components/Icon.native";
import { getOrCreateReceptionConversation } from "@/src/features/chat/chatSlice";

const SYSTEM_PHONE = "0899353935";
const SYSTEM_EMAIL = "support@aptcare.vn";

export default function SupportHome() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const displayName = useMemo(() => {
    const v = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
    return v || user?.fullName || user?.userName || "Người dùng";
  }, [user?.firstName, user?.lastName, user?.fullName, user?.userName]);

  const [loadingChat, setLoadingChat] = useState(false);

  const openPhone = async () => {
    // const url = `tel:${SYSTEM_PHONE}`;
    // const can = await Linking.canOpenURL(url);
    // if (!can) return Alert.alert("Không thể gọi", "Thiết bị không hỗ trợ gọi điện.");
    // Linking.openURL(url);
  };

  const openEmail = async () => {
    // const subject = encodeURIComponent("AptCare - Yêu cầu hỗ trợ");
    // const body = encodeURIComponent(
    //   `Xin chào AptCare,\n\nTôi cần hỗ trợ về:\n- Vấn đề:\n- Tài khoản: ${displayName}\n- SĐT:\n- Căn hộ:\n\nCảm ơn.`
    // );
    // const url = `mailto:${SYSTEM_EMAIL}?subject=${subject}&body=${body}`;
    // const can = await Linking.canOpenURL(url);
    // if (!can) return Alert.alert("Không thể mở Email", "Thiết bị chưa cấu hình email.");
    // Linking.openURL(url);
  };

  const openChatReception = async () => {
    try {
      setLoadingChat(true);
      const res = await dispatch(getOrCreateReceptionConversation()).unwrap();
      const conversationId = res?.conversationId ?? res?.id;
      if (!conversationId) throw new Error("Missing conversationId");
      router.push(`/(resident)/chat/${conversationId}`);
    } catch (e) {
      console.log("openChatReception error", e);
      //Alert.alert("Lỗi", "Không thể mở chat lễ tân. Vui lòng thử lại.");
    } finally {
      setLoadingChat(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.hBtn}>
          <Icon name="chevron.left" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.hTitle} numberOfLines={1}>
          Trợ giúp & Hỗ trợ
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.desc}>
          Nếu bạn gặp sự cố khi sử dụng AptCare, hãy chọn một kênh hỗ trợ bên dưới.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hỗ trợ nhanh</Text>

          <Pressable style={styles.item} onPress={openChatReception} disabled={loadingChat}>
            <View style={styles.itemLeft}>
              <View style={styles.iconBox}>
                <Icon name="message" size={18} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Chat với Lễ tân</Text>
                <Text style={styles.itemSub}>Tạo cuộc trò chuyện để được hỗ trợ trực tiếp</Text>
              </View>
            </View>
            {loadingChat ? (
              <ActivityIndicator />
            ) : (
              <Icon name="chevron.right" size={16} color="#9CA3AF" />
            )}
          </Pressable>

          <Pressable style={styles.item} onPress={openPhone}>
            <View style={styles.itemLeft}>
              <View style={styles.iconBox}>
                <Icon name="phone" size={18} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Đường dây nóng</Text>
                <Text style={styles.itemSub}>{SYSTEM_PHONE}</Text>
              </View>
            </View>
            {/* <Icon name="chevron.right" size={16} color="#9CA3AF" /> */}
          </Pressable>

          <Pressable style={styles.item} onPress={openEmail}>
            <View style={styles.itemLeft}>
              <View style={styles.iconBox}>
                <Icon name="envelope" size={18} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Email hỗ trợ</Text>
                <Text style={styles.itemSub}>{SYSTEM_EMAIL}</Text>
              </View>
            </View>
            {/* <Icon name="chevron.right" size={16} color="#9CA3AF" /> */}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin</Text>

          <Pressable style={styles.item} onPress={() => router.push("/(technician)/support/policies")}>
            <View style={styles.itemLeft}>
              <View style={styles.iconBox}>
                <Icon name="doc.text" size={18} color="#007AFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>Điều khoản & Chính sách</Text>
                <Text style={styles.itemSub}>Quyền riêng tư, dữ liệu, phạm vi sử dụng</Text>
              </View>
            </View>
            <Icon name="chevron.right" size={16} color="#9CA3AF" />
          </Pressable>
        </View>

        <Text style={styles.note}>
          Thời gian hỗ trợ: Thứ 2–Thứ 6 (08:00–17:30), Thứ 7 (08:00–12:00).
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 44,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f2",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hBtn: { padding: 6 },
  hTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800", color: "#111827" },

  body: { padding: 16, paddingBottom: 28 },
  desc: { color: "#6B7280", fontSize: 14, lineHeight: 20, marginBottom: 12 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eef2f2",
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#111827", paddingHorizontal: 14, marginBottom: 6 },

  item: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  iconBox: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center", justifyContent: "center",
  },
  itemTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  itemSub: { fontSize: 13, color: "#6B7280", marginTop: 2 },

  note: { marginTop: 6, color: "#9CA3AF", fontSize: 12, lineHeight: 18 },
});
