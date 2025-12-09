import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Icon } from '@/src/components/Icon.native';
import { dotnetArr } from '@/src/helper/dotnetArr';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchSlots,
  selectSlotsLoading,
  selectSlotsMap,
} from '@/src/features/slots/slotsSlice';
import {
  fetchMySchedule,
  selectWorkSlotsRaw,
  selectWorkSlotsLoading,
  selectWorkSlotsError,
} from '@/src/features/technician/workSlotsSlice';
import AppointmentCard from '@/src/components/AppointmentCard';
import { router, useFocusEffect } from 'expo-router';
import Badge from '@/src/components/Badge';
import Toast from 'react-native-toast-message';
import { pad2 } from '@/src/helper/appointResident';
import { pretty } from '@/src/helper/prettyLog';

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

const ymd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function formatViDate(d) {
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const atMidnight = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export default function TechnicianSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = useMemo(() => ymd(selectedDate), [selectedDate]);
  const dispatch = useAppDispatch();

  const [pending, setPending] = useState(null); // { type: 'in' | 'out', slotKey }
  const [refreshing, setRefreshing] = useState(false);

  const slotMap = useAppSelector(selectSlotsMap);
  const slotsLoading = useAppSelector(selectSlotsLoading);

  const scheduleRaw = useAppSelector(selectWorkSlotsRaw);
  const schedLoading = useAppSelector(selectWorkSlotsLoading);
  const schedError = useAppSelector(selectWorkSlotsError);
  useEffect(() => {
    if (!schedError) return;

    Toast.show({
      type: 'error',
      text1: 'Không tải được lịch làm việc',
      text2: String(schedError),
    });
  }, [schedError]);

  useEffect(() => {
    dispatch(fetchSlots());
  }, [dispatch]);

  // load lịch ±7 ngày quanh selectedDate
  useEffect(() => {
    const from = new Date(selectedDate);
    const to = new Date(selectedDate);
    from.setDate(from.getDate() - 7);
    to.setDate(to.getDate() + 7);
    dispatch(fetchMySchedule({ fromDate: ymd(from), toDate: ymd(to) }));
  }, [dispatch, selectedDate]);

  const reloadAroundSelected = useCallback(async () => {
    try {
      setRefreshing(true);
      const from = new Date(selectedDate);
      from.setDate(from.getDate() - 7);
      const to = new Date(selectedDate);
      to.setDate(to.getDate() + 7);
      await dispatch(
        fetchMySchedule({ fromDate: ymd(from), toDate: ymd(to) })
      ).unwrap();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Làm mới lịch làm việc thất bại',
        text2: String(e),
      });
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      reloadAroundSelected();
      return () => {};
    }, [reloadAroundSelected])
  );

  const isNotStarted = (s) => s?.status === 'NotStarted';
  const isWorking = (s) => s?.status === 'Working' || s?.status === 'InProgress';
  const isCompleted = (s) => s?.status === 'Completed';

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
    const idx = twoWeekDates.findIndex(
      (d) => d.toDateString() === selectedDate.toDateString()
    );
    if (idx < 0 || !dateListRef.current) return;
    const x = 16 + idx * (60 + 10);
    requestAnimationFrame(() => {
      dateListRef?.current?.scrollTo({ x, animated: true });
    });
  }, [twoWeekDates, selectedDate]);

  const dayData = useMemo(() => {
    const arr = dotnetArr(scheduleRaw);
    return arr.find((d) => d?.date === dateStr) || null;
  }, [scheduleRaw, dateStr]);

  //console.log('[dayData]', pretty(dayData));
  //console.log('[slotMap]', slotMap);

  const shifts = useMemo(() => {
    if (!dayData) return [];
    const slotsArr = dotnetArr(dayData.slots);
    console.log('[slotsArr]',pretty(slotsArr));
    return slotsArr
      .map((sl) => {
        console.log('[slot]', pretty(sl));
        const info = slotMap?.[sl.slotId] || {};
        console.log('[[info]]', info);
        const tws = dotnetArr(sl.technicianWorkSlots)?.[0] || null;

        const appointments = dotnetArr(tws?.appointments) || [];

        const slotFromTime = info.fromTime || null;
        const slotToTime = info.toTime || null;

        let actualFrom = null;
        let actualTo = null;

        if (appointments.length > 0) {
          const byStart = [...appointments].sort(
            (a, b) =>
              new Date(a.startTime || a.createdAt || 0) -
              new Date(b.startTime || b.createdAt || 0)
          );
          const byEnd = [...appointments].sort(
            (a, b) =>
              new Date(a.endTime || a.startTime || a.createdAt || 0) -
              new Date(b.endTime || b.startTime || b.createdAt || 0)
          );

          const first = byStart[0];
          const last = byEnd[byEnd.length - 1];

          actualFrom = first?.startTime || null;
          actualTo =
            last?.endTime || last?.startTime || null;
        }

        const key = `${dayData.date}-${sl.slotId}`;
        const status = tws?.status || 'NotStarted';

        return {
          id: key,
          date: dayData.date,
          slotId: sl.slotId,
          // giờ slot cấu hình
          fromTime: slotFromTime,
          toTime: slotToTime,
          // giờ thực tế theo appointments
          actualFrom,
          actualTo,
          status,
          appointments,
        };
      })
      // sort theo giờ ca (slotFromTime) để hiển thị từ sớm tới muộn
      .sort((a, b) => {
        const fa = a.fromTime || '00:00:00';
        const fb = b.fromTime || '00:00:00';
        return fa.localeCompare(fb);
      });
  }, [dayData, slotMap]);

  console.log('[shifts]', shifts);

  const totalAppointments = useMemo(
    () => shifts.reduce((sum, s) => sum + (s.appointments?.length || 0), 0),
    [shifts]
  );

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await reloadAroundSelected();
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Làm mới lịch làm việc thất bại',
        text2: String(e),
      });
    } finally {
      setRefreshing(false);
    }
  }, [reloadAroundSelected]);

  return (
    <View style={styles.container}>
      <View style={styles.dateSelector}>
        <ScrollView
          ref={dateListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateScroll}
        >
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
                onPress={() => setSelectedDate(atMidnight(d))}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.dayTextSel,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {d.toLocaleDateString('vi-VN', { weekday: 'short' })}
                </Text>
                <Text
                  style={[
                    styles.dateNum,
                    isSelected && styles.dayTextSel,
                    isToday && !isSelected && styles.dayTextToday,
                  ]}
                >
                  {d.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Lịch ngày {formatViDate(selectedDate)}</Text>
        <Text style={styles.subTitle}>
          {shifts.length} ca • {totalAppointments} cuộc hẹn
        </Text>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {(!dayData || shifts.length === 0) && !schedLoading && (
          <View style={styles.emptyWrap}>
            <Icon name="list.bullet" size={24} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Không có ca nào trong ngày</Text>
          </View>
        )}

        {shifts.map((shift) => {
          // Ưu tiên giờ thực tế theo appointment
          const startLabel = shift.fromTime
            ? shift.fromTime.slice(0, 5)
            : '--:--';

          const endLabel = shift.toTime
            ? shift.toTime.slice(0, 5)
            : '--:--';

          const slotKey = `${shift.date}-${shift.slotId}`;
          const loadingThis =
            pending && pending.slotKey === slotKey ? pending.type : null;

          const slotInfo = slotMap?.[shift.slotId];
          const slotName = slotInfo?.slotName || `Ca ${shift.slotId}`;

          return (
            <View key={shift.id} style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.timeCol}>
                  <Icon name="clock" size={16} color={colors.textSecondary} />
                  <View>
                    <Text style={styles.timeText}>
                      {startLabel} - {endLabel}
                    </Text>
                    <Text style={styles.slotNameText}>
                      {slotName}
                    </Text>
                  </View>
                </View>
                <Badge status={shift.status} style={styles.statusChip} />
              </View>

              <View style={styles.actionsRow}>
                {isNotStarted(shift) && (
                  <Pressable
                    style={[
                      styles.btn,
                      styles.btnPrimary,
                      loadingThis === 'in' && { opacity: 0.6 },
                    ]}
                    onPress={() => router.push('/(technician)/check-in-qr')}
                  >
                    <Icon name="play.circle" size={16} color="#fff" />
                    <Text style={[styles.btnText, styles.btnPrimaryText]}>
                      Điểm danh
                    </Text>
                  </Pressable>
                )}

                {isWorking(shift) && (
                  <Pressable
                    style={[
                      styles.btn,
                      styles.btnDanger,
                      loadingThis === 'out' && { opacity: 0.6 },
                    ]}
                    onPress={() => router.push('/(technician)/checkout-qr')}
                  >
                    {loadingThis === 'out' ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Icon name="stop.circle" size={16} color="#fff" />
                        <Text style={[styles.btnText, styles.btnPrimaryText]}>
                          Điểm danh kết thúc ca
                        </Text>
                      </>
                    )}
                  </Pressable>
                )}

                {isCompleted(shift) && (
                  <Pressable
                    style={[styles.btn, styles.btnSecondary]}
                  >
                    <Icon name="stop.circle" size={16} color="#fff" />
                    <Text style={[styles.btnText, styles.btnPrimaryText]}>
                      Ca đã hoàn thành
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.apptHeader}>
                <Text style={styles.apptTitle}>Cuộc hẹn trong ca</Text>
                <Text style={styles.apptCount}>
                  {shift.appointments.length} mục
                </Text>
              </View>

              {shift.appointments.length === 0 ? (
                <Text style={styles.empty}>Không có appointment</Text>
              ) : (
                shift.appointments.map((a) => (
                  <View key={a.appointmentId} style={styles.apptBox}>
                    <AppointmentCard
                      appt={a}
                      onPress={() =>
                        router.push(`/appointment/${a.appointmentId}`)
                      }
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
  dateItemSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateItemToday: { borderColor: colors.primary, borderWidth: 2 },
  dayText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
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

  emptyWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
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
  timeCol: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeText: { fontSize: 13, color: colors.textSecondary },
  slotNameText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
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
  btnSecondary: { backgroundColor: '#6e6e6e' },
  btnText: { fontSize: 13, fontWeight: '700' },
  btnPrimaryText: { color: '#fff' },

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
