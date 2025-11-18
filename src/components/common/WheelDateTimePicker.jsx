// src/components/common/WheelDateTimePicker.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, FlatList, StyleSheet } from 'react-native';

// ---- UI constants
const ITEM_HEIGHT = 36;
const VISIBLE_COUNT = 5; // lẻ để có item giữa
const CENTER_OFFSET = Math.floor(VISIBLE_COUNT / 2) * ITEM_HEIGHT;

// ---- util
const pad2 = (n) => String(n).padStart(2, '0');
const weekdayLabel = ['CN', 'T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7'];
// ================= Finite column (Date, AM/PM) =================
function FiniteWheelColumn({
  data,
  selectedIndex,
  onChangeIndex,
  width = 120,
  render = (x) => String(x),
}) {
  const ref = useRef(null);
  const snappingRef = useRef(false);
  const lastIdxRef = useRef(null);

  const getItemLayout = (_d, i) => ({
    length: ITEM_HEIGHT,
    offset: i * ITEM_HEIGHT,
    index: i,
  });

  // Đặt đúng vị trí khi mount / đổi selected từ ngoài
  useEffect(() => {
    const idx = Math.max(0, Math.min(selectedIndex, data.length - 1));
    lastIdxRef.current = idx;
    requestAnimationFrame(() => {
      ref.current?.scrollToOffset({
        offset: idx * ITEM_HEIGHT,
        animated: false,
      });
    });
  }, [selectedIndex, data.length]);

  const settleFromOffset = (y) => {
    const idx = Math.max(0, Math.min(Math.round(y / ITEM_HEIGHT), data.length - 1));

    // Không làm gì nếu không đổi
    if (lastIdxRef.current === idx) {
      snappingRef.current = false;
      return;
    }

    lastIdxRef.current = idx;
    onChangeIndex?.(idx);

    // Snap đúng rãnh
    snappingRef.current = true;
    ref.current?.scrollToOffset({
      offset: idx * ITEM_HEIGHT,
      animated: true,
    });
  };

  return (
    <View style={{ width, height: ITEM_HEIGHT * VISIBLE_COUNT, overflow: 'hidden' }}>
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(_, i) => `finite-${i}`}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={[styles.itemText, index === selectedIndex && styles.itemTextSel]}>
              {render(item)}
            </Text>
          </View>
        )}
        contentContainerStyle={{ paddingTop: CENTER_OFFSET, paddingBottom: CENTER_OFFSET }}
        initialNumToRender={VISIBLE_COUNT + 4}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        // chỉ bắt 1 sự kiện cuối cùng để chốt
        onMomentumScrollEnd={(e) => {
          if (snappingRef.current) {
            // kết thúc snap do code -> dừng vòng lặp
            snappingRef.current = false;
          }
          settleFromOffset(e.nativeEvent.contentOffset.y);
        }}
      />
      <View pointerEvents="none" style={styles.centerLine} />
    </View>
  );
}

// ================= Infinite column (Hour, Minute) =================
function InfiniteWheelColumn({
  baseLength, // 12 (giờ) | 60 (phút)
  getInitialBaseIndex, // () -> 0..base-1
  onValueChange, // (0..base-1) -> void
  renderValue = (i) => String(i),
  width = 70,
}) {
  const ref = useRef(null);
  const snappingRef = useRef(false);
  const lastAbsIdxRef = useRef(null);

  const LOOPS = 400;
  const TOTAL = baseLength * LOOPS;
  const MID_BLOCK = Math.floor(LOOPS / 2);
  const data = useMemo(() => Array.from({ length: TOTAL }, (_, i) => i), [TOTAL]);

  const [absIndex, setAbsIndex] = useState(() => MID_BLOCK * baseLength + getInitialBaseIndex());

  // đồng bộ khi mở lại với initial mới
  useEffect(() => {
    const target = MID_BLOCK * baseLength + getInitialBaseIndex();
    setAbsIndex(target);
    lastAbsIdxRef.current = target;
    requestAnimationFrame(() => {
      ref.current?.scrollToOffset({ offset: target * ITEM_HEIGHT, animated: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseLength, getInitialBaseIndex]);

  const getItemLayout = (_d, i) => ({
    length: ITEM_HEIGHT,
    offset: i * ITEM_HEIGHT,
    index: i,
  });

  const baseIdxFromAbs = (abs) => {
    const m = ((abs % baseLength) + baseLength) % baseLength; // 0..base-1
    return m;
  };

  const settleFromOffset = (y) => {
    const absIdx = Math.round(y / ITEM_HEIGHT);

    if (lastAbsIdxRef.current === absIdx) {
      snappingRef.current = false;
      return;
    }

    lastAbsIdxRef.current = absIdx;
    setAbsIndex(absIdx);
    onValueChange?.(baseIdxFromAbs(absIdx));

    // Snap đúng rãnh
    snappingRef.current = true;
    ref.current?.scrollToOffset({ offset: absIdx * ITEM_HEIGHT, animated: true });
  };

  return (
    <View style={{ width, height: ITEM_HEIGHT * VISIBLE_COUNT, overflow: 'hidden' }}>
      <FlatList
        ref={ref}
        data={data}
        keyExtractor={(i) => `inf-${i}`}
        renderItem={({ index: i }) => {
          const baseIdx = baseIdxFromAbs(i);
          const isSel = i === absIndex;
          return (
            <View style={styles.row}>
              <Text style={[styles.itemText, isSel && styles.itemTextSel]}>
                {renderValue(baseIdx)}
              </Text>
            </View>
          );
        }}
        contentContainerStyle={{ paddingTop: CENTER_OFFSET, paddingBottom: CENTER_OFFSET }}
        initialNumToRender={VISIBLE_COUNT + 8}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          if (snappingRef.current) {
            snappingRef.current = false;
          }
          settleFromOffset(e.nativeEvent.contentOffset.y);
        }}
      />
      <View pointerEvents="none" style={styles.centerLine} />
    </View>
  );
}

// ================= Modal DateTime Picker =================
export default function WheelDateTimePicker({
  visible,
  onClose,
  onConfirm,
  initialDate = new Date(),
  daysAhead = 30,
  locale = 'vi-VN',
  title = 'Chọn ngày & giờ',
  cancelText = 'Huỷ',
  confirmText = 'Xong',
}) {
  // ---- list ngày (hữu hạn)
  const dates = useMemo(() => {
    const arr = [];
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setMonth(end.getMonth() + 1); // mốc 1 tháng sau

    // push từng ngày: [start, end)
    for (const d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      arr.push(new Date(d));
    }
    return arr;
  }, []);

  // ---- state chọn (đồng bộ theo initialDate khi mở)
  const findDateIdx = () => {
    const y = initialDate.getFullYear();
    const m = initialDate.getMonth();
    const d = initialDate.getDate();
    const idx = dates.findIndex(
      (x) => x.getFullYear() === y && x.getMonth() === m && x.getDate() === d
    );
    return Math.max(0, idx === -1 ? 0 : idx);
  };

  const [dateIdx, setDateIdx] = useState(findDateIdx());
  const [hourBaseIdx, setHourBaseIdx] = useState((initialDate.getHours() % 12 || 12) - 1); // 0..11
  const [minuteBaseIdx, setMinuteBaseIdx] = useState(
    initialDate.getMinutes() === 0 ? 59 : initialDate.getMinutes() - 1
  );
  const [ampmIdx, setAmPmIdx] = useState(initialDate.getHours() >= 12 ? 1 : 0);

  useEffect(() => {
    if (!visible) return;
    setDateIdx(findDateIdx());
    setHourBaseIdx((initialDate.getHours() % 12 || 12) - 1);
    setMinuteBaseIdx(initialDate.getMinutes() === 0 ? 59 : initialDate.getMinutes() - 1);
    setAmPmIdx(initialDate.getHours() >= 12 ? 1 : 0);
  }, [visible]);

  const fmtDate = (d) => {
    const w = d.getDay(); // 0 = CN, 1 = T.2, ...
    const wStr = weekdayLabel[w];
    const dd = pad2(d.getDate());
    const mm = pad2(d.getMonth() + 1);
    const yyyy = d.getFullYear();

    // Ví dụ: "T.3, 18/11/2025" hoặc "CN, 23/11/2025"
    return `${wStr}, ${dd}/${mm}/${yyyy}`;
  };

  // ---- columns
  const HourColumn = (
    <InfiniteWheelColumn
      baseLength={12}
      getInitialBaseIndex={() => hourBaseIdx}
      onValueChange={setHourBaseIdx}
      renderValue={(i) => pad2(i + 1)} // 0..11 -> 01..12
      width={52}
    />
  );

  const MinuteColumn = (
    <InfiniteWheelColumn
      baseLength={60}
      getInitialBaseIndex={() => minuteBaseIdx}
      onValueChange={setMinuteBaseIdx}
      renderValue={(i) => {
        const display = i + 1; // 1..60
        return pad2(display === 60 ? 0 : display); // 60 => 00 phút
      }}
      width={52}
    />
  );

  const ampmData = ['AM', 'PM'];

  const handleConfirm = () => {
    const day = dates[dateIdx];

    const hour12 = hourBaseIdx + 1; // 1..12
    let h24 = hour12 % 12; // 12 -> 0 (AM)
    if (ampmIdx === 1) h24 += 12; // PM

    const dispMin = minuteBaseIdx + 1; // 1..60
    const minute = dispMin === 60 ? 0 : dispMin;

    const result = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h24, minute, 0, 0);

    onConfirm?.(result);
    onClose?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>

          <View style={styles.columns}>
            <FiniteWheelColumn
              data={dates}
              selectedIndex={dateIdx}
              onChangeIndex={setDateIdx}
              width={170}
              render={(d) => fmtDate(d)}
            />
            {HourColumn}
            {MinuteColumn}
            <FiniteWheelColumn
              data={ampmData}
              selectedIndex={ampmIdx}
              onChangeIndex={setAmPmIdx}
              width={52}
              render={(x) => x}
            />
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.btn, styles.btnGhost]}>
              <Text style={[styles.btnText, { color: '#6b7280' }]}>{cancelText}</Text>
            </Pressable>
            <Pressable onPress={handleConfirm} style={[styles.btn, styles.btnPrimary]}>
              <Text style={[styles.btnText, { color: 'white' }]}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ================= styles =================
const styles = StyleSheet.create({
  row: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 16, color: '#6b7280' },
  itemTextSel: { color: '#111827', fontWeight: '700' },

  centerLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: ITEM_HEIGHT * Math.floor(VISIBLE_COUNT / 2),
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#cbd5e1',
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  modal: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 14,
    backgroundColor: 'white',
    padding: 14,
  },
  title: { textAlign: 'center', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  columns: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    columnGap: 10,
    paddingVertical: 6,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnGhost: { backgroundColor: '#f3f4f6' },
  btnPrimary: { backgroundColor: '#1e88e5' },
  btnText: { fontSize: 15, fontWeight: '700' },
});
