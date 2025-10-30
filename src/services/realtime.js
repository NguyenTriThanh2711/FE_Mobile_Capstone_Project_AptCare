// src/services/realtime.js
import * as SignalR from '@microsoft/signalr';
import { prependLocalMessage, incomingMessage, markDelivered, markRead } from '@/src/features/chat/chatSlice';
import { getAccessToken } from './secure-store';
import { store } from '@/src/store';

const hubUrl = process.env.EXPO_PUBLIC_API_CHAT_HUB_URL;

let connection = null;
let connectingPromise = null;
const joinedSlugs = new Set();

function isConnected() {
  return connection && connection.state === SignalR.HubConnectionState.Connected;
}

async function whenConnected() {
  if (!connection) throw new Error('No connection');
  if (isConnected()) return;

  if (
    connection.state === SignalR.HubConnectionState.Connecting ||
    connection.state === SignalR.HubConnectionState.Reconnecting
  ) {
    await new Promise((resolve, reject) => {
      let done = false;
      const ok = () => { if (!done) { done = true; cleanup(); resolve(); } };
      const bad = (e) => { if (!done) { done = true; cleanup(); reject(e); } };
      const cleanup = () => {
        connection.offreconnected(ok);
        connection.offclose(bad);
      };
      connection.onreconnected(ok);
      connection.onclose(bad);
    });
    return;
  }

  await startRealtime();
}

export async function startRealtime() {
  if (!hubUrl) {
    console.error('[realtime] missing CHAT_HUB_URL');
    return;
  }

  if (connection && connection.state !== SignalR.HubConnectionState.Disconnected) {
    return connectingPromise || Promise.resolve();
  }
  if (connectingPromise) return connectingPromise;

  connection = new SignalR.HubConnectionBuilder()
    .withUrl(hubUrl, { accessTokenFactory: async () => (await getAccessToken()) || '' })
    .withAutomaticReconnect()
    .configureLogging(SignalR.LogLevel.Information)
    .build();

  // BE đang SendAsync("ReceiveMessage", result)
  connection.on('ReceiveMessage', (msg) => {
    // nhận realtime từ server
    try {
      store.dispatch(prependLocalMessage(msg));
      store.dispatch(incomingMessage(msg));
    } catch (e) {
      console.error('[realtime] handler error ReceiveMessage', e);
    }
  });

  connection.on('message:delivered', ({ conversationId }) => store.dispatch(markDelivered(conversationId)));
  connection.on('message:read', ({ conversationId }) => store.dispatch(markRead(conversationId)));

  connection.onreconnected(async () => {
    console.log('[realtime] reconnected → rejoin slugs:', Array.from(joinedSlugs));
    for (const slug of joinedSlugs) {
      try { await connection.invoke('JoinConversation', slug); }
      catch (e) { console.warn('[realtime] rejoin error', slug, e); }
    }
  });

  connectingPromise = connection.start()
    .then(() => console.log('[realtime] started'))
    .catch((e) => { console.error('[realtime] start error:', e); throw e; })
    .finally(() => { connectingPromise = null; });

  return connectingPromise;
}

export async function stopRealtime() {
  if (!connection) return;
  try { await connection.stop(); } catch (e) { console.warn('[realtime] stop error', e); }
  joinedSlugs.clear();
  connection = null;
}

// === slug-based join/leave ===
export async function joinBySlug(slugOrFallback) {
  const slug = String(slugOrFallback || '').trim();
  if (!slug) { console.warn('[realtime] skip join: empty slug'); return; }
  await whenConnected();
  if (joinedSlugs.has(slug)) return;
  try {
    await connection.invoke('JoinConversation', slug);
    joinedSlugs.add(slug);
    console.log('[realtime] joined slug:', slug);
  } catch (e) {
    console.warn('[realtime] join error', e);
  }
}

export async function leaveBySlug(slugOrFallback) {
  const slug = String(slugOrFallback || '').trim();
  if (!slug) return;
  if (!isConnected()) { joinedSlugs.delete(slug); return; }
  try {
    await connection.invoke('LeaveConversation', slug);
    console.log('[realtime] left slug:', slug);
  } catch (e) {
    console.warn('[realtime] leave error', e);
  }
  joinedSlugs.delete(slug);
}
