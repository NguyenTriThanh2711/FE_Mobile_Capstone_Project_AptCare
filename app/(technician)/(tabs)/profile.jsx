import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Switch,
  Image,
} from "react-native";
import { router } from "expo-router";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";

import GradientButton from "@/src/components/common/GradientButton";
import { Icon } from "@/src/components/Icon.native";
import {
  logout,
  fetchProfile,
  changeProfileImage,
} from "@/src/features/auth/authSlice";
import { persistor, useAppDispatch, useAppSelector } from "@/src/store";
import { compressAndResizeImage } from "@/src/utils/imageCompression";

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
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  profileImageImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: "#666",
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: "#999",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    marginTop: 20,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#f0f0f0",
  },
  statItemLast: {
    borderRightWidth: 0,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  menuItemArrow: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  logoutButton: {
    margin: 20,
    borderRadius: 12,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  avatarSheet: {
    width: "100%",
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  avatarSheetButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
    alignItems: "center",
  },
  avatarSheetButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  avatarConfirmContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    alignItems: "center",
  },
  avatarPreviewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  avatarViewBox: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    top: "15%",
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  avatarViewImage: {
    width: "100%",
    height: "80%",
  },
});

export default function TechnicianProfile() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (!authUser) dispatch(fetchProfile());
  }, [authUser, dispatch]);

  const displayName = useMemo(() => {
    const v1 = `${authUser?.firstName || ""} ${authUser?.lastName || ""}`.trim();
    return v1 || authUser?.fullName || authUser?.userName || "Kỹ thuật viên";
  }, [authUser?.firstName, authUser?.lastName, authUser?.fullName, authUser?.userName]);

  const employeeId = authUser?.employeeCode || authUser?.userId || "—";
  const roleName = authUser?.roleName || authUser?.role || "Kỹ thuật viên";

  const [avatarUrl, setAvatarUrl] = useState(
    authUser?.profileUrl || authUser?.avatarUrl || ""
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const url = authUser?.profileUrl || authUser?.avatarUrl || "";
    if (url) setAvatarUrl(url);
  }, [authUser?.profileUrl, authUser?.avatarUrl]);

  const [profile, setProfile] = useState({
    name: displayName,
    email: authUser?.email || "",
    phone: authUser?.phoneNumber || "",
    employeeId,
    department: authUser?.departmentName || "Maintenance",
    specialties: "",
    yearsExperience: "",
    certifications: "",
  });

  useEffect(() => {
    setProfile((p) => ({
      ...p,
      name: displayName,
      email: authUser?.email || p.email,
      phone: authUser?.phoneNumber || p.phone,
      employeeId,
      department: authUser?.departmentName || p.department,
    }));
  }, [displayName, authUser?.email, authUser?.phoneNumber, employeeId, authUser?.departmentName]);

  const [stats] = useState({
    completedRequests: 127,
    avgResponseTime: "2.3h",
    customerRating: 4.8,
    activeRequests: 5,
  });

  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    newRequestAlerts: true,
    scheduleReminders: true,
    emergencyAlerts: true,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState({ ...profile });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLogOut, setIsLogOut] = useState(false);

  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showConfirmAvatar, setShowConfirmAvatar] = useState(false);
  const [previewAvatarUri, setPreviewAvatarUri] = useState(null);
  const [showViewAvatar, setShowViewAvatar] = useState(false);

  const openAvatarMenu = () => setShowAvatarMenu(true);

  const pickAvatarFromLibrary = async () => {
    const { status: permStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permStatus !== "granted") {
      Alert.alert(
        "Quyền truy cập",
        "Ứng dụng cần quyền truy cập thư viện ảnh để đổi ảnh đại diện."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    try {
      const compressed = await compressAndResizeImage(asset.uri, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.6,
        format: "jpeg",
      });

      setPreviewAvatarUri(compressed.uri);
      setShowConfirmAvatar(true);
    } catch (e) {
      console.log("compress error:", e);
      Alert.alert("Lỗi", "Không thể xử lý ảnh, vui lòng thử lại.");
    }
  };

  const handlePressChangeAvatar = async () => {
    setShowAvatarMenu(false);
    await pickAvatarFromLibrary();
  };

  const handlePressViewAvatar = () => {
    setShowAvatarMenu(false);
    const url = authUser?.profileUrl || avatarUrl;
    if (url) setShowViewAvatar(true);
    else Alert.alert("Thông báo", "Bạn chưa có ảnh đại diện.");
  };

  const handleConfirmAvatar = async () => {
    if (!previewAvatarUri) return;

    try {
      setUploadingAvatar(true);
      await dispatch(changeProfileImage({ uri: previewAvatarUri })).unwrap();
      await dispatch(fetchProfile()).unwrap();

      setAvatarUrl(previewAvatarUri);
      setShowConfirmAvatar(false);
      setPreviewAvatarUri(null);

      Toast.show({ type: "success", text1: "Cập nhật ảnh đại diện thành công" });
    } catch (e) {
      console.log("changeProfileImage error:", e);
      Toast.show({ type: "error", text1: "Cập nhật ảnh đại diện thất bại" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    setShowConfirmAvatar(false);
    setPreviewAvatarUri(null);
  };

  const handleEditProfile = () => {
    setEditingProfile({ ...profile });
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    if (!editingProfile.name.trim() || !editingProfile.email.trim()) {
      Alert.alert("Lỗi", "Vui lòng điền vào tất cả các trường bắt buộc.");
      return;
    }

    setProfile({ ...editingProfile });
    setShowEditModal(false);
    Alert.alert("Thành công", "Cập nhật hồ sơ thành công!");
  };

  const handleChangePassword = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Alert.alert("Lỗi", "Vui lòng điền vào tất cả các trường mật khẩu.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Lỗi", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordModal(false);
    Alert.alert("Thành công", "Đổi mật khẩu thành công!");
  };

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            setIsLogOut(true);
            await dispatch(logout()).unwrap();
            await persistor.purge();
            router.replace("/(auth)/auth");
          } catch (e) {
            Alert.alert("Lỗi", "Đăng xuất không thành công. Vui lòng thử lại.");
          } finally {
            setIsLogOut(false);
          }
        },
      },
    ]);
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={openAvatarMenu} disabled={uploadingAvatar}>
          <View style={styles.profileImage}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileImageImg} />
            ) : (
              <Icon name="person.fill" size={40} color="white" />
            )}
          </View>
        </Pressable>

        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileRole}>{roleName}</Text>
        <Text style={styles.profileId}>ID: {profile.employeeId}</Text>
      </View>

      {/* <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completedRequests}</Text>
          <Text style={styles.statLabel}>Hoàn thành{"\n"}Requests</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.avgResponseTime}</Text>
          <Text style={styles.statLabel}>Thời gian phản hồi{"\n"}Trung bình</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.customerRating}</Text>
          <Text style={styles.statLabel}>Đánh giá{"\n"}Khách hàng</Text>
        </View>
        <View style={[styles.statItem, styles.statItemLast]}>
          <Text style={styles.statNumber}>{stats.activeRequests}</Text>
          <Text style={styles.statLabel}>Yêu cầu{"\n"}Đang hoạt động</Text>
        </View>
      </View> */}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <Pressable style={styles.menuItem} onPress={handleEditProfile}>
            <Icon name="person" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Xem hồ sơ</Text>
              <Text style={styles.menuItemSubtitle}>Xem thông tin cá nhân của bạn</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>

          {/* <Pressable style={styles.menuItem} onPress={() => setShowPasswordModal(true)}>
            <Icon name="lock" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Đổi Mật Khẩu</Text>
              <Text style={styles.menuItemSubtitle}>Cập nhật mật khẩu tài khoản của bạn</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable> */}
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>

          <View style={styles.menuItem}>
            <Icon name="bell" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông báo</Text>
              <Text style={styles.menuItemSubtitle}>Nhận thông báo đẩy</Text>
            </View>
            <Switch
              value={notifications.pushNotifications}
              onValueChange={() => toggleNotification("pushNotifications")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.pushNotifications ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <Icon name="envelope" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông báo Email</Text>
              <Text style={styles.menuItemSubtitle}>Nhận thông báo qua email</Text>
            </View>
            <Switch
              value={notifications.emailNotifications}
              onValueChange={() => toggleNotification("emailNotifications")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.emailNotifications ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <Icon name="list.bullet" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông báo yêu cầu mới</Text>
              <Text style={styles.menuItemSubtitle}>Nhận thông báo về các nhiệm vụ mới</Text>
            </View>
            <Switch
              value={notifications.newRequestAlerts}
              onValueChange={() => toggleNotification("newRequestAlerts")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.newRequestAlerts ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <Icon name="calendar" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông báo lịch trình</Text>
              <Text style={styles.menuItemSubtitle}>Nhận thông báo về các nhiệm vụ sắp tới</Text>
            </View>
            <Switch
              value={notifications.scheduleReminders}
              onValueChange={() => toggleNotification("scheduleReminders")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.scheduleReminders ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <Icon
              name="exclamationmark.triangle"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông báo khẩn cấp</Text>
              <Text style={styles.menuItemSubtitle}>Nhận thông báo về các yêu cầu khẩn cấp</Text>
            </View>
            <Switch
              value={notifications.emergencyAlerts}
              onValueChange={() => toggleNotification("emergencyAlerts")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.emergencyAlerts ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View> */}

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Công cụ</Text>

          <Pressable style={styles.menuItem}>
            <Icon name="calendar" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Lịch làm việc</Text>
              <Text style={styles.menuItemSubtitle}>Xem và quản lý lịch làm việc của bạn</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Icon name="chart.bar" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Báo cáo hiệu suất</Text>
              <Text style={styles.menuItemSubtitle}>Xem thống kê công việc của bạn</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Icon name="wrench" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Công cụ & Thiết bị</Text>
              <Text style={styles.menuItemSubtitle}>Quản lý kho công cụ của bạn</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>
        </View> */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/(technician)/support")}
          >
            <Icon
              name="questionmark.circle"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Trợ giúp & Hỗ trợ</Text>
              <Text style={styles.menuItemSubtitle}>Nhận trợ giúp và liên hệ với hỗ trợ</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/(technician)/support/policies")}
          >
            <Icon name="doc.text" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Điều khoản & Chính sách</Text>
              <Text style={styles.menuItemSubtitle}>Đọc điều khoản và chính sách bảo mật</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>
        </View>

        <GradientButton
          title="Đăng xuất"
          onPress={handleLogout}
          loading={isLogOut}
          from="red"
          to="orange"
          className="rounded-lg"
          style={styles.logoutButton}
        />
      </ScrollView>

      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xem thông tin cá nhân</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên đầy đủ *</Text>
              <TextInput
                style={[styles.input, { color: "#000" }]}
                value={editingProfile.name}
                editable={false}
                //onChangeText={(text) => setEditingProfile({ ...editingProfile, name: text })}
                placeholder=""
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={[styles.input, { color: "#000" }]}
                value={editingProfile.email}
                editable={false}
                //onChangeText={(text) => setEditingProfile({ ...editingProfile, email: text })}
                //placeholder="Enter your email"
                //keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={[styles.input, { color: "#000" }]}
                value={editingProfile.phone}
                editable={false}
                //onChangeText={(text) => setEditingProfile({ ...editingProfile, phone: text })}
                placeholder="Nhập số điện thoại của bạn"
                keyboardType="phone-pad"
              />
            </View>

            {/* <View style={styles.formGroup}>
              <Text style={styles.label}>Specialties</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.specialties}
                onChangeText={(text) =>
                  setEditingProfile({ ...editingProfile, specialties: text })
                }
                placeholder="Your areas of expertise"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Certifications</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingProfile.certifications}
                onChangeText={(text) =>
                  setEditingProfile({ ...editingProfile, certifications: text })
                }
                placeholder="List your certifications"
                multiline
                numberOfLines={3}
              />
            </View> */}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Thoát</Text>
              </Pressable>
              {/* <Pressable style={styles.submitButton} onPress={handleSaveProfile}>
                <Text style={styles.submitButtonText}>Lưu</Text>
              </Pressable> */}
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, currentPassword: text })
                }
                placeholder="Enter current password"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                placeholder="Enter new password"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, confirmPassword: text })
                }
                placeholder="Confirm new password"
                secureTextEntry
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitButton} onPress={handleChangePassword}>
                <Text style={styles.submitButtonText}>Change</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAvatarMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAvatarMenu(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <Pressable style={styles.backdrop} onPress={() => setShowAvatarMenu(false)} />
          <View style={styles.avatarSheet}>
            <Pressable style={styles.avatarSheetButton} onPress={handlePressChangeAvatar}>
              <Text style={styles.avatarSheetButtonText}>Đổi ảnh đại diện</Text>
            </Pressable>

            <Pressable style={styles.avatarSheetButton} onPress={handlePressViewAvatar}>
              <Text style={styles.avatarSheetButtonText}>Xem ảnh đại diện</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showConfirmAvatar}
        transparent
        animationType="fade"
        onRequestClose={handleCancelAvatar}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.avatarConfirmContent}>
            <Text style={styles.modalTitle}>Xác nhận ảnh đại diện</Text>

            {previewAvatarUri ? (
              <Image
                source={{ uri: previewAvatarUri }}
                style={styles.avatarPreviewImage}
                resizeMode="cover"
              />
            ) : null}

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={handleCancelAvatar}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={styles.submitButton}
                onPress={handleConfirmAvatar}
                disabled={uploadingAvatar}
              >
                <Text style={styles.submitButtonText}>
                  {uploadingAvatar ? "Đang lưu..." : "Dùng ảnh này"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showViewAvatar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewAvatar(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={{ flex: 1 }} onPress={() => setShowViewAvatar(false)} />
          <View style={styles.avatarViewBox}>
            {(authUser?.profileUrl || avatarUrl) ? (
              <Image
                source={{ uri: authUser?.profileUrl || avatarUrl }}
                style={styles.avatarViewImage}
                resizeMode="contain"
              />
            ) : (
              <Text style={{ color: "#fff" }}>Chưa có ảnh đại diện</Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
