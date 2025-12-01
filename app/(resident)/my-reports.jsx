import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/src/components/Icon.native';
import { router, useFocusEffect } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchMyReports,
  setMyReportsSearch,
  setMyReportsStatus,
  setMyReportsSortBy,
  clearMyReportsFilters,
} from '@/src/features/report/reportSlice';
import MUITextField from '@/src/components/common/MUITextField';
import Badge from '@/src/components/Badge';

export default function MyReportsScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();

  const {
    myReports,
    loadingMyReports,
    myReportsError,
    myReportsSearch,
    myReportsStatus,
    myReportsSortBy,
    myReportsFromDate,
    myReportsToDate,
  } = useAppSelector((state) => state.report);

  useFocusEffect(
    useCallback(() => {
      dispatch(
        fetchMyReports({
          page: 1,
          size: 20,
          search: myReportsSearch,
          filter: myReportsStatus === 'All' ? '' : myReportsStatus,
          sortBy: myReportsSortBy,
          fromDate: myReportsFromDate,
          toDate: myReportsToDate,
        })
      );
    }, [
      dispatch,
      myReportsSearch,
      myReportsStatus,
      myReportsSortBy,
      myReportsFromDate,
      myReportsToDate,
    ])
  );

  const onRefresh = () => {
    dispatch(
      fetchMyReports({
        page: 1,
        size: 20,
        search: myReportsSearch,
        filter: myReportsStatus === 'All' ? '' : myReportsStatus,
        sortBy: myReportsSortBy,
        fromDate: myReportsFromDate,
        toDate: myReportsToDate,
      })
    );
  };

  const onCreateReport = () => {
    router.push('/(resident)/select-common-area');
  };
  const onPressItem = (item) => {
    router.push(`/(resident)/report/${item.reportId}`);
  };
  const renderItem = ({ item }) => {
    const status = item.status;
    const isActive = status === 'Active';

    const createdAt = item.createdAt
      ? new Date(item.createdAt)
      : null;
    const createdStr = createdAt
      ? `${createdAt.getDate().toString().padStart(2, '0')}/${
          (createdAt.getMonth() + 1).toString().padStart(2, '0')
        }/${createdAt.getFullYear()} ${createdAt
          .getHours()
          .toString()
          .padStart(2, '0')}:${createdAt
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      : '';

    const obj = item.commonAreaObject;
    const ca = obj?.commonArea;

    return (
      <TouchableOpacity style={styles.card} onPress={() => onPressItem(item)} activeOpacity={0.9}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardIconWrap}>
            <Icon
              name="exclamationmark.triangle.fill"
              size={18}
              color={isActive ? '#FFFF33' : '#6B7280'}
            />
          </View>

          <View style={styles.cardMain}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Badge status={status} />
            </View>

            {!!obj?.name && (
              <View style={styles.metaRow}>
                <Icon name="wrench" size={12} color="#4B5563" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {obj.name}
                </Text>
              </View>
            )}

            {!!ca && (
              <View style={styles.metaRow}>
                <Icon name="building.2" size={12} color="#4B5563" />
                <Text style={styles.metaText} numberOfLines={1}>
                  {ca.name}
                </Text>
              </View>
            )}

            {!!createdStr && (
              <View style={styles.metaRow}>
                <Icon name="clock" size={12} color="#6B7280" />
                <Text style={styles.metaTextMuted}>{createdStr}</Text>
              </View>
            )}
          </View>
        </View>
        
        {!!item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            Mô tả :{item.description}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#CC99FF', '#6699CC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.headerBase,
          styles.headerGradient,
          { paddingTop: insets.top + 6 },
        ]}
      >
        <Pressable
          onPress={() => router.navigate('/(resident)/home')}
          style={styles.headerLeft}
          hitSlop={8}
        >
          <Icon name="chevron.left" size={22} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>
          Báo cáo của tôi
        </Text>
        <View style={{ width: 50 }} />
      </LinearGradient>
      <View style={styles.filterRow}>
        <View style={styles.searchWrapper}>
          <MUITextField
            label="Tìm kiếm báo cáo"
            value={myReportsSearch}
            onChangeText={(text) => dispatch(setMyReportsSearch(text))}
            variant="outlined"
            size="small"
            startIcon="magnifyingglass"
          />
        </View>

        <View style={styles.filterChipsRow}>
          {['All', 'Active', 'Inactive'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.chip,
                myReportsStatus === st && styles.chipActive,
              ]}
              onPress={() => dispatch(setMyReportsStatus(st))}
            >
              <Text
                style={[
                  styles.chipText,
                  myReportsStatus === st && styles.chipTextActive,
                ]}
              >
                {st === 'All'
                  ? 'Tất cả'
                  : st === 'Active'
                  ? 'Hoạt động'
                  : 'Inactive'}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.sortChip}
            onPress={() =>
              dispatch(
                setMyReportsSortBy(
                  myReportsSortBy === 'date_desc' ? 'date' : 'date_desc'
                )
              )
            }
          >
            <Icon
              name="arrow.up.arrow.down"
              size={14}
              color="#4B5563"
            />
            <Text style={styles.sortChipText}>
              {myReportsSortBy === 'date_desc'
                ? 'Mới nhất'
                : 'Cũ nhất'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* {loadingMyReports && (
        <ActivityIndicator style={{ marginTop: 16 }} />
      )} */}
      {!loadingMyReports && myReportsError && (
        <Text style={styles.errorText}>{String(myReportsError)}</Text>
      )}

      {!loadingMyReports && !myReportsError && myReports.length === 0 && (
        <View style={styles.emptyWrap}>
          <Icon name="list.bullet" size={40} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Chưa có báo cáo nào</Text>
          <Text style={styles.emptySub}>
            Hãy tạo báo cáo đầu tiên cho khu vực chung bạn đang ở.
          </Text>
        </View>
      )}

      <FlatList
        data={myReports}
        keyExtractor={(item) => String(item.reportId)}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingBottom: 80 + insets.bottom,
          paddingHorizontal: 12,
        }}
        refreshing={loadingMyReports}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity
        style={[
          styles.fab,
          { bottom: 24 + insets.bottom },
        ]}
        onPress={onCreateReport}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#4F46E5', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Icon name="plus" size={20} color="#fff" />
          <Text style={styles.fabText}>Tạo báo cáo</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  headerBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerGradient: {
    backgroundColor: 'transparent',
  },
  headerLeft: {
    width: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  filterRow: {
    marginTop: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchWrapper: {
    marginBottom: 8,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: '#2563EB',
    backgroundColor: '#DBEAFE',
  },
  chipText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#1D4ED8',
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  sortChipText: {
    fontSize: 12,
    color: '#374151',
    marginLeft: 4,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clearFilterText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#3399FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  cardMain: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  cardStatus: (status) => ({
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    color: status === 'Active' ? '#92400E' : '#374151',
    backgroundColor: status === 'Active' ? '#FEF3C7' : '#E5E7EB',
  }),
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
  metaTextMuted: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },
  cardDesc: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
  emptyWrap: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  emptySub: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  errorText: {
    marginTop: 8,
    color: '#B91C1C',
    fontSize: 12,
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});