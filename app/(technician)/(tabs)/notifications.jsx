// app/(technician)/(tabs)/notifications.jsx
import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchMyNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  broadcastNotification,
  selectNotifications,
  selectNotificationsPaging,
} from '@/src/features/notifications/notificationsSlice';

export default function TechnicianNotificationsScreen() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const { page, totalPages, refreshing, loadingMore } = useAppSelector(
    selectNotificationsPaging
  );
  const user = useAppSelector((s) => s.auth.user);

  const [broadcastVisible, setBroadcastVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('Internal'); // Internal / General

  const canBroadcast =
    user?.role === 'Manager' || user?.role === 'TechnicianLead';

  useEffect(() => {
    dispatch(fetchMyNotifications({ page: 1, size: 20 }));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchMyNotifications({ page: 1, size: 20 }));
    dispatch(fetchUnreadCount());
  }, [dispatch]);

  const loadMore = () => {
    if (loadingMore) return;
    if (page >= totalPages) return;
    dispatch(fetchMyNotifications({ page: page + 1, size: 20 }));
  };

  const onPressItem = async (item) => {
    if (!item.isRead) {
      try {
        await dispatch(markNotificationsRead([item.notificationId])).unwrap();
      } catch (e) {
        console.log('markNotificationsRead error', e);
      }
    }
  };

  const onSendBroadcast = async () => {
    if (!title.trim() || !desc.trim()) return;
    try {
      await dispatch(
        broadcastNotification({
          title: title.trim(),
          description: desc.trim(),
          type,
        })
      ).unwrap();
      setBroadcastVisible(false);
      setTitle('');
      setDesc('');
      // Sau khi gửi có thể refresh list nếu muốn
      dispatch(fetchMyNotifications({ page: 1, size: 20 }));
    } catch (e) {
      console.log('broadcastNotification error', e);
    }
  };

  const renderItem = ({ item }) => (
    <Pressable style={styles.row} onPress={() => onPressItem(item)}>
      <View style={[styles.dot, !item.isRead ? styles.dotUnread : null]} />
      <View style={{ flex: 1 }}>
        <Text
          style={[styles.title, !item.isRead ? styles.titleUnread : null]}
          numberOfLines={1}
        >
          {item.title || 'Thông báo'}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {item.description || ''}
        </Text>
        <Text style={styles.meta}>
          {item.createdAt?.slice(0, 16) || ''}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {canBroadcast && (
        <View style={styles.topBar}>
          <Pressable
            style={styles.broadcastBtn}
            onPress={() => setBroadcastVisible(true)}
          >
            <Text style={styles.broadcastText}>Gửi thông báo</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.notificationId)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReachedThreshold={0.15}
        onEndReached={loadMore}
        ListFooterComponent={
          loadingMore ? (
            <Text style={styles.loadingMore}>Đang tải thêm…</Text>
          ) : null
        }
        ListEmptyComponent={
          !refreshing ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingVertical: 8 }}
      />

      {/* Modal broadcast */}
      <Modal
        visible={broadcastVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBroadcastVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Gửi thông báo</Text>

            <TextInput
              style={styles.input}
              placeholder="Tiêu đề"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Nội dung"
              value={desc}
              onChangeText={setDesc}
              multiline
            />

            <View style={styles.typeRow}>
              <Pressable
                style={[
                  styles.typeChip,
                  type === 'General' && styles.typeChipActive,
                ]}
                onPress={() => setType('General')}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    type === 'General' && styles.typeChipTextActive,
                  ]}
                >
                  General (tất cả)
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.typeChip,
                  type === 'Internal' && styles.typeChipActive,
                ]}
                onPress={() => setType('Internal')}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    type === 'Internal' && styles.typeChipTextActive,
                  ]}
                >
                  Internal (nội bộ)
                </Text>
              </Pressable>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => setBroadcastVisible(false)}
              >
                <Text style={styles.modalBtnTextCancel}>Hủy</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnOk]}
                onPress={onSendBroadcast}
              >
                <Text style={styles.modalBtnTextOk}>Gửi</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  broadcastBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#0b5345',
  },
  broadcastText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'flex-start',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
    backgroundColor: '#e5e7eb',
  },
  dotUnread: {
    backgroundColor: '#0b5345',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  titleUnread: {
    fontWeight: '700',
  },
  desc: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  sep: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 28,
  },
  loadingMore: {
    textAlign: 'center',
    paddingVertical: 8,
    color: '#9ca3af',
    fontSize: 12,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 14,
  },

  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBox: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    color: '#111827',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 8,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: '#0b5345',
    borderColor: '#0b5345',
  },
  typeChipText: {
    fontSize: 12,
    color: '#4b5563',
  },
  typeChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modalBtnCancel: {
    backgroundColor: '#e5e7eb',
  },
  modalBtnOk: {
    backgroundColor: '#0b5345',
  },
  modalBtnTextCancel: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '500',
  },
  modalBtnTextOk: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
