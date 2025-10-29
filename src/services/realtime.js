import * as SignalR from '@microsoft/signalr';
import { prependLocalMessage, markDelivered, markRead } from '@/src/features/chat/chatSlice';
import { getAccessToken } from './secure-store';


let connection = null;

export function getConnection() { return connection; }

export async function startRealtime() {
  const token = getAccessToken(); 

  connection = new SignalR.HubConnectionBuilder()
    .withUrl(`${process.env.EXPO_PUBLIC_API_BASE}/hubs/chat`, {
      accessTokenFactory: () => token || '',
    })
    .withAutomaticReconnect({
      nextRetryDelayInMilliseconds: ctx => [0, 2000, 5000, 10000][ctx.previousRetryCount] ?? 15000,
    })
    .configureLogging(SignalR.LogLevel.Information)
    .build();

  connection.on('message:new', (msg) => {
    store.dispatch(prependLocalMessage(msg));
  });
  connection.on('message:delivered', ({ conversationId }) => {
    store.dispatch(markDelivered(conversationId));
  });
  connection.on('message:read', ({ conversationId }) => {
    store.dispatch(markRead(conversationId));
  });
  connection.onreconnecting(() => {});
  connection.onreconnected(() => {});
  connection.onclose(() => {});

  await connection.start();
}

export async function stopRealtime() {
  if (connection) {
    try { await connection.stop(); } catch {}
    connection = null;
  }
}

export async function joinConversation(conversationId) {
  if (!connection) return;
  try { await connection.invoke('JoinConversation', conversationId); } catch {}
}

export async function leaveConversation(conversationId) {
  if (!connection) return;
  try { await connection.invoke('LeaveConversation', conversationId); } catch {}
}

