import { useEffect } from 'react';
import { useAppDispatch } from '@/src/store';
import { markRead, setCurrentConversationId } from '@/src/features/chat/chatSlice';

// conversationInfo giữ lại nếu sau này cần thêm logic
export default function useChatRealtime(conversationId, conversationInfo) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!conversationId) return;

    // báo cho store biết: đang mở phòng này → để incomingMessage không cộng unread
    dispatch(setCurrentConversationId(conversationId));

    (async () => {
      try {
        await dispatch(markRead(conversationId)).unwrap();
      } catch (err) {
        console.log('[SignalR] markRead failed', err);
      }
    })();

    return () => {
      dispatch(setCurrentConversationId(null));
    };
  }, [conversationId, dispatch]);
}
