import GradientButton from '@/src/components/common/GradientButton';
import { Icon } from '@/src/components/Icon.native';
import { logout } from '@/src/features/auth/authSlice';
import { persistor } from '@/src/store';
import { router } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';
import { useDispatch } from 'react-redux';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  profileId: {
    fontSize: 14,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  statItemLast: {
    borderRightWidth: 0,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemIcon: {
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  menuItemArrow: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutButton: {
    margin: 20,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function TechnicianProfile() {
  const dispatch = useDispatch();
  const [profile, setProfile] = useState({
    name: 'Mike Johnson',
    email: 'mike.johnson@aptcare.com',
    phone: '+1 (555) 234-5678',
    employeeId: 'TECH-001',
    department: 'Maintenance',
    specialties: 'Plumbing, HVAC, Electrical',
    yearsExperience: '8 years',
    certifications: 'EPA 608, OSHA 10, Electrical License',
  });

  const [stats] = useState({
    completedRequests: 127,
    avgResponseTime: '2.3h',
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
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLogOut, setIsLogOut] = useState(false);
  const handleEditProfile = () => {
    setEditingProfile({ ...profile });
    setShowEditModal(true);
  };

  const handleSaveProfile = () => {
    if (!editingProfile.name.trim() || !editingProfile.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng điền vào tất cả các trường bắt buộc.');
      return;
    }

    setProfile({ ...editingProfile });
    setShowEditModal(false);
    Alert.alert('Thành công', 'Cập nhật hồ sơ thành công!');
  };

  const handleChangePassword = () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      Alert.alert('Lỗi', 'Vui lòng điền vào tất cả các trường mật khẩu.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu mới không khớp.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    // Simulate password change
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordModal(false);
    Alert.alert('Thành công', 'Đổi mật khẩu thành công!');
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            setIsLogOut(true);
            await dispatch(logout()).unwrap();
            await persistor.purge();
            router.replace('/(auth)/login');
          } catch (e) {
            Alert.alert('Lỗi', 'Đăng xuất không thành công. Vui lòng thử lại.');
          } finally {
            setIsLogOut(false);
          }
        },
      },
    ]);
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
          <Icon name="person.fill" size={40} color="white" />
        </View>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileRole}>Kỹ thuật viên điện</Text>
        <Text style={styles.profileId}>ID: {profile.employeeId}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completedRequests}</Text>
          <Text style={styles.statLabel}>Hoàn thành{'\n'}Requests</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.avgResponseTime}</Text>
          <Text style={styles.statLabel}>Thời gian phản hồi{'\n'}Trung bình</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.customerRating}</Text>
          <Text style={styles.statLabel}>Đánh giá{'\n'}Khách hàng</Text>
        </View>
        <View style={[styles.statItem, styles.statItemLast]}>
          <Text style={styles.statNumber}>{stats.activeRequests}</Text>
          <Text style={styles.statLabel}>Yêu cầu{'\n'}Đang hoạt động</Text>
        </View>
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
              <Text style={styles.menuItemTitle}>Đổi Mật Khẩu</Text>
              <Text style={styles.menuItemSubtitle}>Cập nhật mật khẩu tài khoản của bạn</Text>
            </View>
            <Icon name="chevron.right" size={16} color="#ccc" style={styles.menuItemArrow} />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Icon name="doc.text" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Chứng chỉ</Text>
              <Text style={styles.menuItemSubtitle}>{profile.certifications}</Text>
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
              <Text style={styles.menuItemSubtitle}>Nhận thông báo đẩy</Text>
            </View>
            <Switch
              value={notifications.pushNotifications}
              onValueChange={() => toggleNotification('pushNotifications')}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={notifications.pushNotifications ? '#fff' : '#f4f3f4'}
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
              onValueChange={() => toggleNotification('emailNotifications')}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={notifications.emailNotifications ? '#fff' : '#f4f3f4'}
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
              onValueChange={() => toggleNotification('newRequestAlerts')}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={notifications.newRequestAlerts ? '#fff' : '#f4f3f4'}
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
              onValueChange={() => toggleNotification('scheduleReminders')}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={notifications.scheduleReminders ? '#fff' : '#f4f3f4'}
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
              onValueChange={() => toggleNotification('emergencyAlerts')}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={notifications.emergencyAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.section}>
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
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>

          <Pressable style={styles.menuItem}>
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

          <Pressable style={styles.menuItem}>
            <Icon name="doc.text" size={24} color="#007AFF" style={styles.menuItemIcon} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Điều khoản & Chính sách</Text>
              <Text style={styles.menuItemSubtitle}>
                Đọc điều khoản và chính sách bảo mật của chúng tôi
              </Text>
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.name}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, name: text })}
                placeholder="Enter your full name"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.email}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.phone}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Specialties</Text>
              <TextInput
                style={styles.input}
                value={editingProfile.specialties}
                onChangeText={(text) => setEditingProfile({ ...editingProfile, specialties: text })}
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
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowEditModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitButton} onPress={handleSaveProfile}>
                <Text style={styles.submitButtonText}>Save</Text>
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
        onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Current Password *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                placeholder="Enter current password"
                secureTextEntry={true}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>New Password *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                placeholder="Enter new password"
                secureTextEntry={true}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm New Password *</Text>
              <TextInput
                style={styles.input}
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                placeholder="Confirm new password"
                secureTextEntry={true}
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
    </View>
  );
}
