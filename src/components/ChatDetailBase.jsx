import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [ready, setReady] = useState(false);

  const initialScrolledRef = useRef(false);
  const loadingMoreRef = useRef(false);

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
      setKeyboardHeight(e.endCoordinates.height + 10 || 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    setReady(false);
    initialScrolledRef.current = false;
    loadingMoreRef.current = false;
  }, [conversationId]);

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
    await dispatch(sendTextMessage({ conversationId, content: trimmed })).unwrap();
  };

  const onSendFile = async (file) => {
    if (!file) return;
    await dispatch(sendFileMessage({ conversationId, file })).unwrap();
  };

  const keyExtractor = (m, index) => {
    const id = m?.messageId ?? m?.localId ?? 'x';
    const created = m?.createdAt ?? '';
    const sender = m?.senderId ?? '';
    return `${id}-${created}-${sender}-${index}`;
  };

  const handleScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;

    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);
    setIsNearBottom(distanceFromBottom < 120);

    if (contentOffset.y < 80 && !box?.loadingChat) {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      Promise.resolve(loadMore()).finally(() => {
        loadingMoreRef.current = false;
      });
    }
  };

  const handleContentSizeChange = () => {
    if (!initialScrolledRef.current) {
      initialScrolledRef.current = true;

      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: false });

        requestAnimationFrame(() => {
          setReady(true);
        });
      });

      return;
    }

    if (isNearBottom) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: variant === 'resident' ? '#f8faf9' : '#fff' }}>
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
          style={[styles.hTitle, variant === 'resident' && styles.hTitleResident]}
        >
          {title}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        ref={listRef}
        data={box?.messages || []}
        keyExtractor={keyExtractor}
        renderItem={({ item }) => <MessageItem msg={item} meId={meId} showSender />}
        style={{ flex: 1, opacity: ready ? 1 : 0 }}
        contentContainerStyle={{
          padding: 14,
          paddingBottom: 10,
          minHeight: SCREEN_HEIGHT * 0.7,
        }}
        ListHeaderComponent={
          box?.loadingChat ? (
            <Text style={styles.loading}>Đang tải tin nhắn cũ…</Text>
          ) : null
        }
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />

      {!ready && (
        <View style={styles.initialOverlay}>
          <Text style={styles.initialOverlayText}>Đang mở cuộc trò chuyện…</Text>
        </View>
      )}

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
  loading: {
    textAlign: 'center',
    color: '#9CA3AF',
    paddingVertical: 10,
    fontSize: 12,
  },
  initialOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 56,
    bottom: 64,
    backgroundColor: 'rgba(248,250,249,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  initialOverlayText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
});
