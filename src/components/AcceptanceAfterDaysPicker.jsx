import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  TextInput,
  Keyboard,
  Platform,
} from 'react-native';
import {
  Colors,
  zincColors,
  appleBlue,
  borderColor,
} from '@/src/utils/colors';

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };

function addDaysFrom(baseDateStr, days) {
  const base = baseDateStr ? new Date(baseDateStr) : new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return base;
}

function formatYMDLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const PRESET_OPTIONS = [
  { key: '1d', label: '1 ngày', days: 1 },
  { key: '3d', label: '3 ngày', days: 3 },
  { key: '5d', label: '5 ngày', days: 5 },
  { key: '7d', label: '7 ngày', days: 7 },
  { key: '2w', label: '2 tuần', days: 14 },
  { key: '3w', label: '3 tuần', days: 21 },
  { key: '1m', label: '1 tháng', days: 30 },
  { key: '2m', label: '2 tháng', days: 60 },
  { key: 'custom', label: 'Khác', days: null },
];

export default function AcceptanceAfterDaysPicker({
  visible,
  onClose,
  onConfirm,
  baseDateStr,
  title = 'Chọn nghiệm thu sau bao nhiêu ngày',
  cancelText = 'Huỷ',
  confirmText = 'Chọn',
}) {
  const [selectedKey, setSelectedKey] = useState('3d'); // default 3 ngày cho hợp lý
  const [customDays, setCustomDays] = useState('');
  const [customError, setCustomError] = useState('');
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // reset state khi mở modal
  useEffect(() => {
    if (visible) {
      setSelectedKey('3d');
      setCustomDays('');
      setCustomError('');
    }
  }, [visible]);

  // NGHE BÀN PHÍM → ĐẨY SHEET LÊN
  useEffect(() => {
    if (!visible) {
      setKeyboardOffset(0);
      return;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const height = e?.endCoordinates?.height ?? 0;
      setKeyboardOffset(height);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOffset(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const selectedOption = useMemo(
    () => PRESET_OPTIONS.find((o) => o.key === selectedKey) || PRESET_OPTIONS[0],
    [selectedKey]
  );

  const handleConfirm = () => {
    let days = selectedOption.days;

    if (selectedOption.key === 'custom') {
      const n = Number(customDays);
      if (!Number.isFinite(n) || n <= 0) {
        setCustomError('Vui lòng nhập số ngày hợp lệ (> 0).');
        return;
      }
      setCustomError('');
      days = n;
    }

    const targetDate = addDaysFrom(baseDateStr, days);
    const dateStr = formatYMDLocal(targetDate);

    console.log('[Acceptance date from base]', {
      baseDateStr,
      selectedKey,
      days,
      targetDate: targetDate.toString(),
      dateStr,
    });

    if (onConfirm) {
      onConfirm(dateStr, {
        days,
        date: targetDate,
        presetKey: selectedKey,
        baseDateStr,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            keyboardOffset > 0 && { marginBottom: keyboardOffset },
          ]}
        >
          <Text style={styles.title}>{title}</Text>

          <View style={styles.chipRow}>
            {PRESET_OPTIONS.map((opt) => {
              const active = opt.key === selectedKey;
              return (
                <Pressable
                  key={opt.key}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => {
                    setSelectedKey(opt.key);
                    if (opt.key !== 'custom') {
                      setCustomError('');
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {selectedKey === 'custom' && (
            <View style={styles.customWrap}>
              <Text style={styles.customLabel}>
                Nhập số ngày tính từ ngày báo cáo sửa chữa được duyệt
              </Text>
              <TextInput
                value={customDays}
                onChangeText={(t) => {
                  setCustomDays(t.replace(/\D+/g, ''));
                  setCustomError('');
                }}
                keyboardType="numeric"
                placeholder="VD: 3"
                style={styles.customInput}
              />
              {!!customError && (
                <Text style={styles.customError}>{customError}</Text>
              )}
            </View>
          )}

          <View style={styles.footer}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>

            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: THEME.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: borderColor,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.text,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: zincColors[300],
    backgroundColor: '#F9FAFB',
  },
  chipActive: {
    borderColor: appleBlue,
    backgroundColor: '#EFF6FF',
  },
  chipText: {
    fontSize: 13,
    color: zincColors[600],
    fontWeight: '600',
  },
  chipTextActive: {
    color: appleBlue,
  },
  customWrap: {
    marginTop: 14,
  },
  customLabel: {
    fontSize: 12,
    color: zincColors[600],
    marginBottom: 6,
  },
  customInput: {
    borderWidth: 1,
    borderColor: zincColors[300],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    color: THEME.text,
    fontSize: 14,
  },
  customError: {
    marginTop: 4,
    fontSize: 12,
    color: '#B91C1C',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: borderColor,
    backgroundColor: '#F9FAFB',
  },
  cancelText: {
    fontSize: 14,
    color: zincColors[600],
    fontWeight: '600',
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: appleBlue,
  },
  confirmText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
});
