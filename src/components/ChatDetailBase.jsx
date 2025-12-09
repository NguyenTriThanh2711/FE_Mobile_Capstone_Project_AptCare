import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Keyboard,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import {
  sendTextMessage,
  sendFileMessage,
  setCurrentConversationId,
} from '@/src/features/chat/chatSlice';
import MessageItem from '@/src/components/MessageItem';
import ChatComposer from '@/src/components/ChatComposer';
import useConversation from '@/src/hooks/useConversation';
import useChatRealtime from '@/src/hooks/useChatRealtime';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function ChatDetailBase({ variant = 'resident', headerTitle }) {
  const { id } = useLocalSearchParams();
  const conversationId = Number(id);
  const dispatch = useAppDispatch();
  const { box, listRef, loadMore } = useConversation(conversationId);
  const user = useAppSelector((s) => s.auth.user);
  const meId = user?.userId;

  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!conversationId) return;
    dispatch(setCurrentConversationId(conversationId));
    return () => {
      dispatch(setCurrentConversationId(null));
    };
  }, [conversationId, dispatch]);

  useChatRealtime(conversationId, box?.info);

  useEffect(() => {
    if (Platform.OS !== 'android') return; 

    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height+10 || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const title = useMemo(() => {
    if (headerTitle) return headerTitle;
    return (
      box?.info?.title ||
      (box?.info?.participants || [])
        .map((p) => `${p.firstName || ''} ${p.lastName || ''}`.trim())
        .filter(Boolean)
        .join(', ') ||
      'Cuộc trò chuyện'
    );
  }, [box?.info, headerTitle]);

  const onSendText = async (content) => {
    const trimmed = content?.trim();
    if (!trimmed) return;
    await dispatch(
      sendTextMessage({ conversationId, content: trimmed })
    ).unwrap();
  };

  const onSendFile = async (file) => {
    if (!file) return;
    await dispatch(sendFileMessage({ conversationId, file })).unwrap();
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: variant === 'resident' ? '#f8faf9' : '#fff',
      }}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.hBtn}>
          <Icon
            name="chevron.left"
            size={22}
            color={variant === 'resident' ? '#0b5343' : '#111827'}
          />
        </Pressable>
        <Text
          numberOfLines={1}
          style={[
            styles.hTitle,
            variant === 'resident' ? styles.hTitleResident : null,
          ]}
        >
          {title}
        </Text>
        <View style={{ width: 28 }} />
      </View>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={box?.messages || []}
          keyExtractor={(m, index) =>
            String(
              m.messageId ??
                m.localId ??
                `${m.slug || ''}-${m.createdAt || ''}-${m.senderId || ''}-${index}`
            )
          }
          renderItem={({ item }) => (
            <MessageItem msg={item} meId={meId} showSender={true} />
          )}
          contentContainerStyle={{
            padding: 14,
            paddingBottom: 10,
            minHeight: SCREEN_HEIGHT * 0.7,
          }}
          ListFooterComponent={
            box?.loadingChat ? (
              <Text style={styles.loading}>Đang tải…</Text>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.2}
          onContentSizeChange={() =>
            setTimeout(
              () => listRef.current?.scrollToEnd({ animated: true }),
              0
            )
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </View>

      <View style={{ paddingBottom: keyboardHeight }}>
        <ChatComposer onSendText={onSendText} onSendFile={onSendFile} />
      </View>
    </View>
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
  hTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  hTitleResident: { color: '#0b5343' },
  loading: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 6 },
});
