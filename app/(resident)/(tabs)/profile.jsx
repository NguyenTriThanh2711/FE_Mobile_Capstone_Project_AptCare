import { Icon } from "@/src/components/Icon.native";
import React, { useMemo, useState } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProfile,
  logout,
  setUser,
  changeProfileImage,
} from "@/src/features/auth/authSlice";
import { useRouter } from "expo-router";
import { persistor } from "@/src/store";
import { getRoomsLabel } from "@/src/helper/room-labels-profile";
import GradientButton from "@/src/components/common/GradientButton";
import * as ImagePicker from "expo-image-picker";
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
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  profileApartment: {
    fontSize: 16,
    color: "#666",
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
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoutButton: {
    margin: 20,
  },
  logoutButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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

export default function ResidentProfile() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, status, error } = useSelector((s) => ({
    user: s.auth.user,
    status: s.auth.status,
    error: s.auth.error,
  }));
  const displayName = useMemo(() => {
      const v1 = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
      return v1 || user?.fullName || user?.userName || "Kỹ thuật viên";
    }, [user?.firstName, user?.lastName, user?.fullName, user?.userName]);
  console.log('[user]', user?.profileUrl);
  React.useEffect(() => {
    if (!user) dispatch(fetchProfile());
  }, [user, dispatch]);

  const [isLogOut, setIsLogOut] = useState(false);
  const [notifications, setNotifications] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceUpdates: true,
    paymentReminders: true,
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState({
    name: "",
    email: "",
    phone: "",
    emergencyContact: "",
    apartment: "",
    building: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showConfirmAvatar, setShowConfirmAvatar] = useState(false);
  const [previewAvatarUri, setPreviewAvatarUri] = useState(null);
  const [showViewAvatar, setShowViewAvatar] = useState(false);

  const openEditFromUser = () => {
    const mapped = {
      name: displayName ?? "",
      email: user?.Email ?? user?.email ?? "",
      phone: user?.phoneNumber ?? "",
      emergencyContact: user?.EmergencyContact ?? user?.emergencyContact ?? "",
      apartment: user?.Apartment ?? user?.apartment ?? "",
      building: user?.Building ?? user?.building ?? "",
    };
    setEditingProfile(mapped);
  };

  const handleEditProfile = () => {
    openEditFromUser();
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    if (!editingProfile.name.trim() || !editingProfile.email.trim()) {
      Alert.alert("Lỗi ", "Vui lòng điền đầy đủ thông tin bắt buộc.");
      return;
    }

    const merged = {
      ...user,
      FullName: editingProfile.name,
      Email: editingProfile.email,
      Phone: editingProfile.phone,
      EmergencyContact: editingProfile.emergencyContact,
      Apartment: editingProfile.apartment,
      Building: editingProfile.building,
    };
    dispatch(setUser(merged));
    setShowEditModal(false);
    Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật!");
  };

  const handleChangePassword = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin mật khẩu.");
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
    Alert.alert("Thành công", "Mật khẩu đã được thay đổi thành công!");
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
          }
        },
      },
    ]);
  };

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

  const toggleNotification = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  const openAvatarMenu = () => {
    setShowAvatarMenu(true);
  };

  const handlePressChangeAvatar = async () => {
    setShowAvatarMenu(false);
    await pickAvatarFromLibrary();
  };

  const handlePressViewAvatar = () => {
    setShowAvatarMenu(false);
    if (user?.profileUrl) {
      setShowViewAvatar(true);
    } else {
      Alert.alert("Thông báo", "Bạn chưa có ảnh đại diện.");
    }
  };

  const handleConfirmAvatar = async () => {
    if (!previewAvatarUri) return;

    try {
      setUploadingAvatar(true);
      await dispatch(changeProfileImage({ uri: previewAvatarUri })).unwrap();
      dispatch(fetchProfile());
      setShowConfirmAvatar(false);
      setPreviewAvatarUri(null);
    } catch (e) {
      console.log("changeProfileImage error:", e);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatar = () => {
    setShowConfirmAvatar(false);
    setPreviewAvatarUri(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={openAvatarMenu} disabled={uploadingAvatar}>
          <View style={styles.profileImage}>
            {user?.profileUrl ? (
              <Image
                alt="profile"
                source={{ uri: user.profileUrl }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
            ) : (
              <Icon name="person.fill" size={40} color="white" />
            )}
          </View>
        </Pressable>

        <Text style={styles.profileName}>
          {((user?.firstName ?? "") + " " + (user?.lastName ?? "")) ||
            "Unknown User"}
        </Text>
        <Text style={styles.profileApartment}>
          Căn hộ {getRoomsLabel(user)}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <Pressable style={styles.menuItem} onPress={handleEditProfile}>
            <Icon
              name="person"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Xem hồ sơ</Text>
              <Text style={styles.menuItemSubtitle}>
                Xem thông tin cá nhân của bạn
              </Text>
            </View>
            <Icon
              name="chevron.right"
              size={16}
              color="#ccc"
              style={styles.menuItemArrow}
            />
          </Pressable>

          {/* <Pressable
            style={styles.menuItem}
            onPress={() => setShowPasswordModal(true)}
          >
            <Icon
              name="lock"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Đổi mật khẩu</Text>
              <Text style={styles.menuItemSubtitle}>
                Cập nhật mật khẩu tài khoản của bạn
              </Text>
            </View>
            <Icon
              name="chevron.right"
              size={16}
              color="#ccc"
              style={styles.menuItemArrow}
            />
          </Pressable> */}
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>

          <View style={styles.menuItem}>
            <Icon
              name="bell"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông báo </Text>
              <Text style={styles.menuItemSubtitle}>Nhận thông báo </Text>
            </View>
            <Switch
              value={notifications.pushNotifications}
              onValueChange={() => toggleNotification("pushNotifications")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.pushNotifications ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <Icon
              name="envelope"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông báo qua Email</Text>
              <Text style={styles.menuItemSubtitle}>
                Nhận cập nhật qua email
              </Text>
            </View>
            <Switch
              value={notifications.emailNotifications}
              onValueChange={() => toggleNotification("emailNotifications")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={
                notifications.emailNotifications ? "#fff" : "#f4f3f4"
              }
            />
          </View>

          <View style={styles.menuItem}>
            <Icon
              name="wrench"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Maintenance Updates</Text>
              <Text style={styles.menuItemSubtitle}>
                Get notified about request updates
              </Text>
            </View>
            <Switch
              value={notifications.maintenanceUpdates}
              onValueChange={() => toggleNotification("maintenanceUpdates")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={
                notifications.maintenanceUpdates ? "#fff" : "#f4f3f4"
              }
            />
          </View>

          <View style={styles.menuItem}>
            <Icon
              name="creditcard"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Nhắc nhở thanh toán</Text>
              <Text style={styles.menuItemSubtitle}>
                Nhận nhắc nhở về các khoản thanh toán đến hạn
              </Text>
            </View>
            <Switch
              value={notifications.paymentReminders}
              onValueChange={() => toggleNotification("paymentReminders")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={
                notifications.paymentReminders ? "#fff" : "#f4f3f4"
              }
            />
          </View>
        </View> */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ Trợ</Text>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/(resident)/support")}
          >
            <Icon
              name="questionmark.circle"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Trợ Giúp & Hỗ Trợ</Text>
              <Text style={styles.menuItemSubtitle}>
                Nhận trợ giúp và liên hệ hỗ trợ
              </Text>
            </View>
            <Icon
              name="chevron.right"
              size={16}
              color="#ccc"
              style={styles.menuItemArrow}
            />
          </Pressable>

          <Pressable
            style={styles.menuItem}
            onPress={() => router.push("/(resident)/support/policies")}
          >
            <Icon
              name="doc.text"
              size={24}
              color="#007AFF"
              style={styles.menuItemIcon}
            />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>
                Điều Khoản & Chính Sách Bảo Mật
              </Text>
              <Text style={styles.menuItemSubtitle}>
                Đọc điều khoản và chính sách bảo mật của chúng tôi
              </Text>
            </View>
            <Icon
              name="chevron.right"
              size={16}
              color="#ccc"
              style={styles.menuItemArrow}
            />
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
                style={styles.input}
                value={editingProfile.name}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.email}
                editable={false}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Số Điện Thoại</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.phone}
                editable={false}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
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
            <Text style={styles.modalTitle}>Đổi Mật Khẩu</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mật Khẩu Hiện Tại *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, currentPassword: text })
                }
                placeholder="Nhập mật khẩu hiện tại"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mật Khẩu Mới *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, newPassword: text })
                }
                placeholder="Nhập mật khẩu mới"
                secureTextEntry
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Xác Nhận Mật Khẩu Mới *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) =>
                  setPasswordData({ ...passwordData, confirmPassword: text })
                }
                placeholder="Xác nhận mật khẩu mới"
                secureTextEntry
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowPasswordModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={styles.submitButton}
                onPress={handleChangePassword}
              >
                <Text style={styles.submitButtonText}>Đổi</Text>
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
          <Pressable
            style={styles.backdrop}
            onPress={() => setShowAvatarMenu(false)}
          />
          <View style={styles.avatarSheet}>
            <Pressable
              style={styles.avatarSheetButton}
              onPress={handlePressChangeAvatar}
            >
              <Text style={styles.avatarSheetButtonText}>
                Đổi ảnh đại diện
              </Text>
            </Pressable>

            <Pressable
              style={styles.avatarSheetButton}
              onPress={handlePressViewAvatar}
            >
              <Text style={styles.avatarSheetButtonText}>
                Xem ảnh đại diện
              </Text>
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
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setShowViewAvatar(false)}
          />
          <View style={styles.avatarViewBox}>
            {user?.profileUrl ? (
              <Image
                source={{ uri: user.profileUrl }}
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
