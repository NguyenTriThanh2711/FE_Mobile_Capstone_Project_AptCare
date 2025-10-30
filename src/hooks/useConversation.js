// src/hooks/useConversation.js
import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { fetchMessages, getConversation, markDelivered, markRead, selectConversationBox } from '@/src/features/chat/chatSlice';
import { joinBySlug, leaveBySlug } from '@/src/services/realtime';

export default function useConversation(conversationId, { autoJoin = true } = {}) {
  const dispatch = useAppDispatch();
  const box = useAppSelector(selectConversationBox(conversationId));
  const listRef = useRef(null);
  const joinedSlugRef = useRef(null);

  const markAllSeen = useCallback(() => {
    if (!conversationId) return;
    dispatch(markDelivered(conversationId));
    dispatch(markRead(conversationId));
  }, [dispatch, conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    // 1) lấy info để có slug
    dispatch(getConversation(conversationId))
      .unwrap()
      .then(async (info) => {
        if (!autoJoin) return;
        const apiSlug = info?.slug || info?.Slug; // BE có thể PascalCase
        const fallback = String(conversationId);   // fallback nếu slug trống
        const slug = (apiSlug && String(apiSlug).trim()) || fallback;
        await joinBySlug(slug);
        joinedSlugRef.current = slug;
      })
      .catch(() => { /* ignore */ });

    // 2) load messages
    dispatch(fetchMessages({ conversationId, pageSize: 20 }))
      .unwrap()
      .then(() => {
        setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 0);
        markAllSeen();
      });

    // 3) cleanup: rời đúng slug đã join
    return () => {
      const s = joinedSlugRef.current;
      if (autoJoin && s) {
        leaveBySlug(s);
        joinedSlugRef.current = null;
      }
    };
  }, [conversationId, autoJoin, dispatch, markAllSeen]);

  // focus ⇒ mark read
  useFocusEffect(
    useCallback(() => {
      markAllSeen();
      return () => {};
    }, [markAllSeen])
  );

  // auto scroll & mark read khi có tin mới
  const len = box?.messages?.length || 0;
  useEffect(() => {
    if (!len) return;
    const last = box.messages[len - 1];
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    if (last && !last.isMine) markAllSeen();
  }, [len]); // eslint-disable-line

  const loadMore = useCallback(() => {
    if (!box?.canLoadMore || box?.loadingChat) return;
    const before = box?.oldestCursor;
    if (!before) return;
    dispatch(fetchMessages({ conversationId, before, pageSize: 20 }));
  }, [dispatch, box?.canLoadMore, box?.loadingChat, box?.oldestCursor, conversationId]);

  return { box, listRef, loadMore };
}
