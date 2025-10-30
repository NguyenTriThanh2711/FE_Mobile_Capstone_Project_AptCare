import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchMyConversations,
  selectConversations,
  selectUnreadByConv,
  selectHasAnyUnread,
  selectConversationsLoading,
} from '@/src/features/chat/chatSlice';
import { router, useNavigation } from 'expo-router';
import { Icon } from '@/src/components/Icon.native';
import { pretty } from '@/src/helper/prettyLog';

export default function TechnicianChatList() {
  const dispatch = useAppDispatch();
  const nav = useNavigation();
  const convs = useAppSelector(selectConversations);
  const loading = useAppSelector(selectConversationsLoading);
  const unreadMap = useAppSelector(selectUnreadByConv);
  const hasAnyUnread = useAppSelector(selectHasAnyUnread);

  // đặt “dấu chấm đỏ” ở icon Tab nếu còn unread
  useEffect(() => {
    nav.setOptions({
      tabBarBadge: hasAnyUnread ? ' ' : undefined, // để hiện chấm đỏ nhỏ
      tabBarBadgeStyle: { backgroundColor: '#FF3B30' },
    });
  }, [hasAnyUnread, nav]);

  useEffect(() => {
    dispatch(fetchMyConversations());
  }, [dispatch]);
  // console.log('conversation list of this technician', pretty(convs));

  const renderItem = ({ item }) => {
    const unread = unreadMap[item.conversationId] || 0;
    const title =
      item.title ||
      (item.participants || [])
        .map((p) => `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim())
        .join(', ');
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/(technician)/chat/[id]',
            params: { id: String(item?.conversationId), title: title },
          })
        }
        style={styles.row}>
        <View style={styles.avatar}>
          <Icon name="chat.fill" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>
            {title || 'Cuộc trò chuyện'}
          </Text>
          {/* <Text style={styles.sub} numberOfLines={1}>{item.lastMessage || 'Bắt đầu trò chuyện…'}</Text> */}
        </View>
        {unread > 0 ? <View style={styles.dot} /> : null}
        <Icon name="chevron.right" size={16} color="#C7C7CC" />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Tin nhắn</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 12 }} /> : null}
      {convs.length !== 0 && !loading ? (
        <FlatList
          data={convs}
          keyExtractor={(it) => String(it.conversationId)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          refreshing={loading}
          onRefresh={() => dispatch(fetchMyConversations())}
        />
      ) : (
        <Text style={{ marginTop: 12, textAlign: 'center', color: '#6B7280' }}>
          Chưa có cuộc trò chuyện nào. Hãy bắt đầu một cuộc trò chuyện mới!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 8,
    paddingHorizontal: 16,
    color: '#111827',
  },
  headerSegment: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 12 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#EDF2F7',
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: '#0b5345' },
  segmentText: { color: '#1f2937', fontWeight: '700' },
  segmentTextActive: { color: '#fff' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0b5345',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF3B30', marginHorizontal: 10 },
});
