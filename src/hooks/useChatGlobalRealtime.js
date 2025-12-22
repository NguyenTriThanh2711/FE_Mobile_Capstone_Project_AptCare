import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  incomingMessage,
  markDelivered,
} from '@/src/features/chat/chatSlice';
import { getAccessToken } from '@/src/services/secure-store';
import { selectConversations } from '@/src/features/chat/chatSlice';
import Toast from 'react-native-toast-message';

const HUB_URL = process.env.EXPO_PUBLIC_API_CHAT_HUB_URL;

// 1 connection duy nhất cho toàn app
export default function useChatGlobalRealtime() {
  const dispatch = useAppDispatch();
  const meId = useAppSelector((s) => s.auth.user?.userId);
  const conversations = useAppSelector(selectConversations);
  const currentConversationId = useAppSelector((s) => s.chat.currentConversationId);
  console.log('[currentConversationId]', currentConversationId);
  console.log('[meId]',meId)
  const connectionRef = useRef(null);
  const startedRef = useRef(false);
  const joinedRoomsRef = useRef(new Set());

  // ===== 1. Init connection khi có user =====
  useEffect(() => {
    if (!HUB_URL) {
      console.warn('Missing EXPO_PUBLIC_API_CHAT_HUB_URL');
      return;
    }

    // chưa login thì không connect
    if (!meId) {
      // nếu trước đó có connection thì stop
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
        startedRef.current = false;
        joinedRoomsRef.current = new Set();
      }
      return;
    }

    if (connectionRef.current) return;
    const silentLogger = {
      log: () => {}, 
    };
    const conn = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: async () => {
          const token = await getAccessToken();
          return token || '';
        }
      })
      .withAutomaticReconnect()
      .configureLogging(silentLogger)
      .build();

    connectionRef.current = conn;

    (async () => {
      try {
        await conn.start();
        startedRef.current = true;
        console.log('[SignalR-GLOBAL] Connected');
      } catch (e) {
        console.log('[SignalR-GLOBAL] Connection failed', e);
      }
    })();

    return () => {
      startedRef.current = false;
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
      joinedRoomsRef.current = new Set();
    };
  }, [meId]);

  // ===== 2. Join tất cả phòng trong list conversations =====
  useEffect(() => {
    const conn = connectionRef.current;
    if (!conn) return;
    if (!startedRef.current) return;
    if (!conversations || conversations.length === 0) return;

    const joined = joinedRoomsRef.current;

    const joinAll = async () => {
      for (const c of conversations) {
        const roomKey = c.slug || String(c.conversationId);
        if (!roomKey || joined.has(roomKey)) continue;

        try {
          await conn.invoke('JoinConversation', roomKey);
          joined.add(roomKey);
          console.log('[SignalR-GLOBAL] Joined room', roomKey);
        } catch (e) {
          console.log('[SignalR-GLOBAL] JoinConversation error', roomKey, e);
        }
      }
    };

    joinAll();
  }, [conversations]);

  useEffect(() => {
    const conn = connectionRef.current;
    if (!conn) return;

    const handleReceive = async (message) => {
      if (!message) return;
      console.log('[SignalR-GLOBAL] ReceiveMessage', message);
      const cid = message.conversationId ?? message.conversation?.conversationId;
      if (!cid) return;

      const senderId = Number(message.senderId);
      const mine = meId != null && senderId === Number(meId);

      const normalized = { ...message, isMine: mine };
      dispatch(incomingMessage(normalized));

      const openingThisChat = Number(currentConversationId) === Number(cid);

      if (!mine && !openingThisChat) {
        Toast.show({
          type: 'info',
          text1: message.senderName || 'Tin nhắn mới',
          text2: message.content ? String(message.content).slice(0, 120) : 'Bạn có tin nhắn mới',
          position: 'top',
          visibilityTime: 2200,
          topOffset: 60,
        });
      }

      if (!mine) {
        try {
          await dispatch(markDelivered(cid)).unwrap();
        } catch (err) {
          console.log('[SignalR-GLOBAL] markDelivered failed', err);
        }
      }
    };

    const handleMarkAsRead = (ids) => {
      console.log('[SignalR-GLOBAL] markAsRead from hub', ids);
    };

    const handleMarkAsDelivered = (ids) => {
      console.log('[SignalR-GLOBAL] markAsDeliveried from hub', ids);
    };

    conn.on('ReceiveMessage', handleReceive);
    conn.on('MarkAsRead', handleMarkAsRead);
    conn.on('markasread', handleMarkAsRead);
    conn.on('MarkAsDeliveried', handleMarkAsDelivered);

    return () => {
      conn.off('ReceiveMessage', handleReceive);
      conn.off('MarkAsRead', handleMarkAsRead);
      conn.off('markasread', handleMarkAsRead);
      conn.off('MarkAsDeliveried', handleMarkAsDelivered);
    };
  }, [dispatch, meId, currentConversationId]);
}
