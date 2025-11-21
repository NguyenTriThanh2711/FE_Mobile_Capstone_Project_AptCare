import React, { useEffect } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchMyConversations,
  selectConversations,
  selectUnreadByConv,
} from '@/src/features/chat/chatSlice';
import { router } from 'expo-router';

export default function ResidentChatList() {
  const dispatch = useAppDispatch();
  const conversations = useAppSelector(selectConversations);
  const unreadByConv = useAppSelector(selectUnreadByConv);

  useEffect(() => {
    dispatch(fetchMyConversations());
  }, [dispatch]);

  const renderItem = ({ item }) => {
    const cid = item.conversationId;
    const unread = unreadByConv[cid] || 0;

    const participants = item.participants?.$values || item.participants || [];
    const title =
      item.title ||
      participants
        .map((p) => `${p.firstName || ''} ${p.lastName || ''}`.trim())
        .filter(Boolean)
        .join(', ') ||
      `#${cid}`;

    const initials =
      String(title)
        .split(' ')
        .slice(-2)
        .map((x) => x[0])
        .join('')
        .toUpperCase() || 'U';

    return (
      <Pressable
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: '/chat/[id]',
            params: { id: cid, title },
          })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread}</Text>
              </View>
            )}
          </View>
          <Text numberOfLines={1} style={styles.lastMessage}>
            {item.lastMessage || 'Chưa có tin nhắn'}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => String(item.conversationId)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontWeight: '700',
    color: '#374151',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    marginLeft: 8,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0b5345',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  lastMessage: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  sep: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 62,
  },
});
