import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Icon } from '@/src/components/Icon.native';
import { dotnetArr } from '@/src/helper/dotnetArr';
import {
  fetchRepairRequests,
  selectRequests,
  selectRequestsLoading,
  selectRequestsPageData,
} from '@/src/features/requests/requestsSlice';
import { useAppDispatch, useAppSelector } from '@/src/store';
import RequestListItem from '@/src/components/RequestListItem';
import { pretty } from '@/src/helper/prettyLog';
import { useDebounce } from '@/src/utils/debounce';


export default function ResidentRequests() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  // console.log('requests user', dotnetArr(user?.apartments));
  const apartments = useMemo(() => dotnetArr(user?.apartments ?? []), [user]);
  // console.log('request apartment', apartments);
  const list = useAppSelector(selectRequests);
  // console.log('requests user list', pretty(list?.[0]));
  const loading = useAppSelector(selectRequestsLoading);
  const { page, totalPages } = useAppSelector(selectRequestsPageData);

  const [openAptPicker, setOpenAptPicker] = useState(false);
  const [apartmentId, setApartmentId] = useState(apartments?.[0]?.apartmentId);
  const [search, setSearch] = useState('');
  const [emergencyOnly, setEmergencyOnly] = useState(undefined);

  const debouncedSearch = useDebounce(search, 100);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    (p = 1) => {
      if (!apartmentId) return;
      dispatch(
        fetchRepairRequests({
          page: p,
          size: 10,
          search: debouncedSearch || undefined,
          //debounced || undefined,
          isEmergency: typeof emergencyOnly === 'boolean' ? emergencyOnly : undefined,
          apartmentId,
          sortBy: 'createdAt:desc',
        })
      );
    },
    [dispatch,
      debouncedSearch
      , emergencyOnly, apartmentId]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const onRefresh = useCallback(async () => { 
    if (!apartmentId) return;
    try {
      setRefreshing(true);
      await dispatch(
        fetchRepairRequests({
          page: 1,
          size: 10,
          search: debouncedSearch || undefined,
          isEmergency: typeof emergencyOnly === 'boolean' ? emergencyOnly : undefined,
          apartmentId,
          sortBy: 'createdAt:desc',
        })
      ).unwrap();
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, apartmentId, debouncedSearch, emergencyOnly]);

  const loadMore = () => {
    if (!loading && page < totalPages) load(page + 1);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu cầu của tôi</Text>
        <Text style={styles.headerSubtitle}>Theo dõi yêu cầu sữa chữa</Text>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Apartment Picker */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 5 }}>
          <Pressable onPress={() => setOpenAptPicker(true)} style={styles.aptChip}>
            <Icon name="building.2" size={14} color="#6b7280" />
            <Text style={styles.aptChipText}>
              {apartmentId ? `Căn hộ số ${apartmentId}` : 'Chọn căn hộ'}
            </Text>
            <Icon name="chevron.down" size={14} color="#6b7280" />
          </Pressable>
          <Pressable
            onPress={() =>
              setEmergencyOnly((prev) =>
                prev === undefined ? true : prev === true ? false : undefined
              )
            }
            style={styles.filterChip}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {emergencyOnly === true ? (
                  <Icon name="exclamationmark.triangle.fill" size={14} color="#B45309" />
                ) : (
                 null
                )}
                <Text style={styles.filterChipText}>
                  {emergencyOnly === true
                    ? 'Chỉ khẩn cấp'
                    : emergencyOnly === false
                    ? 'Yêu cầu thường'
                    : 'Tất cả yêu cầu'}
                </Text>
              </View>
          </Pressable>
        </View>
        {/* Search */}
        <View style={styles.searchBox}>
          <Icon name="magnifyingglass" size={16} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Tìm theo nội dung..."
            style={{ flex: 1, paddingVertical: 6, fontSize: 14 }}
            returnKeyType="search"
            onSubmitEditing={() => load(1)}
          />
          {search ? (
            <Pressable onPress={() => setSearch('')}>
              <Icon name="xmark.circle.fill" size={16} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Apt picker modal */}
      <Modal
        visible={openAptPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenAptPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Chọn căn hộ</Text>
            <ScrollView style={{ maxHeight: 360 }}>
              {apartments?.map((apt) => {
                const active = apartmentId === apt.apartmentId;
                return (
                  <Pressable
                    key={apt.apartmentId}
                    onPress={() => {
                      setApartmentId(apt.apartmentId);
                      setOpenAptPicker(false);
                    }}
                    style={[styles.optionItem, active && styles.optionItemActive]}>
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>
                      {`Tầng ${apt.floor} - Phòng ${apt.room}`}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* List */}
      <ScrollView 
        contentContainerStyle={{ paddingTop: 16 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1e88e5']} 
            tintColor="#1e88e5"  // này hiển thị cho ios  
            title={refreshing ? 'Đang làm mới...' : undefined}
          />
        }
      >
        {loading && page === 1 ? <ActivityIndicator style={{ marginTop: 8 }} /> : null}

        {Array.isArray(list) &&
          list.map((r) => {
            return <RequestListItem key={r.repairRequestId} item={r} />;
          })}

        {/* Load more */}
        {page < totalPages ? (
          <Pressable style={styles.loadMore} onPress={loadMore} disabled={loading}>
            <Text style={styles.loadMoreText}>{loading ? 'Đang tải...' : 'Tải thêm'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },

  toolbar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  aptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  aptChipText: { fontSize: 13, color: '#111827', fontWeight: '600' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  filterChipText: { fontSize: 13, color: '#B45309', fontWeight: '700' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 14, padding: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, color: '#111827' },
  optionItem: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10 },
  optionItemActive: { backgroundColor: '#E7F0FF' },
  optionText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  optionTextActive: { fontWeight: '700' },

  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1, marginRight: 10 },
  desc: { fontSize: 14, color: '#374151', marginBottom: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLeft: { fontSize: 12, color: '#6B7280' },
  metaRight: { fontSize: 12, color: '#007AFF', fontWeight: '600' },

  loadMore: {
    marginTop: 6,
    marginBottom: 24,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
  },
  loadMoreText: { fontSize: 14, color: '#111827', fontWeight: '700' },
});
