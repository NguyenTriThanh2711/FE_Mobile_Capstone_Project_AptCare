import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useAppDispatch } from '@/src/store';
import { checkOutWorkSlot, fetchMySchedule } from '@/src/features/technician/workSlotsSlice';
import Toast from 'react-native-toast-message';
import { Icon } from '@/src/components/Icon.native';

export default function TechCheckOutScreen() {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const parseCheckoutUrl = (raw) => {
    try {
      const url = new URL(raw);
      if (url.protocol !== 'aptcare:' || url.hostname !== 'checkout') {
        throw new Error('QR không đúng định dạng kết thúc ca');
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
      if (scanned || checkingOut) return;
      setScanned(true);

      try {
        const { slotId, date } = parseCheckoutUrl(data);
        console.log('[checkout slot id, date]', slotId, date);
        setCheckingOut(true);

        await dispatch(checkOutWorkSlot({ slotId, date })).unwrap();
        try {
          await dispatch(
            fetchMySchedule({
              fromDate: date,
              toDate: date,
            })
          ).unwrap();
        } catch (e) {
          console.log('Refresh schedule after check-in failed:', e);
        }
        Toast.show({
          type: 'success',
          text1: 'Kết thúc ca thành công',
          text2: `Ca làm ngày ${date}, slot ${slotId}`,
        });

        setTimeout(() => {
          router.back(); 
        }, 500);
      } catch (err) {
        console.log('Check-out via QR failed:', err);
        Toast.show({
          type: 'error',
          text1: 'Kết thúc ca thất bại',
          text2:
            err?.message ||
            String(err) ||
            'Vui lòng kiểm tra lịch làm việc hoặc liên hệ lễ tân',
        });
        setTimeout(() => {
          router.back();
        }, 700);
      } finally {
        setCheckingOut(false);
      }
    },
    [dispatch, scanned, checkingOut]
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
        <Pressable
          style={[styles.primaryBtn, { marginTop: 8 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.primaryBtnText}>Quay lại</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="chevron.left" size={20} color="#ffffffff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Quét QR kết thúc ca</Text>
          <Text style={styles.subtitle}>
            Đưa camera vào mã QR kết thúc ca trên màn hình điểm danh kết thúc ca
          </Text>
        </View>
      </View>

      <View style={styles.scannerWrapper}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned || checkingOut ? undefined : handleBarcodeScanned}
        />
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
        </View>
      </View>

      <View style={styles.footer}>
        {checkingOut ? (
          <View style={styles.rowCenter}>
            <ActivityIndicator />
            <Text style={styles.footerText}>Đang kết thúc ca, vui lòng chờ…</Text>
          </View>
        ) : (
          <>
            <Text style={styles.footerText}>
              Hệ thống sẽ tự động kết thúc ca khi quét được mã QR hợp lệ.
            </Text>
            {scanned && !checkingOut && (
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
    borderColor: '#f97316', // cam cho khác check-in 1 tí (muốn giữ xanh thì đổi lại)
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
    backgroundColor: '#f97316',
  },
  primaryBtnText: { color: 'white', fontWeight: '600', fontSize: 14 },
});
