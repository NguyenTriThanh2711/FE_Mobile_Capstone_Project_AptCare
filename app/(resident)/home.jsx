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

export default function ResidentHome() {
  const [showRequestModal, setShowRequestModal] = useState(false);
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
      issue: "Leaking faucet in kitchen",
      status: "In Progress",
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
    { id: 1, title: "New Request", icon: "plus.circle.fill", color: "#007AFF", action: () => setShowRequestModal(true) },
    { id: 2, title: "Emergency",   icon: "exclamationmark.triangle.fill", color: "#FF3B30", action: handleEmergency },
    { id: 3, title: "Feedback",    icon: "star.fill", color: "#FF9500", action: handleFeedback },
    { id: 4, title: "Report Issue",icon: "flag.fill", color: "#34C759", action: handleReportIssue },
];


  const categories = [
    "Plumbing",
    "Electrical",
    "HVAC",
    "Appliances",
    "General Maintenance",
    "Other",
  ];

  const priorities = ["Low", "Medium", "High", "Urgent"];

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
    setShowRequestModal(false);
    
    Alert.alert("Success", "Your request has been submitted successfully!");
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
          <Text style={styles.welcomeText}>Welcome back!</Text>
          <Text style={styles.apartmentText}>Apartment 204-A</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
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
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            <Pressable>
              <Text style={styles.viewAllText}>View All</Text>
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
          <Text style={styles.sectionTitle}>Building Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <Icon name="phone.fill" size={20} color="#007AFF" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Emergency Contact</Text>
                <Text style={styles.infoValue}>(555) 123-4567</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name="clock.fill" size={20} color="#34C759" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Office Hours</Text>
                <Text style={styles.infoValue}>Mon-Fri: 9AM-6PM</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Icon name="envelope.fill" size={20} color="#FF9500" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Management Email</Text>
                <Text style={styles.infoValue}>manager@aptcare.com</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Request Modal */}
      <Modal
        visible={showRequestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowRequestModal(false)}>
              <Text style={styles.cancelButton}>Hủy</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Yêu cầu mới</Text>
            <Pressable onPress={handleSubmitRequest}>
              <Text style={styles.submitButton}>Gửi</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Danh mục *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {categories.map((category) => (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryChip,
                      requestForm.category === category && styles.selectedChip,
                    ]}
                    onPress={() =>
                      setRequestForm(prev => ({ ...prev, category }))
                    }
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        requestForm.category === category && styles.selectedChipText,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mức độ ưu tiên</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => (
                  <Pressable
                    key={priority}
                    style={[
                      styles.priorityButton,
                      requestForm.priority === priority && styles.selectedPriority,
                    ]}
                    onPress={() =>
                      setRequestForm(prev => ({ ...prev, priority }))
                    }
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        requestForm.priority === priority && styles.selectedPriorityText,
                      ]}
                    >
                      {priority}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Vị trí</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Kitchen, Bedroom, Living Room"
                value={requestForm.location}
                onChangeText={(text) =>
                  setRequestForm(prev => ({ ...prev, location: text }))
                }
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Mô tả *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Please describe the issue in detail..."
                value={requestForm.description}
                onChangeText={(text) =>
                  setRequestForm(prev => ({ ...prev, description: text }))
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
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
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  cancelButton: {
    fontSize: 16,
    color: "#FF3B30",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  submitButton: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedChip: {
    backgroundColor: "#007AFF",
  },
  categoryChipText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedChipText: {
    color: "white",
  },
  priorityContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  selectedPriority: {
    backgroundColor: "#007AFF",
  },
  priorityText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedPriorityText: {
    color: "white",
  },
  textInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1a1a1a",
    marginTop: 8,
  },
  textArea: {
    height: 100,
  },
});
