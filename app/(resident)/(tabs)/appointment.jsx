import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import { router } from 'expo-router';
import MonthCalendar from '@/src/components/MonthCalendar';
import {
  fetchResidentScheduleByMonth,
  selectResidentDayAppointments,
  selectResidentEventsByDate,
  selectResidentMonthKey,
  selectResidentMonthLoading,
} from '@/src/features/appointments/appointmentsSlice';
import { pad2 } from '@/src/helper/appointResident';
import { dayDate } from '@/src/utils/date';
import { pretty } from '@/src/helper/prettyLog';
import Badge from '@/src/components/Badge';

export default function ResidentScheduleScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  // ngày hôm nay
  const today = useMemo(() => new Date(), []);

  // ngày đang chọn (YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = today;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });

  // năm/tháng hiện tại của lịch để fetch data
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonthIndex, setCurrentMonthIndex] = useState(today.getMonth());

  // key tháng
  const key = useAppSelector((s) =>
    selectResidentMonthKey(s, currentYear, currentMonthIndex)
  );

  // data từ Redux
  const eventsByDate = useAppSelector((s) => selectResidentEventsByDate(s, key));
  const dayAppointments = useAppSelector((s) =>
    selectResidentDayAppointments(s, key, selectedDate)
  );
  const loadingMonth = useAppSelector((s) => selectResidentMonthLoading(s, key));

  console.log('[data] day appointment', pretty(dayAppointments));

  // fetch lịch theo tháng khi currentYear/currentMonthIndex đổi
  useEffect(() => {
    dispatch(
      fetchResidentScheduleByMonth({
        year: currentYear,
        monthIndex: currentMonthIndex,
      })
    );
  }, [dispatch, currentYear, currentMonthIndex]);

  // MonthCalendar báo về khi đổi tháng
  const handleMonthChange = useCallback((y, mIdx) => {
    setCurrentYear(y);
    setCurrentMonthIndex(mIdx);
  }, []);

  // pull-to-refresh: dùng currentYear/currentMonthIndex
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await dispatch(
        fetchResidentScheduleByMonth({
          year: currentYear,
          monthIndex: currentMonthIndex,
        })
      ).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, currentYear, currentMonthIndex]);

  return (
    <View style={styles.screen}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: 36,
          paddingHorizontal: 16,
          paddingBottom: 24 + insets.bottom + 56,
          gap: 12,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1e88e5']}
            tintColor="#1e88e5"
          />
        }
      >
        {/* Calendar card */}
        <View style={styles.card}>
          <MonthCalendar
            initialDate={today}
            eventsByDate={eventsByDate}
            onSelectDate={setSelectedDate}
            onMonthChange={handleMonthChange}
          />
        </View>

        {/* Day header */}
        <View style={styles.dayHeader}>
          <Icon name="calendar" size={16} color="#6B7280" />
          <Text style={styles.dayHeaderText}>Lịch hẹn ngày {dayDate(selectedDate)}</Text>
          <View style={{ flex: 1 }} />
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{dayAppointments.length}</Text>
          </View>
        </View>

        {/* List */}
        {loadingMonth && Object.keys(eventsByDate).length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator />
            <Text style={styles.muted}>Đang tải lịch tháng…</Text>
          </View>
        ) : dayAppointments.length === 0 ? (
          <View style={styles.centerBox}>
            <Icon name="list.bullet" size={22} color="#9CA3AF" />
            <Text style={styles.muted}>Không có lịch hẹn trong ngày này</Text>
          </View>
        ) : (
          dayAppointments
            .slice()
            .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)))
            .map((appt) => {
              const isEmergency = appt?.repairRequest?.isEmergency === true;
              const issueName = appt?.repairRequest?.issue?.name;
              const technician = appt?.technicians?.[0]
                ? `${appt.technicians[0].firstName} ${appt.technicians[0].lastName}`.trim()
                : null;

              return (
                <Pressable
                  key={appt.appointmentId}
                  style={styles.item}
                  // onPress={() =>
                  //   router.push({
                  //     pathname: '/appointment/[id]',
                  //     params: { id: String(appt.appointmentId) },
                  //   })
                  // }
                >
                  {/* dòng giờ */}
                  <View style={styles.itemRow}>
                    <Icon name="clock" size={14} color="#6B7280" />
                    <Text style={styles.itemTime}>
                      {new Date(appt.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' – '}
                      {new Date(appt.endTime || appt.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>

                    {/* trạng thái */}
                    <Badge
                      status={appt.status}
                      style={styles.statusPill}
                      textStyle={styles.statusText}
                    />
                  </View>

                  {/* tiêu đề yêu cầu */}
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {appt?.repairRequest?.object || 'Lịch hẹn'}
                  </Text>

                  {/* tên issue */}
                  {issueName ? (
                    <View style={[styles.itemRow, { marginTop: 4 }]}>
                      <Icon name="wrench.and.screwdriver" size={14} color="#6B7280" />
                      <Text style={styles.meta}>{issueName}</Text>
                    </View>
                  ) : null}

                  {/* emergency + căn hộ */}
                  <View style={[styles.itemRow, { marginTop: 4 }]}>
                    <Icon name="building.2" size={14} color="#6B7280" />
                    <Text style={styles.meta}>
                      Căn hộ {appt?.repairRequest?.apartment?.room ?? '-'}
                    </Text>

                    {isEmergency ? (
                      <View style={styles.emergencyTag}>
                        <Text style={styles.emergencyText}>Khẩn</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* kỹ thuật viên */}
                  {technician ? (
                    <View style={[styles.itemRow, { marginTop: 4 }]}>
                      <Icon name="person.fill" size={14} color="#6B7280" />
                      <Text style={styles.meta}>{technician}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F9FA' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayHeaderText: { fontSize: 16, fontWeight: '800', color: '#111827' },
  countChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#3B82F6',
  },
  countChipText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  centerBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8 },
  muted: { color: '#6B7280' },
  item: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemTime: { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  itemTitle: { marginTop: 6, fontSize: 15, fontWeight: '800', color: '#111827' },
  meta: { color: '#374151', fontSize: 13 },

  statusPill: {
    marginLeft: 'auto',
  },
  emergencyTag: {
    marginLeft: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  emergencyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
});