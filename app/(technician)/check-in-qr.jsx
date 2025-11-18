import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAppDispatch } from '@/src/store';
import { checkInWorkSlot } from '@/src/features/technician/workSlotsSlice';
import Toast from 'react-native-toast-message';
import { Icon } from '@/src/components/Icon.native';

export default function TechCheckInScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const parseCheckinUrl = (raw) => {
    // raw: aptcare://checkin?slotId=15&date=2025-01-01
    try {
      const url = new URL(raw);
      if (url.protocol !== 'aptcare:' || url.hostname !== 'checkin') {
        throw new Error('QR không đúng định dạng điểm danh');
      }
      const slotIdStr = url.searchParams.get('slotId');
      const date = url.searchParams.get('date');
      if (!slotIdStr || !date) {
        throw new Error('Thiếu slotId hoặc date trong QR');
      }
      const slotId = Number(slotIdStr);
      if (Number.isNaN(slotId)) {
        throw new Error('slotId không hợp lệ');
      }
      return { slotId, date };
    } catch (e) {
      throw new Error('QR không hợp lệ hoặc không thuộc hệ thống AptCare');
    }
  };

  const handleBarcodeScanned = useCallback(
    async ({ data }) => {
      if (scanned || checkingIn) return;
      setScanned(true);

      try {
        const { slotId, date } = parseCheckinUrl(data);
        console.log('[slot id, date]',slotId, date)
        setCheckingIn(true);
        await dispatch(checkInWorkSlot({ slotId, date })).unwrap();

        Toast.show({
          type: 'success',
          text1: 'Điểm danh thành công',
          text2: `Ca làm ngày ${date}, slot ${slotId}`,
        });

        setTimeout(() => {
          router.back();
        }, 500);
      } catch (err) {
        console.log('Check-in via QR failed:', err);
        Toast.show({
          type: 'error',
          text1: 'Điểm danh thất bại',
          text2: err || 'Vui lòng kiểm tra lịch làm việc hoặc liên hệ lễ tân',
        });
        setScanned(false);
      } finally {
        setCheckingIn(false);
      }
    },
    [dispatch, scanned, checkingIn]
  );


  if (!permission) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <ActivityIndicator />
        <Text style={styles.infoText}>Đang kiểm tra quyền camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top + 40 }]}>
        <Text style={styles.errorText}>
          Ứng dụng chưa có quyền dùng camera. Vào Cài đặt để cấp quyền cho AptCare.
        </Text>
        <Pressable style={styles.primaryBtn} onPress={requestPermission}>
          <Text style={styles.primaryBtnText}>Cho phép camera</Text>
        </Pressable>
        <Pressable style={[styles.primaryBtn, { marginTop: 8 }]} onPress={() => router.back()}>
          <Text style={styles.primaryBtnText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron.left" size={20} color="#ffffff` " />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Quét QR điểm danh</Text>
          <Text style={styles.subtitle}>Đưa camera vào mã QR trên màn hình lễ tân</Text>
        </View>
      </View>

      <View style={styles.scannerWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned || checkingIn ? undefined : handleBarcodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
      </View>

      <View style={styles.footer}>
        {checkingIn ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator />
            <Text style={styles.footerText}>Đang điểm danh, vui lòng chờ…</Text>
          </View>
        ) : (
          <>
            <Text style={styles.footerText}>
              Hệ thống sẽ tự động điểm danh khi quét được mã QR hợp lệ của ca làm việc.
            </Text>
            {scanned && !checkingIn && (
              <Pressable
                style={[styles.primaryBtn, { marginTop: 12 }]}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.primaryBtnText}>Quét lại</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#020617',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15,23,42,0.7)',
    marginRight: 8,
  },
  title: { fontSize: 18, fontWeight: '600', color: 'white' },
  subtitle: { fontSize: 13, color: '#cbd5f5', marginTop: 2 },

  scannerWrapper: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 220,
    height: 220,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#22c55e',
    backgroundColor: 'transparent',
  },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#020617',
  },
  footerText: { fontSize: 13, color: '#e5e7eb', textAlign: 'center' },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  infoText: { marginTop: 12, color: '#e5e7eb', fontSize: 14, textAlign: 'center' },
  errorText: { color: '#fecaca', textAlign: 'center', fontSize: 14, marginBottom: 12 },

  primaryBtn: {
    marginTop: 8,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#22c55e',
  },
  primaryBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
});
