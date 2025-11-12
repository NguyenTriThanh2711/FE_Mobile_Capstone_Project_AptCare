import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Icon } from '@/src/components/Icon.native';
import { dotnetArr } from '@/src/helper/dotnetArr';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { fetchSlots, selectSlotsLoading, selectSlotsMap } from '@/src/features/slots/slotsSlice';
import {
  fetchMySchedule,
  selectWorkSlotsRaw,
  selectWorkSlotsLoading,
  selectWorkSlotsError,
  checkInWorkSlot,
} from '@/src/features/technician/workSlotsSlice';
import AppointmentCard from '@/src/components/AppointmentCard';
import { router } from 'expo-router';
import { pretty } from '@/src/helper/prettyLog';
import Badge from '@/src/components/Badge';
import Toast from 'react-native-toast-message';
import { set } from 'react-hook-form';
import { allowCheckIn, allowCheckOut, dateAtLocal, minutesFromNow, tooLateForCheckIn } from '@/src/helper/canShowCheckIn-Out';
import { pad2 } from '@/src/helper/appointResident';

/* ========= utils ========= */
const colors = {
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  text: '#1a1a1a',
  textSecondary: '#666',
  bg: '#f8f9fa',
  white: '#fff',
  border: '#e5e5e5',
};

const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function formatViDate(d) {
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function dateAt(dateStr, hhmmss) {
  const [h, m, s] = (hhmmss || '00:00:00').split(':').map((x) => parseInt(x, 10) || 0);
  const dt = new Date(`${dateStr}T00:00:00`);
  dt.setHours(h, m, s, 0);
  return dt;
}

function minutesUntil(dtEnd) {
  const diffMs = dtEnd - new Date();
  return Math.floor(diffMs / 60000);
}

const atMidnight = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export default function TechnicianSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  // console.log("const selectedDate", selectedDate);
  const dateStr = useMemo(() => ymd(selectedDate), [selectedDate]);
  // console.log("const dateStr", dateStr);
  const dispatch = useAppDispatch();
  
  const [pending, setPending] = useState(null); 
  const slotMap = useAppSelector(selectSlotsMap);
  const slotsLoading = useAppSelector(selectSlotsLoading);

  const scheduleRaw = useAppSelector(selectWorkSlotsRaw);
  // console.log("const scheduleRaw", scheduleRaw);
  const schedLoading = useAppSelector(selectWorkSlotsLoading);
  const schedError = useAppSelector(selectWorkSlotsError);

  // fetch danh mục slots 1 lần
  useEffect(() => {
    dispatch(fetchSlots());
  }, [dispatch]);

  // fetch lịch theo khung ±7 ngày quanh selectedDate
  useEffect(() => {
    const from = new Date(selectedDate);
    const to = new Date(selectedDate);
    from.setDate(from.getDate() - 7);
    to.setDate(to.getDate() + 7);
    dispatch(fetchMySchedule({ fromDate: ymd(from), toDate: ymd(to) }));
  }, [dispatch, selectedDate]);
  const reloadAroundSelected = useCallback(async () => {
    const from = new Date(selectedDate); from.setDate(from.getDate() - 7);
    const to   = new Date(selectedDate); to.setDate(to.getDate() + 7);
    await dispatch(fetchMySchedule({ fromDate: ymd(from), toDate: ymd(to) }));
  }, [dispatch, selectedDate]);
  const isNotStarted = (s) => s?.status === 'NotStarted';
  const isWorking    = (s) => s?.status === 'Working' || s?.status === 'InProgress';
  const isCompleted  = (s) => s?.status === 'Completed';

  const handleCheckIn = useCallback(async (shift) => {
    const slotKey = `${shift.date}-${shift.slotId}`;
    try {
      setPending({ type: 'in', slotKey });
      await dispatch(checkInWorkSlot({ date: shift.date, slotId: shift.slotId })).unwrap();
      Toast.show({ type: 'success', text1: 'Đã điểm danh' });
      await reloadAroundSelected(); // lấy lại status mới từ BE
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Điểm danh thất bại' });
    } finally {
      setPending(null);
    }
  }, [dispatch, reloadAroundSelected]);

  const handleCheckOut = useCallback(async (shift) => {
    const slotKey = `${shift.date}-${shift.slotId}`;
    try {
      setPending({ type: 'out', slotKey });
      // await dispatch(checkOutWorkSlot({ date: shift.date, slotId: shift.slotId })).unwrap();
      // hoặc nếu endpoint là /api/workslots/check-out:
      // await dispatch(checkOutWorkSlot({ date: shift.date, slotId: shift.slotId })).unwrap();
      Toast.show({ type: 'success', text1: 'Đã kết thúc ca' });
      await reloadAroundSelected();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Kết ca thất bại' });
    } finally {
      setPending(null);
    }
  }, [dispatch, reloadAroundSelected]);

  // week selector
  const dateListRef = useRef(null);
  const twoWeekDates = useMemo(() => {
    const base = new Date(selectedDate);
    const start = new Date(base);
    start.setDate(base.getDate() - 7);
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  useEffect(() => {
    const idx = twoWeekDates.findIndex((d) => d.toDateString() === selectedDate.toDateString());
    if (idx < 0 || !dateListRef.current) return;
    const x = 16 + idx * (60 + 10); // ước lượng width 60 + gap 10
    requestAnimationFrame(() => {
      dateListRef.current.scrollTo({ x, animated: true });
    });
  }, [twoWeekDates, selectedDate]);

  // data ngày đang chọn
  const dayData = useMemo(() => {
    const arr = dotnetArr(scheduleRaw);
    // console.log("const arr = dotnetArr", pretty(arr));
    return arr.find((d) => d?.date === dateStr) || null;
  }, [scheduleRaw, dateStr]);

  // console.log("const dayData", pretty(dayData));

  const shifts = useMemo(() => {
    if (!dayData) return [];
    const slotsArr = dotnetArr(dayData.slots);
    // console.log('slot arr',slotsArr)
    return slotsArr
      .map((sl) => {
        const info = slotMap[sl.slotId] || {};
        const fromTime = info.fromTime || '00:00:00';
        const toTime = info.toTime || '00:00:00';
        const tws = dotnetArr(sl.technicianWorkSlots)?.[0] || null; // 1 kỹ thuật/slot (hiện tại)
        const key = `${dayData.date}-${sl.slotId}`;
        const status = tws?.status || 'NotStarted';
        return {
          id: key,
          date: dayData.date,
          slotId: sl.slotId,
          fromTime,
          toTime,
          status,
          appointments: dotnetArr(tws?.appointments) || [],
        };
      })
      .sort((a, b) => (a.fromTime || '').localeCompare(b.fromTime || ''));
  }, [dayData, slotMap]);

  const totalAppointments = useMemo(
    () => shifts.reduce((sum, s) => sum + (s.appointments?.length || 0), 0),
    [shifts]
  );

  // console.log('[Data]: const shifts', pretty(shifts));
  return (
    <View style={styles.container}>
      {/* Week selector */}
      <View style={styles.dateSelector}>
        <ScrollView
          ref={dateListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}>
          {twoWeekDates.map((d, idx) => {
            const isSelected = d.toDateString() === selectedDate.toDateString();
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <Pressable
                key={idx}
                style={[
                  styles.dateItem,
                  isSelected && styles.dateItemSelected,
                  isToday && !isSelected && styles.dateItemToday,
                ]}
                onPress={() => setSelectedDate(atMidnight(d))}>
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSel,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}>
                  {d.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    isSelected && styles.dayTextSel,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}>
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Lịch ngày {formatViDate(selectedDate)}</Text>
        <Text style={styles.subTitle}>
          {shifts.length} ca • {totalAppointments} cuộc hẹn
        </Text>
      </View>

      {/* Loading / Error */}
      {(slotsLoading || schedLoading) && (
        <View style={{ paddingVertical: 16 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
      {!!schedError && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>{String(schedError)}</Text>
        </View>
      )}

      {/* Shift cards */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
        {(!dayData || shifts.length === 0) && !schedLoading && (
          <View style={styles.emptyWrap}>
            <Icon name="list.bullet" size={24} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Không có ca nào trong ngày</Text>
          </View>
        )}

        {shifts.map((shift) => {
          const startLabel = (shift.fromTime || '').slice(0, 5);
          const endLabel = (shift.toTime || '').slice(0, 5);
          const endDate = dateAtLocal(shift.date, shift.toTime);
          const minsToEnd = minutesFromNow(endDate);

          return (
            <View key={shift.id} style={styles.card}>
              {/* Time & status */}
              <View style={styles.rowTop}>
                <View style={styles.timeCol}>
                  <Icon name="clock" size={16} color={colors.textSecondary} />
                  <Text style={styles.timeText}>
                    {startLabel} - {endLabel}
                  </Text>
                </View>
                <Badge status={shift.status} style={styles.statusChip} />
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                {/* {isNotStarted(shift) && allowCheckIn(shift) && ( */}
                {isNotStarted(shift) && (
                  <Pressable style={[styles.btn, styles.btnPrimary]} onPress={() => handleCheckIn(shift)}>
                    <Icon name="play.circle" size={16} color="#fff" />
                    <Text style={[styles.btnText, styles.btnPrimaryText]}>Điểm danh</Text>
                  </Pressable>
                )}
                {/* vắng */}
                {/* {isNotStarted(shift) && tooLateForCheckIn(shift) && (
                  <View style={[styles.btn, { backgroundColor: '#F3F4F6', opacity: 0.8 }]}>
                    <Icon name="xmark.circle" size={16} color="#9CA3AF" />
                    <Text style={[styles.btnText, { color: '#9CA3AF', fontWeight: '800' }]}>Vắng</Text>
                  </View>
                )} */}
                {allowCheckOut(shift) && (
                  <Pressable style={[styles.btn, styles.btnDanger]} onPress={() => handleCheckOut(shift)}>
                    <Icon name="stop.circle" size={16} color="#fff" />
                    <Text style={[styles.btnText, styles.btnPrimaryText]}>Điểm danh kết thúc ca</Text>
                  </Pressable>
                )}

                {isWorking(shift) && !allowCheckOut(shift) && (
                  <View style={styles.hint}>
                    <Icon name="circle" size={14} color={colors.warning} />
                    <Text style={styles.hintText}>
                      {(() => {
                        const endDate = dateAtLocal(shift.date, shift.toTime);
                        const minsToEnd = minutesFromNow(endDate);
                        return `Check-out khả dụng trong ${Math.max(minsToEnd - 30, 0)} phút nữa`;
                      })()}
                    </Text>
                  </View>
                )}
              </View> 

              {/* Appointments */}
              <View style={styles.apptHeader}>
                <Text style={styles.apptTitle}>Cuộc hẹn trong ca</Text>
                <Text style={styles.apptCount}>{shift.appointments.length} mục</Text>
              </View>

              {shift.appointments.length === 0 ? (
                <Text style={styles.empty}>Không có appointment</Text>
              ) : (
                shift.appointments.map((a) => (
                  <View key={a.appointmentId} style={styles.apptBox}>
                    <AppointmentCard
                      appt={a}
                      onPress={() => router.push(`/appointment/${a.appointmentId}`)}
                    />
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ============== styles ============== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  dateSelector: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dateScroll: { paddingHorizontal: 16, gap: 10 },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 60,
    backgroundColor: '#F4F6F8',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateItemSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateItemToday: { borderColor: colors.primary, borderWidth: 2 },
  dayText: { fontSize: 12, color: colors.textSecondary, marginBottom: 2, fontWeight: '500' },
  dayTextSel: { color: '#fff' },
  dayTextToday: { color: colors.primary },
  dateNum: { fontSize: 16, fontWeight: '700', color: colors.text },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 2 },
  subTitle: { fontSize: 13, color: colors.textSecondary },

  list: { flex: 1, padding: 16 },

  emptyWrap: { alignItems: 'center', gap: 8, paddingVertical: 50, paddingHorizontal: 20 },
  emptyText: { color: colors.textSecondary },

  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },

  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 13, color: colors.textSecondary },

  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  btnPrimary: { backgroundColor: colors.primary },
  btnDanger: { backgroundColor: colors.danger },
  btnText: { fontSize: 13, fontWeight: '700' },
  btnPrimaryText: { color: '#fff' },

  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
  },
  hintText: { color: colors.warning, fontSize: 12, fontWeight: '600' },

  apptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 8,
  },
  apptTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  apptCount: { fontSize: 12, color: colors.textSecondary },

  empty: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },

  // Box riêng cho mỗi appointment (tách bạch)
  apptBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
