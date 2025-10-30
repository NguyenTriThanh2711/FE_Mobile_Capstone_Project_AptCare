import React, { useMemo } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import { sendTextMessage, sendFileMessage } from '@/src/features/chat/chatSlice';
import MessageItem from '@/src/components/MessageItem';
import ChatComposer from '@/src/components/ChatComposer';
import useConversation from '@/src/hooks/useConversation';

export default function ChatDetailBase({ variant = 'resident', headerTitle }) {
  const { id } = useLocalSearchParams();
  const conversationId = Number(id);
  const dispatch = useAppDispatch();
  const { box, listRef, loadMore } = useConversation(conversationId);
  const user = useAppSelector((s) => s.auth.user);
  const meId = user?.userId;

  const title = useMemo(() => {
    if (headerTitle) return headerTitle;
    return (
      box?.info?.title ||
      (box?.info?.participants || [])
        .map((p) => `${p.firstName || ''} ${p.lastName || ''}`.trim())
        .join(', ') ||
      'Cuộc trò chuyện'
    );
  }, [box?.info, headerTitle]);

  const onSendText = async (content) => {
    await dispatch(sendTextMessage({ conversationId, content })).unwrap();
  };
  const onSendFile = async (file) => {
    await dispatch(sendFileMessage({ conversationId, file })).unwrap();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: variant === 'resident' ? '#f8faf9' : '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.hBtn}>
          <Icon name="chevron.left" size={22} color={variant === 'resident' ? '#0b5343' : '#111827'} />
        </Pressable>
        <Text numberOfLines={1} style={[styles.hTitle, variant === 'resident' ? styles.hTitleResident : null]}>
          {title}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* List */}
      <FlatList
        ref={listRef}
        data={box?.messages || []}         // newest-last
        keyExtractor={(m) => String(m.messageId ?? m.localId ?? `${m.createdAt}-${m.senderId}`)}
        renderItem={({ item }) => <MessageItem msg={item} meId={meId} showSender={true} />}
        contentContainerStyle={{ padding: 14, paddingBottom: 10 }}
        onEndReachedThreshold={0.01}
        onEndReached={loadMore}
        onContentSizeChange={() => setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 0)}
        ListFooterComponent={box?.loading ? <Text style={styles.loading}>Đang tải…</Text> : null}
      />

      {/* Composer (text + file) */}
      <ChatComposer onSendText={onSendText} onSendFile={onSendFile} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff', paddingHorizontal: 12, paddingTop: 44, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#eef2f2',
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  hBtn: { padding: 6 },
  hTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: '#111827' },
  hTitleResident: { color: '#0b5343' },
  loading: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 6 },
});
