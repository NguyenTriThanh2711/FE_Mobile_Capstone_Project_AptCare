import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Icon } from "@/src/components/Icon.native";
import { router } from "expo-router";
import callPhone from "@/src/utils/call-phone";
import { getRoomsLabel } from "@/src/helper/room-labels-profile";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { dotnetArr } from "@/src/helper/dotnetArr";
import { fetchRecentAccrossApartments, selectRecentRequests, selectRecentRequestsError, selectRecentRequestsLoading } from "@/src/features/requests/requestsSlice";
import { pretty } from "@/src/helper/prettyLog";
import RequestListItem from "@/src/components/RequestListItem";

export default function ResidentHome() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  // console.log("ResidentHome: user =", user);

  const apartments = useMemo(() => dotnetArr(user?.apartments), [user]);
  const apartmentIds = useMemo(
    () => apartments.map((a) => a.apartmentId).filter(Boolean),
    [apartments]
  );

  const recent = dotnetArr(useAppSelector(selectRecentRequests));
  //  console.log('resident home recent request', pretty(recent[0]));
  const recentLoading = useAppSelector(selectRecentRequestsLoading);

  useEffect(() => {
    if (apartmentIds.length) {
      dispatch(fetchRecentAccrossApartments({ apartmentIds, perAptSize: 5, take: 3 }));
    }
  }, [dispatch, apartmentIds]);

  const [requestForm, setRequestForm] = useState({
    category: "",
    priority: "",
    description: "",
    location: "",
  });

  const quickActions = [
    { id: 1, title: "Yều cầu sửa chữa mới", icon: "plus.circle.fill", color: "#007AFF", action: () => router.push({ pathname: "/(resident)/request-create" }) },
    { id: 2, title: "Khẩn cấp",   icon: "exclamationmark.triangle.fill", color: "#FF3B30", action: () => router.push({ pathname: "/(resident)/request-create", params: { emergency: "true" } }) },
    { id: 4, title: "Báo cáo sự cố tòa nhà",icon: "flag.fill", color: "#34C759", action: () => router.push({ pathname: "/(resident)/my-reports" }) },
  ];

  const handleFeedback = () => {
    console.log("Opening feedback form");
    Alert.alert("Feedback", "Feedback feature coming soon!");
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Chào mừng quay trở lại!</Text>
          <Text style={styles.apartmentText}>{user?.firstName + " " + user?.lastName}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hành động nhanh</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.action}
              >
                <View
                  style={[
                    styles.quickActionIcon,
                    { backgroundColor: action.color + "20" },
                  ]}
                >
                  <Icon name={action.icon} size={24} color={action.color} />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Recent Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Yêu cầu gần đây</Text>
            <Pressable onPress={() => router.push("/(resident)/requests")}>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </Pressable>
          </View>
          {recentLoading ? (
            <View style={{ alignItems: "center", padding: 20 }}>
              <Text>Đang tải...</Text>
            </View>
          ) : recent?.length === 0 ? (
            <View style={{ alignItems: "center", padding: 20,  }}>
              <Text>Không có yêu cầu nào gần đây.</Text>
            </View>
          ) : (
          recent?.map((r) => (
            <RequestListItem key={r.repairRequestId} item={r} />
          )))}
        </View>

        {/* Building Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin tòa nhà</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Icon name="phone.fill" size={20} color="#007AFF" />
              <Pressable style={styles.infoContent} onPress={() => callPhone("0899353935")}>
                <Text style={styles.infoLabel}>Liên hệ khẩn cấp</Text>
                <Text style={styles.infoValue}>0899-353935</Text>
              </Pressable>
            </View>
            <View style={styles.infoItem}>
              <Icon name="clock.fill" size={20} color="#34C759" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Giờ làm việc</Text>
                <Text style={styles.infoValue}>Thứ 2 - Thứ 6: 9AM-6PM</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name="envelope.fill" size={20} color="#FF9500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email quản lý</Text>
                <Text style={styles.infoValue}>manager@aptcare.com</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  apartmentText: {
    fontSize: 16,
    color: "#666",
  },
  section: {
    padding: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  viewAllText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  quickActionCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1a1a1a",
    textAlign: "center",
  },
  requestCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    flex: 1,
    marginRight: 12,
  },
  requestCategory: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: "white",
    fontWeight: "800",
  },
  requestDescription: {
    fontSize: 14,
    color: "#333",
    marginBottom: 10,
    lineHeight: 18,
  },
  requestMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestDate: {
    fontSize: 12,
    color: "#6B7280",
  },
  requestApt: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  requestIssue: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
    lineHeight: 18,
  },
  requestFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestDate: {
    fontSize: 12,
    color: "#666",
  },
  technicianName: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "500",
  },
  bottomPadding: {
    height: 20,
  },
});