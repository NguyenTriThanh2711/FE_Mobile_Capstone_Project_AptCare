// app/(resident)/select-common-area.jsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import MUITextField from '@/src/components/common/MUITextField';
import {
  fetchCommonAreas,
  setSearch,
  setSelectedCommonArea,
  setStatusFilter,
} from '@/src/features/commonArea/commonAreasSlice';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '@/src/components/Icon.native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SelectCommonAreaScreen() {
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { filteredItems, loading, error, search, statusFilter } = useSelector(
    (state) => state.commonAreas
  );

  useEffect(() => {
    dispatch(fetchCommonAreas());
  }, [dispatch]);

  const onSelect = (item) => {
    dispatch(setSelectedCommonArea(item));
    router.push({
      pathname: '/(resident)/report-create',
      params: { commonAreaId: item.commonAreaId },
    });
  };

  const renderItem = ({ item }) => {
    const isInactive = item.status !== 'Active';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onSelect(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardRow}>
          {/* Icon khu vực */}
          <View style={styles.cardIconWrap}>
            <Icon
              name="building.2"
              size={20}
              color={isInactive ? '#6B7280' : '#4F46E5'}
            />
          </View>

          {/* Nội dung */}
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.name}
              </Text>
              {/* <Text style={styles.cardStatus(item.status)}>
                {item.status === 'Active' ? 'Hoạt động' : item.status}
              </Text> */}
            </View>

            <View style={styles.cardMetaRow}>
              {!!item.areaCode && (
                <View style={styles.metaPill}>
                  <Icon name="square.grid.2x2" size={12} color="#6B7280" />
                  <Text style={styles.metaPillText}>{item.areaCode}</Text>
                </View>
              )}

              {!!item.floor && (
                <View style={[styles.metaPill, { marginLeft: 6 }]}>
                  <Icon
                    name="door.left.hand.closed"
                    size={12}
                    color="#4F46E5"
                  />
                  <Text style={styles.metaPillText}>Tầng {item.floor}</Text>
                </View>
              )}
            </View>

            {!!item.description && (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {!!item.location && (
              <View style={styles.cardLocationRow}>
                <Icon name="map.pin" size={14} color="#6B7280" />
                <Text style={styles.cardLocation} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header gradient */}
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
          onPress={() => router.back()}
          style={styles.headerLeft}
          hitSlop={8}
        >
          <Icon name="chevron.left" size={24} color="#fffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#fffffff' }]}>
          Chọn khu vực chung để báo cáo
        </Text>
        <View style={{ width: 50 }} />
      </LinearGradient>

      {/* Tìm kiếm + filter trạng thái */}
      <View style={styles.filterRow}>
        <View style={styles.searchWrapper}>
          <MUITextField
            label="Tìm kiếm tên khu vực"
            value={search}
            onChangeText={(text) => dispatch(setSearch(text))}
            variant="outlined"
            size="small"
            startIcon="magnifyingglass"
          />
        </View>

        {/* <View style={styles.statusFilterWrap}>
          {['Active', 'Inactive', 'All'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[
                styles.chip,
                statusFilter === st && styles.chipActive,
              ]}
              onPress={() => dispatch(setStatusFilter(st))}
            >
              <Text
                style={[
                  styles.chipText,
                  statusFilter === st && styles.chipTextActive,
                ]}
              >
                {st === 'All' ? 'Tất cả' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </View> */}
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
      {!loading && error && (
        <Text style={styles.errorText}>{String(error)}</Text>
      )}

      <FlatList
        data={filteredItems}
        keyExtractor={(item, idx) => String(item.commonAreaId || idx)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  /* ===== Layout chung ===== */
  container: { flex: 1, backgroundColor: '#F3F4F6' },

  /* ===== Header ===== */
  headerBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 0,
  },
  headerGradient: {
    backgroundColor: 'transparent',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },

  /* ===== Filter tìm kiếm ===== */
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
    marginBottom: 10,
  },
  statusFilterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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

  /* ===== Card khu vực ===== */
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
    shadowRadius: 3,
    shadowOpacity: 0.04,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
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
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
    color: status === 'Active' ? '#166534' : '#991B1B',
    backgroundColor: status === 'Active' ? '#DCFCE7' : '#FEE2E2',
  }),
  cardMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  cardLocation: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },

  /* ===== Meta pill dùng chung (reuse từ CreateReportScreen) ===== */
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  metaPillText: {
    fontSize: 11,
    color: '#374151',
    marginLeft: 4,
  },

  errorText: {
    marginTop: 8,
    color: '#B91C1C',
    fontSize: 12,
    paddingHorizontal: 16,
  },
});