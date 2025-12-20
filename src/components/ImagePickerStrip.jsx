import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Icon } from '@/src/components/Icon.native';

/** Chuẩn hoá asset từ ImagePicker để upload */
function normalizePickedAsset(asset) {
  const uri = asset?.uri;
  const nameFromPicker = asset?.fileName || uri?.split('/').pop() || `photo_${Date.now()}.jpg`;
  const ext = (nameFromPicker.split('.').pop() || 'jpg').toLowerCase();
  const mime =
    asset?.mimeType || (ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg');
  return { uri, name: nameFromPicker, type: mime, width: asset?.width, height: asset?.height };
}

/**
 * MediaSection (gộp View + Update)
 * - mode="view": chỉ xem ảnh từ BE (props: items, mapUri, mapKey)
 * - mode="update": thêm/sửa/xoá ảnh local (props: value, onChange, maxCount)
 *
 * Props chung:
 *  - title: string
 *  - thumbCols: số cột hiển thị nhanh (mặc định 2)
 *
 * View mode:
 *  - items: mảng từ BE (ví dụ: [{ mediaId, filePath }, ...])
 *  - mapUri: (item) => string (URL)
 *  - mapKey: (item, index) => string
 *
 * Update mode:
 *  - value: mảng ảnh local [{ uri, name, type }, ...]
 *  - onChange: fn(nextArray)
 *  - maxCount: số ảnh tối đa
 */
export default function MediaSection({
  mode = 'view', // 'view' | 'update'
  title = 'Hình ảnh',
  thumbCols = 2,
  style = {},
  // VIEW props
  items = [],
  mapUri = (it) => it?.filePath || it?.uri || '',
  mapKey = (it, i) => String(it?.mediaId || it?.id || it?.uri || i),

  // UPDATE props
  value = [],
  onChange,
  maxCount = 10,
}) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const winW = Dimensions.get('window').width;

  // Dữ liệu hiển thị tuỳ theo mode
  const data = mode === 'view' ? items : value;

  const hasImages = Array.isArray(data) && data.length > 0;
  const overCount = Math.max(0, (data?.length || 0) - thumbCols);
  const firstN = useMemo(() => (hasImages ? data.slice(0, thumbCols) : []), [data, thumbCols]);

  const openViewer = (startIndex = 0) => {
    if (!hasImages) return;
    setViewerIndex(startIndex);
    setViewerOpen(true);
  };

  // ====== UPDATE ACTIONS ======
  const removeAt = (idx) => {
    if (mode !== 'update') return;
    onChange?.(value.filter((_, i) => i !== idx));
  };

  const askCamera = async () => {
    if (mode !== 'update') return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Quyền truy cập', 'Cần quyền Camera.');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8, exif: false });
    if (!res.canceled && res.assets?.length) {
      const next = [...value, ...res.assets.map(normalizePickedAsset)];
      onChange?.(next.slice(0, maxCount));
    }
  };

  const askLibrary = async () => {
    if (mode !== 'update') return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Quyền truy cập', 'Cần quyền Thư viện ảnh.');
    const res = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: Math.max(1, maxCount - value.length),
      exif: false,
    });
    if (!res.canceled && res.assets?.length) {
      const next = [...value, ...res.assets.map(normalizePickedAsset)];
      onChange?.(next.slice(0, maxCount));
    }
  };

  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={[styles.headerRow, { justifyContent: mode === 'update' ? 'space-between' : 'center' }]}>
        <Text style={styles.title}>{title}</Text>
        {mode === 'update' ? (
          <View style={styles.actions}>
            <Pressable style={[styles.pillBtn]} onPress={askCamera}>
              <Icon name="camera.fill" size={16} color="#fff" />
              <Text style={styles.pillBtnText}>Chụp</Text>
            </Pressable>
            <Pressable style={[styles.pillBtn, styles.pillSecondary]} onPress={askLibrary}>
              <Icon name="photo.fill" size={16} color="#fff" />
              <Text style={styles.pillBtnText}>Thư viện</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {/* Thumbs / Placeholder */}
      {!hasImages ? (
        <View style={styles.placeholderWrap}>
          <View style={styles.placeholderBox}>
            <Icon name="photo" size={22} color="#9CA3AF" />
            <Text style={styles.placeholderText}>
              {mode === 'update' ? 'Chưa có ảnh — chạm nút để thêm' : 'Chưa có hình'}
            </Text>
          </View>
        </View>
      ) : (
        <Pressable onPress={() => openViewer(0)} style={styles.thumbsRow}>
          {firstN.map((item, idx) => {
            const uri = mode === 'view' ? mapUri(item) : item.uri;
            return (
              <View key={mapKey(item, idx)} style={[styles.thumbBox]}>
                <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                {mode === 'update' ? (
                  <Pressable
                    style={styles.closeBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      removeAt(idx);
                    }}>
                    <Text style={styles.closeTxt}>×</Text>
                  </Pressable>
                ) : null}
                {idx === thumbCols - 1 && overCount > 0 ? (
                  <View style={styles.overlay}>
                    <Text style={styles.overlayTxt}>+{overCount}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Pressable>
      )}

      {/* Viewer */}
      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewerBg}>
          <View style={styles.viewerHeader}>
            <Pressable onPress={() => setViewerOpen(false)} hitSlop={10} style={{ padding: 6 }}>
              <Icon name="xmark" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.viewerTitle}>
              {viewerIndex + 1}/{data.length}
            </Text>
            <View style={{ width: 34 }} />
          </View>

          <FlatList
            data={data}
            keyExtractor={(item, i) => mapKey(item, i)}
            horizontal
            pagingEnabled
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / winW);
              setViewerIndex(idx);
            }}
            renderItem={({ item, index }) => {
              const uri = mode === 'view' ? mapUri(item) : item.uri;
              return (
                <View style={styles.viewerItem}>
                  <Image style={styles.viewerImage} source={{ uri }} resizeMode="contain" />
                  {mode === 'update' ? (
                    <Pressable
                      onPress={() => {
                        const next = value.filter((_, i) => i !== index);
                        onChange?.(next);
                        setViewerIndex(Math.max(0, next.length - 1));
                        if (next.length === 0) setViewerOpen(false);
                      }}
                      style={styles.viewerRemoveBtn}>
                      <Icon name="trash" size={16} color="#fff" />
                      <Text style={styles.viewerRemoveTxt}>Xoá ảnh này</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

/* ================== Styles ================== */
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    marginBottom: 14,
    elevation: 2,
  },

  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  title: { fontSize: 14, fontWeight: '700', color: '#111827' },

  actions: { flexDirection: 'row', gap: 8 },
  pillBtn: {
    backgroundColor: '#1e88e5',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillSecondary: { backgroundColor: '#0ea5e9' },
  pillBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  thumbsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    columnGap: 10,
  },
  thumbBox: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
  },
  thumb: { width: '100%', height: '100%' },

  placeholderWrap: { paddingHorizontal: 16, paddingBottom: 16 },
  placeholderBox: {
    height: 120,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FAFAFA',
  },
  placeholderText: { color: '#6B7280', fontSize: 13, fontWeight: '600' },

  closeBtn: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: { color: '#fff', fontWeight: '800', marginTop: -2, fontSize: 14 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },

  /* Viewer */
  viewerBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' },
  viewerHeader: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 5,
  },
  viewerTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },

  viewerItem: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewerImage: { width: '100%', height: '100%' },

  viewerRemoveBtn: {
    position: 'absolute',
    bottom: 48,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewerRemoveTxt: { color: '#fff', fontWeight: '700' },
});
