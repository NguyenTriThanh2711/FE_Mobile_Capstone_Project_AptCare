// src/hooks/useConversation.js
import { useEffect, useRef, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchMessages,
  getConversation,
  selectConversationBox,
} from '@/src/features/chat/chatSlice';

const PAGE_SIZE = 20;

export default function useConversation(conversationId) {
  const dispatch = useAppDispatch();
  const box = useAppSelector(selectConversationBox(conversationId));
  const listRef = useRef(null);

  // lần đầu: lấy info + page đầu tiên (gần hiện tại nhất tuỳ BE trả)
  useEffect(() => {
    if (!conversationId) return;
    dispatch(getConversation(conversationId));
    dispatch(fetchMessages({ conversationId, pageSize: PAGE_SIZE }));
  }, [conversationId, dispatch]);

  const loadMore = useCallback(() => {
    // ❌ nếu chưa có data hoặc BE báo hết trang thì thôi
    if (!box?.canLoadMore) return;
    if (!box?.oldestCursor) return;

    // ✅ chặn bug: khi mới vào mà message < PAGE_SIZE, FlatList hay gọi onEndReached → KHÔNG load thêm
    if ((box?.messages?.length || 0) < PAGE_SIZE) return;

    dispatch(
      fetchMessages({
        conversationId,
        before: box.oldestCursor,
        pageSize: PAGE_SIZE,
      })
    );
  }, [
    box?.canLoadMore,
    box?.oldestCursor,
    box?.messages?.length,
    conversationId,
    dispatch,
  ]);

  return { box, listRef, loadMore };
}
