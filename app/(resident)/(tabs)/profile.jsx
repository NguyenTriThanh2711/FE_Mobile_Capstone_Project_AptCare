import { Icon } from "@/src/components/Icon.native";
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
  Switch,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, logout, setUser } from "@/src/features/auth/authSlice";
import { useRouter } from "expo-router";
import { persistor } from "@/src/store";
import { getRoomsLabel } from "@/src/helper/room-labels-profile";
import GradientButton from "@/src/components/common/GradientButton";

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
});

export default function ResidentProfile() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, status, error } = useSelector((s) => ({
    user: s.auth.user,
    status: s.auth.status,
    error:  s.auth.error,
  }));//mocked // cứ để vậy, để sau này còn xài lazy
  React.useEffect(() => {
   if (!user) dispatch(fetchProfile());
  }, [user, dispatch]);
  

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
    name: "", email: "", phone: "", emergencyContact: "", apartment: "", building: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const openEditFromUser = () => {
    const mapped = {
      name: user?.FullName ?? user?.name ?? "",
      email: user?.Email ?? user?.email ?? "",
      phone: user?.Phone ?? user?.phone ?? "",
      emergencyContact: user?.EmergencyContact ?? user?.emergencyContact ?? "",
      apartment: user?.Apartment ?? user?.apartment ?? "",//mocked
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
    // chưa có API update → cập nhật tạm vào Redux để UI phản ánh ngay
    const merged = {
      ...user,
      FullName: editingProfile.name,
      Email: editingProfile.email,
      Phone: editingProfile.phone,
      EmergencyContact: editingProfile.emergencyContact,
      Apartment: editingProfile.apartment, //mocked
      Building: editingProfile.building,
    };
    dispatch(setUser(merged));
    setShowEditModal(false);
    // dispatch(updateProfile(payload)).unwrap()//khi có API /me //mocked
    Alert.alert("Thành công", "Thông tin cá nhân đã được cập nhật!");
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
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

    // Simulate password change
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setShowPasswordModal(false);
    Alert.alert("Thành công", "Mật khẩu đã được thay đổi thành công!");
  };

  const handleLogout = () => {
    Alert.alert(
        "Đăng xuất",
        "Bạn có chắc chắn muốn đăng xuất không?",
        [
        { text: "Hủy", style: "cancel" },
        {
            text: "Đăng xuất",
            style: "destructive",
            onPress: async () => {
            try {
                await dispatch(logout()).unwrap();
                await persistor.purge();
                router.replace("/(auth)/login");
            } catch (e) {
                Alert.alert("Lỗi", "Đăng xuất không thành công. Vui lòng thử lại.");
            }
            },
        },
        ]
    );
  };

  const toggleNotification = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileImage}>
          {/* <Icon name="person.fill" size={40} color="white" /> */}
          <Image alt="profile" source={require('@/assets/profile.png')} style={{ width: 80, height: 80, borderRadius: 40 }} />
        </View>
        <Text style={styles.profileName}>{(user?.firstName ?? '') + ' ' + (user?.lastName ?? '')?? "Unknown User"}</Text>
        <Text style={styles.profileApartment}>Căn hộ {getRoomsLabel(user)}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          
          <Pressable style={styles.menuItem} onPress={handleEditProfile}>
            <Icon name="person" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Chỉnh sửa hồ sơ</Text>
              <Text style={styles.menuItemSubtitle}>Cập nhật thông tin cá nhân của bạn</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => setShowPasswordModal(true)}>
            <Icon name="lock" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Đổi mật khẩu</Text>
              <Text style={styles.menuItemSubtitle}>Cập nhật mật khẩu tài khoản của bạn</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông báo</Text>
          
          <View style={styles.menuItem}>
            <Icon name="bell" size={24} color="#007AFF" style={styles.menuItemIcon} />
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
            <Icon name="envelope" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Thông báo qua Email</Text>
              <Text style={styles.menuItemSubtitle}>Nhận cập nhật qua email</Text>
            </View>
            <Switch
              value={notifications.emailNotifications}
              onValueChange={() => toggleNotification("emailNotifications")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.emailNotifications ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <Icon name="wrench" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Maintenance Updates</Text>
              <Text style={styles.menuItemSubtitle}>Get notified about request updates</Text>
            </View>
            <Switch
              value={notifications.maintenanceUpdates}
              onValueChange={() => toggleNotification("maintenanceUpdates")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.maintenanceUpdates ? "#fff" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <Icon name="creditcard" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Nhắc nhở thanh toán</Text>
              <Text style={styles.menuItemSubtitle}>Nhận nhắc nhở về các khoản thanh toán đến hạn</Text>
            </View>
            <Switch
              value={notifications.paymentReminders}
              onValueChange={() => toggleNotification("paymentReminders")}
              trackColor={{ false: "#767577", true: "#007AFF" }}
              thumbColor={notifications.paymentReminders ? "#fff" : "#f4f3f4"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ Trợ</Text>
          
          <Pressable style={styles.menuItem}>
            <Icon name="questionmark.circle" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Trợ Giúp & Hỗ Trợ</Text>
              <Text style={styles.menuItemSubtitle}>Nhận trợ giúp và liên hệ hỗ trợ</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Icon name="doc.text" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Điều Khoản & Chính Sách Bảo Mật</Text>
              <Text style={styles.menuItemSubtitle}>Đọc điều khoản và chính sách bảo mật của chúng tôi</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>
        </View>

        <GradientButton
          title="Đăng xuất"
          onPress={handleLogout}
          from="red"
          to="orange"
          className="rounded-lg"
          style={styles.logoutButton}
        />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chỉnh sửa hồ sơ</Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Họ và Tên *</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.name}
                onChangeText={(text) =>
                  setEditingProfile({ ...editingProfile, name: text })
                }
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.email}
                onChangeText={(text) =>
                  setEditingProfile({ ...editingProfile, email: text })
                }
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Số Điện Thoại</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.phone}
                onChangeText={(text) =>
                  setEditingProfile({ ...editingProfile, phone: text })
                }
                placeholder="Nhập số điện thoại"
                keyboardType="phone-pad"
              />
            </View>

            {/* <View style={styles.formGroup}>
              <Text style={styles.label}>Người Liên Hệ Khẩn Cấp</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.emergencyContact}
                onChangeText={(text) =>
                  setEditingProfile({ ...editingProfile, emergencyContact: text })
                }
                placeholder="Tên và số điện thoại"
              />
            </View> */}

            <View style={styles.modalActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </Pressable>
              <Pressable
                style={styles.submitButton}
                onPress={handleSaveProfile}
              >
                <Text style={styles.submitButtonText}>Lưu</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
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
                secureTextEntry={true}
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
                secureTextEntry={true}
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
                secureTextEntry={true}
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
    </View>
  );
}