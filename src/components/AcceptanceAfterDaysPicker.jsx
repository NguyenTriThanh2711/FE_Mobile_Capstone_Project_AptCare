import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Colors, zincColors, appleBlue, borderColor } from '@/src/utils/colors';

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };

function addDaysLocal(days) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function formatYMDLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function AcceptanceAfterDaysPicker({
  visible,
  onClose,
  onConfirm,
  minDays = 1,
  maxDays = 7,
  title = 'Chọn nghiệm thu sau bao nhiêu ngày',
  cancelText = 'Huỷ',
  confirmText = 'Chọn',
}) {
  const [selectedDays, setSelectedDays] = useState(minDays);

  useEffect(() => {
    if (visible) {
      setSelectedDays(minDays);
    }
  }, [visible, minDays]);

  const handleConfirm = () => {
    const targetDate = addDaysLocal(selectedDays);
    const dateStr = formatYMDLocal(targetDate);

    console.log('[VN local now + days]', {
      selectedDays,
      targetDate: targetDate.toString(),
      dateStr,
    });

    if (onConfirm) {
      onConfirm(dateStr, { days: selectedDays, date: targetDate });
    }
  };

  const options = [];
  for (let d = minDays; d <= maxDays; d++) {
    options.push(d);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.chipRow}>
            {options.map((d) => {
              const active = d === selectedDays;
              return (
                <Pressable
                  key={d}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedDays(d)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      active && styles.chipTextActive,
                    ]}
                  >
                    {d} ngày
                  </Text>
                </Pressable>
              );
            })}
          </View>

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
