// app/(resident)/(tabs)/notifications.jsx
import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchMyNotifications,
  fetchUnreadCount,
  markNotificationsRead,
  selectNotifications,
  selectNotificationsPaging,
} from '@/src/features/notifications/notificationsSlice';

export default function ResidentNotificationsScreen() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const { page, totalPages, refreshing, loadingMore } = useAppSelector(
    selectNotificationsPaging
  );

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
    // sau này nếu có "chi tiết" thì navigate ở đây
  };

  const renderItem = ({ item }) => {
    return (
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
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
});
