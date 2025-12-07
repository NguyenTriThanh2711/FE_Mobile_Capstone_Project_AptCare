import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Icon } from '@/src/components/Icon.native';
import { WeatherCard } from '@/src/components/WeatherCard';
import { useWeather } from '@/src/hooks/useWeather';
import { router } from 'expo-router';
import callPhone from '@/src/utils/call-phone';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchSlots, selectSlotsLoading, selectSlotsMap } from '@/src/features/slots/slotsSlice';
import {
  checkInWorkSlot,
  fetchMySchedule,
  selectWorkSlotsError,
  selectWorkSlotsLoading,
  selectWorkSlotsRaw,
} from '@/src/features/technician/workSlotsSlice';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { pad2 } from '@/src/helper/appointResident';
import { dotnetArr } from '@/src/helper/dotnetArr';
import { allowCheckIn, allowCheckOut } from '@/src/helper/canShowCheckIn-Out';
import { pretty } from '@/src/helper/prettyLog';

const StatCard = ({ colors, children, start, end }) => (
  <LinearGradient colors={colors} start={start} end={end} style={styles.statCard}>
    {children}
  </LinearGradient>
);

const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function TechnicianDashboard() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  const slotMap = useAppSelector(selectSlotsMap);
  const slotsLoading = useAppSelector(selectSlotsLoading);
  const scheduleRaw = useAppSelector(selectWorkSlotsRaw);
  const schedLoading = useAppSelector(selectWorkSlotsLoading);
  const schedError = useAppSelector(selectWorkSlotsError);
  console.log('[scheduleRaw]', pretty(scheduleRaw));
  useEffect(() => {
    dispatch(fetchSlots());
    const today = new Date();
    const from = new Date(today);
    const to = new Date(today);
    from.setDate(from.getDate() - 1);
    to.setDate(to.getDate() + 1);
    dispatch(fetchMySchedule({ fromDate: ymd(from), toDate: ymd(to) }));
  }, [dispatch]);

  const todayKey = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return ymd(d);
  }, []);

  const todayData = useMemo(() => {
    const arr = dotnetArr(scheduleRaw);
    return arr.find((d) => d?.date === todayKey) || null;
  }, [scheduleRaw, todayKey]);

  const todayShifts = useMemo(() => {
    if (!todayData) return [];
    const slotsArr = dotnetArr(todayData.slots);
    return slotsArr
      .map((sl) => {
        const info = slotMap[sl.slotId] || {};
        const fromTime = info.fromTime || '00:00:00';
        const toTime = info.toTime || '00:00:00';
        const tws = dotnetArr(sl.technicianWorkSlots)?.[0] || null;
        const key = `${todayData.date}-${sl.slotId}`;
        const status = tws?.status || 'NotStarted';
        return {
          id: key,
          date: todayData.date,
          slotId: sl.slotId,
          fromTime,
          toTime,
          status,
          workSlotRaw: tws,
          appointments: dotnetArr(tws?.appointments) || [],
        };
      })
      .sort((a, b) => (a.fromTime || '').localeCompare(b.fromTime || ''));
  }, [todayData, slotMap]);

  const allJobs = useMemo(() => {
    if (!todayShifts.length) return [];
    const jobs = [];

    todayShifts.forEach((shift) => {
      shift.appointments.forEach((appt) => {
        const req = appt.repairRequest || {};
        const apt = req.apartment || {};
        const apartmentId =
          apt.room || apt.roomNumber || apt.apartmentId || apt.apartmentCode || '---';
        const floor = apt.floor || apt.floorId || '-';

        const startIso =
          appt.startTime || `${shift.date}T${shift.fromTime || '00:00:00'}`;
        const timeLabel = startIso.slice(11, 16);

        const isEmergency = req.isEmergency === true;
        const priority = isEmergency ? 'Khẩn cấp' : 'Thường';

        const typeRaw = appt.type || appt.appointmentType || req.type;
        const type =
          String(typeRaw || '').toLowerCase().includes('inspect') ||
          String(typeRaw || '').toLowerCase().includes('survey')
            ? 'Inspection'
            : 'Repair';

        const isMaintenance = !!req.maintenanceScheduleId;

        const contactPhone =
          apt.residentPhone ||
          apt.phoneNumber ||
          apt.phone ||
          appt.contactPhone ||
          '';

        jobs.push({
          id: appt.appointmentId,
          _startKey: startIso,
          apartment: { apartmentId, floor },
          title: req.object || appt.title || 'Công việc',   // object
          description: req.description || '',               // description
          isMaintenance,
          type,
          priority,
          time: timeLabel,
          status: apt.status || 'Chờ xử lý',
          contact: {
            name: apt.residentName || '',
            phone: contactPhone,
          },
        });
      });
    });

    return jobs.sort((a, b) => new Date(a._startKey) - new Date(b._startKey));
  }, [todayShifts]);


  const stats = useMemo(() => {
    const todayTotal = allJobs.length;
    const inspectionsToday = allJobs.filter((j) => j.type === 'Inspection').length;
    const repairsToday = allJobs.filter((j) => j.type === 'Repair').length;
    const completedToday = allJobs.filter((j) => j.status === 'Đã hoàn thành').length;
    const urgentTasks = allJobs.filter((j) => j.priority === 'Khẩn cấp').length;
    return { todayTotal, inspectionsToday, repairsToday, completedToday, urgentTasks };
  }, [allJobs]);

  const todayJobs = useMemo(() => allJobs.slice(0, 3), [allJobs]);
  console.log('Today jobs:', pretty(todayJobs));
  const getPriorityColor = (priorityVi) => {
    switch (priorityVi) {
      case 'Khẩn cấp':
        return '#FF3B30';
      case 'Thường':
        return '#007AFF';
      default:
        return '#FF69B4';
    }
  };

  const handleQuickAction = (action) => {
    Alert.alert('Thao tác nhanh', `${action} – sắp có!`);
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const greetingText = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 11) {
      return 'Chào buổi sáng,';
    } else if (hour >= 11 && hour < 13) {
      return 'Chào buổi trưa,';
    } else if (hour >= 13 && hour < 18) {
      return 'Chào buổi chiều,';
    } else {
      return 'Chào buổi tối,';
    }
  }, []);

  const quickCheckInShift = useMemo(
    () => todayShifts.find((s) => s.status === 'NotStarted'),
    [todayShifts]
  );
  const hasShiftToCheckIn = !!quickCheckInShift;

  const quickCheckOutShift = useMemo(
    () =>
      todayShifts.find(
        (s) =>
          (s.status === 'Working' || s.status === 'InProgress') 
        
          // && allowCheckOut(s)
      ),
    [todayShifts]
  );

  const hasAnyShiftToday = todayShifts.length > 0;
  const canCheckInNow = useMemo(
    () =>
      !!todayShifts.find(
        (s) => s.status === 'NotStarted'
      ),
    [todayShifts]
  );

  const hasShiftToCheckOut = !!quickCheckOutShift;

  const checkInLabel = !hasAnyShiftToday
    ? 'Không có ca hôm nay'
    : hasShiftToCheckIn
    ? 'Bắt đầu ca'
    : 'Đã check-in';

  const checkInDisabled = !hasAnyShiftToday || !canCheckInNow;
  const checkOutDisabled = !hasShiftToCheckOut;

  const handleQuickCheckIn = () => router.push('/(technician)/check-in-qr');
  const handleQuickCheckOut = () => router.push('/(technician)/checkout-qr');

  const { data, loading, error } = useWeather();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          {greetingText + ' ' + (user?.lastName || '')}
        </Text>
        <Text style={styles.date}>{todayStr}</Text>
      </View>

      <WeatherCard weather={data} loading={loading} error={error} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>

        <View style={styles.statsRow}>
          <StatCard start={{ x: 0, y: 1 }} end={{ x: 1, y: 1 }} colors={['#eb9625', '#9aeb25']}>
            <Icon name="calendar" size={22} color="#1976D2" />
            <Text style={styles.statNumber}>{stats.todayTotal}</Text>
            <Text style={styles.statLabel}>Tổng công việc</Text>
          </StatCard>

          <StatCard start={{ x: 0, y: 1 }} end={{ x: 1, y: 1 }} colors={['#9aeb25', '#1cff00']}>
            <Icon name="checkmark.seal" size={22} color="#0A84FF" />
            <Text style={styles.statNumber}>{stats.inspectionsToday}</Text>
            <Text style={styles.statLabel}>Kiểm tra hôm nay</Text>
          </StatCard>

          <StatCard start={{ x: 0, y: 1 }} end={{ x: 1, y: 1 }} colors={['#1cff00', '#0085ff']}>
            <Icon name="wrench.and.screwdriver" size={22} color="#F57C00" />
            <Text style={styles.statNumber}>{stats.repairsToday}</Text>
            <Text style={styles.statLabel}>Sửa chữa hôm nay</Text>
          </StatCard>
        </View>

        <View style={styles.statsRow}>
          <StatCard start={{ x: 0, y: 1 }} end={{ x: 1, y: 0 }} colors={['#eb9625', '#64da12']}>
            <Icon name="checkmark.circle" size={22} color="#388E3C" />
            <Text style={styles.statNumber}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Đã hoàn thành</Text>
          </StatCard>

          <StatCard start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} colors={['#64da12', '#0085ff']}>
            <Icon name="exclamationmark.triangle" size={22} color="#D32F2F" />
            <Text style={styles.statNumber}>{stats.urgentTasks}</Text>
            <Text style={styles.statLabel}>Khẩn cấp</Text>
          </StatCard>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={[
              styles.quickActionButton,
              checkInDisabled && styles.quickActionButtonDisabled,
            ]}
            onPress={canCheckInNow ? handleQuickCheckIn : undefined}
            disabled={checkInDisabled}
          >
            <Icon
              name="play.circle.fill"
              size={26}
              color={checkInDisabled ? '#9CA3AF' : '#34C759'}
            />
            <Text style={styles.quickActionText}>{checkInLabel}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.quickActionButton,
              checkOutDisabled && styles.quickActionButtonDisabled,
            ]}
            onPress={hasShiftToCheckOut ? handleQuickCheckOut : undefined}
            disabled={checkOutDisabled}
          >
            <Icon
              name="stop.circle.fill"
              size={26}
              color={checkOutDisabled ? '#9CA3AF' : '#8E8E93'}
            />
            <Text style={styles.quickActionText}>Kết thúc ngày</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('Khẩn cấp')}
          >
            <Icon name="exclamationmark.triangle.fill" size={26} color="#FF3B30" />
            <Text style={styles.quickActionText}>Khẩn cấp</Text>
          </Pressable>

          <Pressable
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('Nghỉ giải lao')}
          >
            <Icon name="pause.circle.fill" size={26} color="#FF9500" />
            <Text style={styles.quickActionText}>Nghỉ giải lao</Text>
          </Pressable>

        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Công việc hôm nay (gần nhất)</Text>

        {todayJobs.map((job) => (
          <View key={job.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.leftHeader}>
                <Text style={styles.apartment}>
                  {job.isMaintenance
                    ? job.title                          
                    : (job.apartment.apartmentId || job.title)} 
                </Text>
                
                {!job.isMaintenance? 
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: getPriorityColor(job.priority) },
                  ]}
                >
                  <Text style={styles.badgeText}>{job.priority}</Text>
                </View>
                 : 
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: getPriorityColor(job.isMaintenance) },
                  ]}
                >
                  <Text style={styles.badgeText}>Bảo trì</Text>
                </View>
                }
              </View>
              <Text style={styles.timeText}>{job.time}</Text>
            </View>

            <View style={styles.metaRow}>
              {!job.isMaintenance && (
                <>
                  <View style={styles.metaItem}>
                    <Icon name="building.2" size={14} color="#6b7280" />
                    <Text style={styles.metaText}>
                      <Text style={styles.metaStrong}>
                        {job.apartment.floor ? `Lầu ${job.apartment.floor}` : job.apartment.floor}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.metaItem}>
                    <Icon name="door.left.hand.closed" size={14} color="#6b7280" />
                    <Text style={styles.metaText}>
                      Phòng:{' '}
                      <Text style={styles.metaStrong}>{job.apartment.apartmentId}</Text>
                    </Text>
                  </View>

                  {!!job.contact?.phone && (
                    <Pressable
                      style={styles.metaItem}
                      onPress={() => callPhone(job.contact.phone)}
                    >
                      <Icon name="phone" size={14} color="#007AFF" />
                      <Text style={[styles.metaText, styles.metaStrong]}>
                        {job.contact.phone}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>

            <Text style={styles.jobTitle}>
              {job.isMaintenance
                ? (job.description || 'Không có mô tả')
                : (job.title || 'Không có tiêu đề')}
            </Text>

            <View style={styles.cardFooter}>
              <View style={styles.statusChip} />
              <Pressable
                style={styles.linkBtn}
                onPress={() => router.push(`appointment/${job.id}`)}
              >
                <Text style={styles.linkText}>Xem chi tiết</Text>
                <Icon name="chevron.right" size={16} color="#007AFF" />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  header: { padding: 20, paddingTop: 10 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  date: { fontSize: 15, color: '#666' },

  weatherCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#E9F2FF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  weatherTemp: { fontSize: 22, fontWeight: '800', color: '#0B5ED7' },
  weatherFeels: { fontSize: 12, color: '#334155', marginTop: 2 },
  weatherRight: { alignItems: 'flex-end' },
  weatherRow: { fontSize: 12, color: '#334155', marginBottom: 2 },
  weatherCond: { fontSize: 12, color: '#0B5ED7', fontWeight: '700', marginTop: 4 },

  section: { paddingHorizontal: 20, marginBottom: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginTop: 6, marginBottom: 2 },
  statLabel: { fontSize: 12, color: '#000000', textAlign: 'center' },

  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionButtonDisabled: { opacity: 0.6 },
  quickActionText: { fontSize: 13, color: '#1a1a1a', marginTop: 8, fontWeight: '500' },

  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  leftHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apartment: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 11, color: 'white', fontWeight: '600' },

  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  typeInspect: { backgroundColor: '#E3F2FD' },
  typeRepair: { backgroundColor: '#FFF3E0' },
  typeText: { fontSize: 11, color: '#1a1a1a', fontWeight: '600' },

  metaRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  metaItem: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  metaText: { fontSize: 12, color: '#6b7280' },
  metaStrong: { color: '#111827', fontWeight: '700' },

  timeText: { fontSize: 13, color: '#666' },
  jobTitle: { fontSize: 14, color: '#333', marginBottom: 10, lineHeight: 18 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusChipText: { fontSize: 11, color: 'white', fontWeight: '600' },

  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
});
