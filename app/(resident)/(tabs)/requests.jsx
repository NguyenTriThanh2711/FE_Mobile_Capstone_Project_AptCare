import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Icon } from "@/src/components/Icon.native";
import { router } from "expo-router";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  addButton: {
    backgroundColor: "#007AFF",
    margin: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  requestCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  requestTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  requestDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  requestMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestDate: {
    fontSize: 12,
    color: "#999",
  },
  requestActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
});

export default function ResidentRequests() {
  const [requests, setRequests] = useState([
    {
      id: 1,
      title: "Ro rỉ vòi nước trong bếp",
      description: "Vòi nước trong bếp đã bị rò rỉ liên tục trong tuần qua. Nó đang lãng phí nước và gây ồn ào vào ban đêm.",
      status: "pending",
      date: "2024-01-15",
      priority: "medium",
    },
    {
      id: 2,
      title: "Điều hòa không hoạt động",
      description: "Điều hòa trong phòng khách đã ngừng hoạt động từ hôm qua. Nhiệt độ trong căn hộ đang tăng cao.",
      status: "in_progress",
      date: "2024-01-14",
      priority: "high",
    },
    {
      id: 3,
      title: "Công tắc đèn bị hỏng",
      description: "Công tắc đèn trong phòng ngủ bị lỏng và đôi khi không hoạt động đúng cách.",
      status: "completed",
      date: "2024-01-10",
      priority: "low",
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: "",
    description: "",
    priority: "medium",
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return { backgroundColor: "#FFF3CD", color: "#856404" };
      case "in_progress":
        return { backgroundColor: "#D1ECF1", color: "#0C5460" };
      case "completed":
        return { backgroundColor: "#D4EDDA", color: "#155724" };
      default:
        return { backgroundColor: "#F8F9FA", color: "#6C757D" };
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const handleSubmitRequest = () => {
    if (!newRequest.title.trim() || !newRequest.description.trim()) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    const request = {
      id: Date.now(),
      title: newRequest.title,
      description: newRequest.description,
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      priority: newRequest.priority,
    };

    setRequests([request, ...requests]);
    setNewRequest({ title: "", description: "", priority: "medium" });
    setShowModal(false);
    Alert.alert("Success", "Your request has been submitted successfully!");
  };

  const handleEditRequest = (requestId) => {
    console.log("Chỉnh sửa yêu cầu:", requestId);
    Alert.alert("Chỉnh sửa yêu cầu", "Chức năng chỉnh sửa sẽ được triển khai sớm.");
  };

  const handleCancelRequest = (requestId) => {
    Alert.alert(
      "Hủy yêu cầu",
      "Bạn có chắc chắn muốn hủy yêu cầu này không?",
      [
        { text: "Không", style: "cancel" },
        {
          text: "Có",
          style: "destructive",
          onPress: () => {
            setRequests(requests.filter((req) => req.id !== requestId));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu cầu của tôi</Text>
        <Text style={styles.headerSubtitle}>
          Theo dõi các yêu cầu bảo trì của bạn
        </Text>
      </View>

      <Pressable
        style={styles.addButton}
        onPress={() => router.push({ pathname: "/(resident)/request-create" })}
      >
        <Icon name="plus" size={20} color="white" />
        <Text style={styles.addButtonText}>Tạo yêu cầu</Text>
      </Pressable>

      <ScrollView showsVerticalScrollIndicator={false}>
        {requests.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="list.bullet" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>
              Chưa có yêu cầu nào.{"\n"}Nhấn "Tạo yêu cầu" để bắt đầu.
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestTitle}>{request.title}</Text>
                <View
                  style={[styles.statusBadge, getStatusColor(request.status)]}
                >
                  <Text
                    style={[styles.statusText, { color: getStatusColor(request.status).color }]}
                  >
                    {getStatusText(request.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestDescription}>
                {request.description}
              </Text>
              <View style={styles.requestMeta}>
                <Text style={styles.requestDate}>
                  Ngày tạo: {new Date(request.date).toLocaleDateString()}
                </Text>
                {request.status === "pending" && (
                  <View style={styles.requestActions}>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleEditRequest(request.id)}
                    >
                      <Icon name="pencil" size={16} color="#007AFF" />
                    </Pressable>
                    <Pressable
                      style={styles.actionButton}
                      onPress={() => handleCancelRequest(request.id)}
                    >
                      <Icon name="trash" size={16} color="#FF3B30" />
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}