import React, { useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Linking } from 'react-native';

function getInitials(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  const a = parts[0]?.[0] || '';
  const b = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (a + b).toUpperCase();
}

function isHttpUrl(s) {
  if (!s) return false;
  return /^https?:\/\/\S+$/i.test(String(s).trim());
}

function isImageUrl(url) {
  if (!isHttpUrl(url)) return false;
  const u = String(url).trim();
  const noQuery = u.split('?')[0].split('#')[0];
  return /\.(png|jpe?g|gif|webp|bmp|heic)$/i.test(noQuery);
}

export default function MessageItem({ msg, meId, showSender = true }) {
  const mine = msg?.senderId === meId;
  const content = String(msg?.content || '').trim();

  const isLink = useMemo(() => isHttpUrl(content), [content]);
  const isImage = useMemo(() => isImageUrl(content), [content]);

  const [imgError, setImgError] = useState(false);

  const openLink = async () => {
    if (!isLink) return;
    try {
      await Linking.openURL(content);
    } catch (e) {}
  };

  return (
    <View style={[styles.bWrap, mine ? styles.right : styles.left]}>
      {!mine && (
        <View style={styles.avatarWrap}>
          {msg?.senderAvatar ? (
            <Image source={{ uri: msg.senderAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarTxt}>{getInitials(msg?.senderName)}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.bubble, mine ? styles.bRight : styles.bLeft]}>
        {showSender && !mine && !!msg?.senderName && (
          <Text style={styles.senderName} numberOfLines={1}>
            {msg.senderName}
          </Text>
        )}

        {isImage && !imgError ? (
          <Pressable onPress={openLink} style={styles.imgWrap}>
            <Image
              source={{ uri: content }}
              style={styles.img}
              resizeMode="cover"
              onError={() => setImgError(true)}
            />
          </Pressable>
        ) : isLink ? (
          <Pressable onPress={openLink} hitSlop={8}>
            <Text style={[styles.content, mine && { color: '#fff' }]}>
              {content}
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.content, mine && { color: '#fff' }]}>
            {content}
          </Text>
        )}

        <Text style={[styles.time, mine && { color: '#e5e7eb' }]}>
          {msg?.createdAt
          ? new Date(msg.createdAt).toLocaleString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bWrap: { marginVertical: 6, flexDirection: 'row', paddingHorizontal: 4 },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },

  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  bLeft: { backgroundColor: '#F3F4F6', borderTopLeftRadius: 4 },
  bRight: { backgroundColor: '#0b5345', borderTopRightRadius: 4 },

  content: { color: '#111827', fontSize: 15, lineHeight: 20 },
  time: { marginTop: 4, fontSize: 10, color: '#9CA3AF', alignSelf: 'flex-end' },

  avatarWrap: { marginRight: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB' },
  avatarFallback: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarTxt: { fontSize: 12, fontWeight: '700', color: '#374151' },
  senderName: { fontSize: 11, color: '#6B7280', marginBottom: 2, fontWeight: '600' },

  imgWrap: {
    marginTop: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  img: {
    width: 220,
    height: 220,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
});
