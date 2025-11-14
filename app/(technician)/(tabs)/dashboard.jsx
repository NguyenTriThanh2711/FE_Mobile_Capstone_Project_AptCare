import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { Icon } from '@/src/components/Icon.native';
import { WeatherCard } from '@/src/components/WeatherCard';
import { useWeather } from '@/src/hooks/useWeather';
import { router } from 'expo-router';
import callPhone from '@/src/utils/call-phone';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchSlots, selectSlotsLoading, selectSlotsMap } from '@/src/features/slots/slotsSlice';
import { fetchMySchedule, selectWorkSlotsError, selectWorkSlotsLoading, selectWorkSlotsRaw } from '@/src/features/technician/workSlotsSlice';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { pad2 } from '@/src/helper/appointResident';

const StatCard = ({ colors, children , start, end }) => (
  <LinearGradient
    colors={colors}
    start={start}
    end={end}
    style={styles.statCard}
  >
    {children}
  </LinearGradient>
);
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export default function TechnicianDashboard() {
  const dispatch = useAppDispatch();

  const slotMap = useAppSelector(selectSlotsMap);
  const slotsLoading = useAppSelector(selectSlotsLoading);
  const scheduleRaw = useAppSelector(selectWorkSlotsRaw);
  const schedLoading = useAppSelector(selectWorkSlotsLoading);
  const schedError = useAppSelector(selectWorkSlotsError);

  useEffect(() => {
    dispatch(fetchSlots());
    const today = new Date();
    const from = new Date(today);
    const to = new Date(today);
    from.setDate(from.getDate() - 1); // chỉ cần -1, +1 cho dashboard
    to.setDate(to.getDate() + 1);
    dispatch(fetchMySchedule({ fromDate: ymd(from), toDate: ymd(to) }));
  }, [dispatch]);
  // ===== Mock data hôm nay =====
  const [stats, setStats] = useState({
    todayTotal: 10,
    inspectionsToday: 4,
    repairsToday: 6,
    completedToday: 3,
    urgentTasks: 2,
  });
  
  const [todayJobs, setTodayJobs] = useState([
    {
      id: 1,
      apartment: { apartmentId: 'A-204', floor: '2' },
      title: 'Rò rỉ vòi nước',
      type: 'Repair',
      priority: 'Thường',
      time: '09:30',
      status: 'Đang xử lý',
      contact: { name: 'Anh Huy', phone: '0901234567' },
    },
    {
      id: 2,
      apartment: { apartmentId: 'B-105', floor: '1' },
      title: 'Kiểm tra định kỳ hệ thống điện',
      type: 'Inspection',
      priority: 'Khẩn cấp',
      time: '11:00',
      status: 'Chờ xử lý',
      contact: { name: 'Chị Lan', phone: '0912345678' },
    },
    {
      id: 3,
      apartment: { apartmentId: 'C-301', floor: '3' },
      title: 'Ổ cắm phòng ngủ',
      type: 'Repair',
      priority: 'Thường',
      time: '14:15',
      status: 'Đã xếp lịch',
      contact: { name: 'Anh Minh', phone: '0987654321' },
    },
  ]);

  const getPriorityColor = (priorityVi) => {
    switch (priorityVi) {
      case 'Khẩn cấp':
        return '#FF3B30';
      case 'Bình thường':
        return '#007AFF';
      default:
        return '#34C759';
    }
  };

  const getStatusColor = (statusVi) => {
    switch (statusVi) {
      case 'Đang xử lý':
        return '#007AFF';
      case 'Chờ xử lý':
        return '#FF9500';
      case 'Đã xếp lịch':
        return '#34C759';
      default:
        return '#8E8E93';
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
  const { data, loading, error } = useWeather();
  console.log('Weather hook:', { data, loading, error });
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Chào buổi sáng, Kỹ thuật viên!</Text>
        <Text style={styles.date}>{todayStr}</Text>
      </View>

      <WeatherCard weather={data} loading={loading} error={error} />
      {/* Tổng quan hôm nay */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tổng quan hôm nay</Text>

        {/* Hàng 1: Tổng, Kiểm tra, Sửa chữa */}
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

        {/* Hàng 2: Hoàn thành, Khẩn cấp */}
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
      {/* Thao tác nhanh */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
        <View style={styles.quickActions}>
          <Pressable
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('Bắt đầu ca')}>
            <Icon name="play.circle.fill" size={26} color="#34C759" />
            <Text style={styles.quickActionText}>Bắt đầu ca</Text>
          </Pressable>
          <Pressable style={styles.quickActionButton} onPress={() => handleQuickAction('Khẩn cấp')}>
            <Icon name="exclamationmark.triangle.fill" size={26} color="#FF3B30" />
            <Text style={styles.quickActionText}>Khẩn cấp</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('Nghỉ giải lao')}>
            <Icon name="pause.circle.fill" size={26} color="#FF9500" />
            <Text style={styles.quickActionText}>Nghỉ giải lao</Text>
          </Pressable>
          <Pressable
            style={styles.quickActionButton}
            onPress={() => handleQuickAction('Kết thúc ngày')}>
            <Icon name="stop.circle.fill" size={26} color="#8E8E93" />
            <Text style={styles.quickActionText}>Kết thúc ngày</Text>
          </Pressable>
        </View>
      </View>

      {/* Công việc hôm nay (gần nhất) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Công việc hôm nay (gần nhất)</Text>

        {todayJobs.map((job) => (
          <View key={job.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.leftHeader}>
                <Text style={styles.apartment}>{job.apartment.apartmentId}</Text>
                <View style={[styles.badge, { backgroundColor: getPriorityColor(job.priority) }]}>
                  <Text style={styles.badgeText}>{job.priority}</Text>
                </View>
                <View
                  style={[
                    styles.typePill,
                    job.type === 'Inspection' ? styles.typeInspect : styles.typeRepair,
                  ]}>
                  <Text style={styles.typeText}>
                    {job.type === 'Inspection' ? 'Kiểm tra' : 'Sửa chữa'}
                  </Text>
                </View>
              </View>
              <Text style={styles.timeText}>{job.time}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="building.2" size={14} color="#6b7280" />
                <Text style={styles.metaText}>
                  Lầu: <Text style={styles.metaStrong}>{job.apartment.floor}</Text>
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="door.left.hand.closed" size={14} color="#6b7280" />
                <Text style={styles.metaText}>
                  Phòng: <Text style={styles.metaStrong}>{job.apartment.apartmentId}</Text>
                </Text>
              </View>
              {!!job.contact?.phone && (
                <Pressable style={styles.metaItem} onPress={() => callPhone(job.contact.phone)}>
                  <Icon name="phone" size={14} color="#007AFF" />
                  <Text style={[styles.metaText, styles.metaStrong]}>{job.contact.phone}</Text>
                </Pressable>
              )}
            </View>

            <Text style={styles.jobTitle}>{job.title}</Text>

            <View style={styles.cardFooter}>
              <View style={[styles.statusChip, { backgroundColor: getStatusColor(job.status) }]}>
                <Text style={styles.statusChipText}>{job.status}</Text>
              </View>

              <Pressable
                style={styles.linkBtn}
                onPress={() => router.push(`appointment/${job.id}`)}>
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

  // Weather
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

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  statusChipText: { fontSize: 11, color: 'white', fontWeight: '600' },

  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
});
