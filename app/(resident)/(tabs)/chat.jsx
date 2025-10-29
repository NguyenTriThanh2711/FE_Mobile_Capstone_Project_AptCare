import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, RefreshControl, Image } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import {
  fetchMyConversations,
  selectConversations,
  selectConversationsLoading,
  muteConversation, unmuteConversation,
} from '@/src/features/chat/chatSlice';
import { router } from 'expo-router';
import { pretty } from '@/src/helper/prettyLog';
import { toArray } from '@/src/helper/array';

export default function ResidentChat() {
  const dispatch = useAppDispatch();
  const list = useAppSelector(selectConversations);
  const loading = useAppSelector(selectConversationsLoading);

  useEffect(() => { dispatch(fetchMyConversations()); }, [dispatch]);
  console.log('lisst message', pretty(list));
  const onOpen = (c) => {
    router.push({ pathname: '/(resident)/chat/[id]', params: { id: String(c.conversationId) } });
  };


  const renderRow = ({ item }) => {
    const last = item?.lastMessage || '';
    const names = toArray(item?.participants || [])
      .map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim())
      .join(', ');
    const title = item.title || names || 'Cuộc trò chuyện';

    return (
      <Pressable onPress={() => onOpen(item)} style={styles.row}>
        <View style={styles.avatar}>
          <Icon name="chat.fill" size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.rowTitle}>{title}</Text>
          <Text numberOfLines={1} style={styles.rowSub}>{last} + {}</Text>
        </View>
        <Pressable
          onPress={() => (item.isMuted ? dispatch(unmuteConversation(item.conversationId)) : dispatch(muteConversation(item.conversationId)))}
          style={styles.rowRightBtn}
        >
          <Icon name={item.isMuted ? 'bell' : 'bell'} size={18} color={item.isMuted ? '#aaa' : '#007AFF'} />
        </Pressable>
      </Pressable>
    );
  };
  return (
    <View style={styles.container}>
        <FlatList
          data={list}
          keyExtractor={(it) => String(it.conversationId)}
          renderItem={renderRow}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={!!loading} onRefresh={() => dispatch(fetchMyConversations())} />
          }
        />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  top: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', color: '#0b1b14', marginBottom: 10 },
  segment: { flexDirection: 'row', backgroundColor: '#e7f0ec', padding: 4, borderRadius: 12, width: 260 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  segBtnActive: { backgroundColor: '#0b5343' },
  segText: { color: '#0b5343', fontWeight: '700' },
  segTextActive: { color: '#fff' },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f0f2f2' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0b5343', alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  rowSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  rowRightBtn: { padding: 6 },

  fab: { position: 'absolute', right: 18, bottom: 24, backgroundColor: '#007AFF', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 3 }
});
