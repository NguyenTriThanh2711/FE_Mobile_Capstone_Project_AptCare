import React, { useState } from "react";
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
import { Button } from "@/src/components/common/Button";
import { useSelector } from "react-redux";
import { router } from "expo-router";
import callPhone from "@/src/utils/call-phone";
import { getRoomsLabel } from "@/src/helper/room-labels-profile";

export default function ResidentHome() {
  const user = useSelector((s) => s.auth.user);//mocked, có thể sau này xài fecthProfile để lấy thông tin đầy đủ hơn
  console.log("ResidentHome: user =", user);
  const [requestForm, setRequestForm] = useState({
    category: "",
    priority: "",
    description: "",
    location: "",
  });

  const [recentRequests, setRecentRequests] = useState([
    {
      id: 1,
      category: "Plumbing",
      issue: "Vòi nước rò rỉ trong bếp",
      status: "Đang xử lý",
      date: "2024-01-15",
      technician: "John Smith",
    },
    {
      id: 2,
      category: "Electrical",
      issue: "Outlet not working in bedroom",
      status: "Scheduled",
      date: "2024-01-14",
      technician: "Mike Johnson",
    },
  ]);

  const quickActions = [
    { id: 1, title: "Yều cầu sửa chữa mới", icon: "plus.circle.fill", color: "#007AFF", action: () => router.push({ pathname: "/(resident)/request-create" }) },
    { id: 2, title: "Khẩn cấp",   icon: "exclamationmark.triangle.fill", color: "#FF3B30", action: () => router.push({ pathname: "/(resident)/request-create", params: { emergency: "true" } }) },
    { id: 3, title: "Phản hồi",    icon: "star.fill", color: "#FF9500", action: handleFeedback },
    { id: 4, title: "Báo cáo sự cố tòa nhà",icon: "flag.fill", color: "#34C759", action: handleReportIssue },
  ];


  const handleEmergency = () => {
    Alert.alert(
      "Emergency Request",
      "This will immediately notify building management. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () => {
            console.log("Emergency request submitted");
            Alert.alert("Emergency Submitted", "Help is on the way!");
          },
        },
      ]
    );
  };

  const handleFeedback = () => {
    console.log("Opening feedback form");
    Alert.alert("Feedback", "Feedback feature coming soon!");
  };

  const handleReportIssue = () => {
    console.log("Opening issue report");
    Alert.alert("Report Issue", "Issue reporting feature coming soon!");
  };

  const handleSubmitRequest = () => {
    if (!requestForm.category || !requestForm.description) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    console.log("Submitting request:", requestForm);
    
    const newRequest = {
      id: Date.now(),
      category: requestForm.category,
      issue: requestForm.description,
      status: "Submitted",
      date: new Date().toISOString().split("T")[0],
      technician: "Pending Assignment",
    };

    setRecentRequests(prev => [newRequest, ...prev]);
    setRequestForm({ category: "", priority: "", description: "", location: "" });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress":
        return "#007AFF";
      case "Scheduled":
        return "#34C759";
      case "Completed":
        return "#8E8E93";
      case "Submitted":
        return "#FF9500";
      default:
        return "#8E8E93";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Chào mừng quay trở lại!</Text>
          <Text style={styles.apartmentText}>Căn hộ {getRoomsLabel(user)}</Text>
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
          
          {recentRequests.slice(0, 3).map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestCategory}>{request.category}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(request.status) },
                  ]}
                >
                  <Text style={styles.statusText}>{request.status}</Text>
                </View>
              </View>
              <Text style={styles.requestIssue}>{request.issue}</Text>
              <View style={styles.requestFooter}>
                <Text style={styles.requestDate}>
                  {new Date(request.date).toLocaleDateString()}
                </Text>
                <Text style={styles.technicianName}>{request.technician}</Text>
              </View>
            </View>
          ))}
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
    padding: 20,
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
