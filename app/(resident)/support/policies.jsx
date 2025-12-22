import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Icon } from "@/src/components/Icon.native";

export default function PoliciesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.hBtn}>
          <Icon name="chevron.left" size={22} color="#111827" />
        </Pressable>
        <Text style={styles.hTitle} numberOfLines={1}>
          Điều khoản & Chính sách
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.h1}>1. Giới thiệu</Text>
        <Text style={styles.p}>
          AptCare là hệ thống hỗ trợ quản lý sửa chữa và bảo trì trong phạm vi tòa nhà chung cư,
          giúp cư dân, ban quản lý và đội ngũ kỹ thuật phối hợp hiệu quả.
        </Text>

        <Text style={styles.h1}>2. Phạm vi sử dụng</Text>
        <Text style={styles.p}>
          Ứng dụng chỉ được sử dụng cho mục đích tiếp nhận, xử lý, theo dõi yêu cầu sửa chữa/bảo trì
          và các thông báo liên quan trong phạm vi tòa nhà.
        </Text>

        <Text style={styles.h1}>3. Tài khoản & bảo mật</Text>
        <Text style={styles.p}>
          Tài khoản được cấp phát có kiểm soát, gắn với căn hộ và vai trò. Người dùng có trách nhiệm
          bảo mật thông tin đăng nhập và thông báo ngay khi nghi ngờ bị truy cập trái phép.
        </Text>

        <Text style={styles.h1}>4. Dữ liệu & quyền riêng tư</Text>
        <Text style={styles.p}>
          Thông tin cá nhân (họ tên, liên hệ, căn hộ) và dữ liệu xử lý yêu cầu được lưu trữ tập trung
          nhằm phục vụ vận hành, báo cáo và cải thiện dịch vụ. AptCare không chia sẻ dữ liệu cho bên thứ ba
          khi chưa có sự đồng ý, trừ trường hợp theo yêu cầu cơ quan có thẩm quyền.
        </Text>

        <Text style={styles.h1}>5. Thông báo</Text>
        <Text style={styles.p}>
          Hệ thống có thể gửi thông báo khi có cập nhật trạng thái yêu cầu, lịch hẹn, báo cáo hoặc tin nhắn mới.
          Người dùng cần bật quyền thông báo để nhận đầy đủ thông tin.
        </Text>

        <Text style={styles.h1}>6. Cập nhật chính sách</Text>
        <Text style={styles.p}>
          Điều khoản và chính sách có thể được cập nhật theo yêu cầu vận hành. Các thay đổi sẽ được thông báo trong hệ thống.
        </Text>

        <Text style={styles.footer}>
          Bằng việc tiếp tục sử dụng AptCare, bạn xác nhận đã đọc và đồng ý với các điều khoản trên.
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
  h1: { fontSize: 15, fontWeight: "900", color: "#111827", marginTop: 14, marginBottom: 6 },
  p: { fontSize: 14, lineHeight: 20, color: "#374151" },
  footer: { marginTop: 18, fontSize: 12, lineHeight: 18, color: "#9CA3AF" },
});
