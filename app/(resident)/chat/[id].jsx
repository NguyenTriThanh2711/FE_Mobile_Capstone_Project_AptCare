import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import {
  getConversation, fetchMessages, selectConversationBox,
  sendTextMessage, sendFileMessage, markDelivered, markRead,
} from '@/src/features/chat/chatSlice';
import { joinConversation, leaveConversation } from '@/src/services/realtime';



export default function ConversationDetail() {
  const { id } = useLocalSearchParams(); // as string
  const conversationId = parseInt(id, 10);
  const dispatch = useAppDispatch();
  const box = useAppSelector(selectConversationBox(conversationId));
  const listRef = useRef(null);
  const [text, setText] = useState('');

  useEffect(() => {
    joinConversation(conversationId);
    dispatch(getConversation(conversationId));
    dispatch(fetchMessages({ conversationId, pageSize: 20 }));
    
    dispatch(markDelivered(conversationId));
    dispatch(markRead(conversationId));
    return () => { leaveConversation(conversationId); };
  }, [dispatch, conversationId]);

  const loadMore = () => {
    if (!box?.canLoadMore || box?.loading) return;
    const before = box?.oldestCursor;
    if (!before) return;
    dispatch(fetchMessages({ conversationId, before, pageSize: 20 }));
  };

  const onSend = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    await dispatch(sendTextMessage({ conversationId, content }));
    // scroll xuống cuối
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  };

  // const onAttach = async () => {
  //   const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
  //   if (r?.assets?.[0]) {
  //     const file = r.assets[0];
  //     await dispatch(sendFileMessage({ conversationId, file }));
  //   }
  // };

  const TitleBar = () => {
    const title =
      box?.info?.title ||
      (box?.info?.participants || [])
        .map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim())
        .join(', ');
    return (
      <View style={[styles.header]}>
        <Pressable onPress={() => router.back()} style={styles.hBtn}><Icon name="chevron.left" size={22} color="#0b5343" /></Pressable>
        <Text numberOfLines={1} style={styles.hTitle}>{title || 'Cuộc trò chuyện'}</Text>
        <View style={styles.hRight} />
      </View>
    );
  };

  const renderMessage = ({ item }) => {
    const mine = !!item.isMine;
    const isFile = (item.type || '').toLowerCase() !== 'text' && item.content?.startsWith('http');
    return (
      <View style={[styles.bubbleRow, mine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          {isFile ? (
            <Text style={[styles.msgText, mine ? { color: '#fff' } : {}]}>
              📎 Tệp: {item.content}
            </Text>
          ) : (
            <Text style={[styles.msgText, mine ? { color: '#fff' } : {}]}>{item.content}</Text>
          )}
          <Text style={[styles.time, mine ? { color: '#d7e8ff' } : { color: '#6b7280' }]}>
            {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8faf9' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <TitleBar />

      <FlatList
        ref={listRef}
        data={box?.messages || []}
        keyExtractor={(m) => String(m.messageId)}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 14, paddingBottom: 10 }}
        onEndReachedThreshold={0.3}
        onEndReached={loadMore} // kéo lên đầu -> load older (vì newest-last)
      />

      <View style={styles.composer}>
        {/* <Pressable onPress={onAttach} style={styles.cBtn}><Icon name="paperclip" size={20} color="#007AFF" /></Pressable> */}
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn…"
          returnKeyType="send"
          onSubmitEditing={onSend}
        />
        <Pressable onPress={onSend} style={styles.sendBtn}>
          <Icon name="paperplane" size={20} color="#fff" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingTop: 44,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2f2',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hBtn: { padding: 6 },
  hTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#0b5343' },
  hRight: { width: 28 },

  bubbleRow: { flexDirection: 'row', marginBottom: 8 },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  bubbleMine: { backgroundColor: '#007AFF', borderTopRightRadius: 4 },
  bubbleOther: { backgroundColor: '#e7f0ff', borderTopLeftRadius: 4 },
  msgText: { fontSize: 15, color: '#111827' },
  time: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eef2f2',
  },
  cBtn: { padding: 8 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff',
  },
  sendBtn: { backgroundColor: '#007AFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
});
