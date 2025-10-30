import React, { useEffect, useMemo, useRef, useState } from 'react';
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
} from '@/src/features/technician/workSlotsSlice';
import AppointmentCard from '@/src/components/AppointmentCard';
import { router } from 'expo-router';
import { pretty } from '@/src/helper/prettyLog';

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

const pad2 = (n) => String(n).padStart(2, '0');

// Local YYYY-MM-DD (theo local time, tránh lệch UTC)
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

  const slotMap = useAppSelector(selectSlotsMap);
  const slotsLoading = useAppSelector(selectSlotsLoading);

  const scheduleRaw = useAppSelector(selectWorkSlotsRaw);
  // console.log("const scheduleRaw", scheduleRaw);
  const schedLoading = useAppSelector(selectWorkSlotsLoading);
  const schedError = useAppSelector(selectWorkSlotsError);

  // checkin/checkout local tạm
  const [checkState, setCheckState] = useState({});

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

  const canShowCheckout = (shift) => {
    if (!shift.checkedInAt || shift.checkedOutAt) return false;
    const end = dateAt(shift.date, shift.toTime);
    return minutesUntil(end) <= 30;
  };

  const handleCheckIn = async (_shift) => {
    // TODO: gọi API check-in sau
  };

  const handleCheckOut = async (_shift) => {
    // TODO: gọi API check-out sau
  };

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
        return {
          id: key,
          date: dayData.date,
          slotId: sl.slotId,
          fromTime,
          toTime,
          status: tws?.status || 'NotStarted',
          checkedInAt: checkState[key]?.checkedInAt || null,
          checkedOutAt: checkState[key]?.checkedOutAt || null,
          appointments: dotnetArr(tws?.appointments) || [],
        };
      })
      .sort((a, b) => (a.fromTime || '').localeCompare(b.fromTime || ''));
  }, [dayData, slotMap, checkState]);

  const totalAppointments = useMemo(
    () => shifts.reduce((sum, s) => sum + (s.appointments?.length || 0), 0),
    [shifts]
  );

  // console.log('const shifts', shifts);

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
          const endDate = dateAt(shift.date, shift.toTime);
          const minsToEnd = minutesUntil(endDate);

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
                <View
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: shift.checkedOutAt
                        ? colors.success
                        : shift.checkedInAt
                          ? colors.primary
                          : '#8E8E93',
                    },
                  ]}>
                  <Text style={styles.statusText}>
                    {shift.checkedOutAt
                      ? 'Đã check-out'
                      : shift.checkedInAt
                        ? 'Đang trong ca'
                        : 'Chưa bắt đầu'}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              {/* <View style={styles.actionsRow}>
                {!shift.checkedInAt && (
                  <Pressable
                    style={[styles.btn, styles.btnPrimary]}
                    onPress={() => handleCheckIn(shift)}
                  >
                    <Icon name="play.circle" size={16} color="#fff" />
                    <Text style={[styles.btnText, styles.btnPrimaryText]}>Check-in</Text>
                  </Pressable>
                )}

                {canShowCheckout(shift) && (
                  <Pressable
                    style={[styles.btn, styles.btnDanger]}
                    onPress={() => handleCheckOut(shift)}
                  >
                    <Icon name="stop.circle" size={16} color="#fff" />
                    <Text style={[styles.btnText, styles.btnPrimaryText]}>Check-out</Text>
                  </Pressable>
                )}

                {shift.checkedInAt && !canShowCheckout(shift) && !shift.checkedOutAt && (
                  <View style={styles.hint}>
                    <Icon name="info.circle" size={14} color={colors.warning} />
                    <Text style={styles.hintText}>
                      Check-out khả dụng trong {Math.max(minsToEnd - 30, 0)} phút nữa
                    </Text>
                  </View>
                )}
              </View> */}

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

  emptyWrap: { alignItems: 'center', gap: 8, paddingVertical: 28 },
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

  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '700' },

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
