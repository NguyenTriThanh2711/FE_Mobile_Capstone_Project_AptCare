// app/(resident)/report-create.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  createReport,
  fetchCommonAreaObjects,
  resetReportState,
  setSelectedObject,
} from '@/src/features/report/reportSlice';
import MUITextField from '@/src/components/common/MUITextField';
import ImagePickerStrip from '@/src/components/ImagePickerStrip';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientButton from '@/src/components/common/GradientButton';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router'; // 👈 thêm
import { compressMany } from '@/src/utils/imageCompression';

const FOOTER_HEIGHT = 64;

export default function CreateReportScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();

  const params = route.params || {};
  const { commonAreaId } = params;

  const {
    commonAreaObjects,
    loadingObjects,
    objectsError,
    selectedObject,
    creating,
    createError,
    createdReport,
  } = useAppSelector((state) => state.report);

  const { selectedCommonArea } = useAppSelector((state) => state.commonAreas);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState([]); // [{ uri, name, type }]
  const [showObjectError, setShowObjectError] = useState(false);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    if (commonAreaId) {
      dispatch(fetchCommonAreaObjects(commonAreaId));
    }

    return () => {
      dispatch(resetReportState());
    };
  }, [commonAreaId, dispatch]);

  // 🎯 TẠO THÀNH CÔNG → NHẢY THẲNG QUA DETAIL
  useEffect(() => {
    if (createdReport && createdReport.reportId) {
      // có thể thêm Toast nếu thích, nhưng theo yêu cầu là qua luôn detail
      router.replace(`/(resident)/report/${createdReport.reportId}`);
    }
  }, [createdReport]);

  const onSubmit = async () => {
    let hasError = false;

    if (!selectedObject) {
      setShowObjectError(true);
      hasError = true;
    }

    if (!title.trim()) {
      setTitleError('Vui lòng nhập tiêu đề báo cáo.');
      hasError = true;
    } else {
      setTitleError('');
    }

    if (hasError) return;
    const filesCompressed = await compressMany(images, {
      maxWidth: 1280,
      quality: 0.7,
      format: 'jpeg',
    });
    dispatch(
      createReport({
        commonAreaObjectId: selectedObject.commonAreaObjectId,
        title: title.trim(),
        description: desc.trim(),
        files: filesCompressed,
      })
    );
  };

  const handleSelectObject = (item) => {
    dispatch(setSelectedObject(item));
    if (showObjectError) {
      setShowObjectError(false);
    }
  };

  const renderObjectItem = (item) => {
    const isActive =
      selectedObject?.commonAreaObjectId === item.commonAreaObjectId;

    return (
      <TouchableOpacity
        key={item.commonAreaObjectId}
        style={[styles.objectCard, isActive && styles.objectCardActive]}
        onPress={() => handleSelectObject(item)}
        activeOpacity={0.85}
      >
        <View style={styles.objectRow}>
          <View style={styles.objectIconWrap}>
            <Icon
              name="wrench.and.screwdriver"
              size={20}
              color={isActive ? '#1D4ED8' : '#4B5563'}
            />
          </View>

          <View style={styles.objectContent}>
            <View style={styles.objectHeader}>
              <Text style={styles.objectName} numberOfLines={2}>
                {item.name}
              </Text>

              <Text style={styles.objectStatus(item.status)}>
                {item.status === 'Active' ? 'Hoạt động' : item.status}
              </Text>
            </View>

            {!!item.description && (
              <Text style={styles.objectDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {(item.commonArea?.floor || item.commonArea?.location) && (
              <View style={styles.objectMetaRow}>
                {!!item.commonArea?.floor && (
                  <View style={styles.metaPill}>
                    <Icon name="door.left.hand.closed" size={12} color="#4F46E5" />
                    <Text style={styles.metaPillText}>
                      Tầng {item.commonArea.floor}
                    </Text>
                  </View>
                )}

                {!!item.commonArea?.location && (
                  <View style={[styles.metaPill, { marginLeft: 6 }]}>
                    <Icon name="map.pin" size={12} color="#6B7280" />
                    <Text style={styles.metaPillText} numberOfLines={1}>
                      {item.commonArea.location}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER gradient giống style app */}
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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerLeft}
          hitSlop={8}
          activeOpacity={0.7}
        >
          <Icon name="chevron.left" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo báo cáo khu vực chung</Text>
        <View style={{ width: 72 }} />
      </LinearGradient>

      {/* NỘI DUNG */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom: FOOTER_HEIGHT + insets.bottom + 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info khu vực chung */}
        {selectedCommonArea && (
          <View style={styles.commonAreaInfo}>
            <View style={styles.commonAreaTopRow}>
              <View style={styles.commonAreaIconWrap}>
                <Icon name="building.2" size={22} color="#4F46E5" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.commonAreaLabel}>Khu vực chung</Text>
                <Text style={styles.commonAreaName} numberOfLines={2}>
                  {selectedCommonArea.name}
                </Text>

                <View style={styles.commonAreaMetaRow}>
                  {!!selectedCommonArea.areaCode && (
                    <View style={styles.metaPill}>
                      <Icon name="square.grid.2x2" size={12} color="#6B7280" />
                      <Text style={styles.metaPillText}>
                        {selectedCommonArea.areaCode}
                      </Text>
                    </View>
                  )}

                  {!!selectedCommonArea.floor && (
                    <View style={[styles.metaPill, { marginLeft: 6 }]}>
                      <Icon
                        name="door.left.hand.closed"
                        size={12}
                        color="#4F46E5"
                      />
                      <Text style={styles.metaPillText}>
                        Tầng {selectedCommonArea.floor}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {!!selectedCommonArea.location && (
              <View style={styles.commonAreaLocationRow}>
                <Icon name="map.pin" size={14} color="#6B7280" />
                <Text style={styles.commonAreaSub} numberOfLines={2}>
                  {selectedCommonArea.location}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Danh sách Object */}
        <Text style={styles.sectionTitle}>Chọn đối tượng</Text>
        {loadingObjects && <ActivityIndicator style={{ marginVertical: 8 }} />}
        {!loadingObjects && objectsError && (
          <Text style={styles.errorText}>{String(objectsError)}</Text>
        )}
        {!loadingObjects && !objectsError && commonAreaObjects.length === 0 && (
          <Text style={styles.emptyText}>
            Không có đối tượng nào trong khu vực này.
          </Text>
        )}
        {!loadingObjects && commonAreaObjects.map(renderObjectItem)}

        {showObjectError && !selectedObject && (
          <Text style={[styles.errorText, { marginTop: 4 }]}>
            Vui lòng chọn đối tượng khu vực chung.
          </Text>
        )}

        {/* Form nhập thông tin report */}
        <Text style={styles.sectionTitle}>Thông tin báo cáo</Text>
        <MUITextField
          label="Tiêu đề *"
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (titleError && text.trim()) {
              setTitleError('');
            }
          }}
          variant="outlined"
          size="medium"
          error={!!titleError}
          helperText={titleError}
          style={{ marginBottom: 12 }}
        />
        <MUITextField
          label="Mô tả chi tiết"
          value={desc}
          onChangeText={setDesc}
          variant="outlined"
          size="large"
          multiline
          numberOfLines={4}
          style={{ marginBottom: 12 }}
        />

        {/* Ảnh đính kèm */}
        <ImagePickerStrip
          mode="update"
          title="Hình ảnh đính kèm"
          value={images}
          onChange={setImages}
          maxCount={10}
          style={{ marginBottom: 16 }}
        />

        {createError && (
          <Text style={styles.errorText}>{String(createError)}</Text>
        )}
      </ScrollView>

      {/* FOOTER cố định với GradientButton giống RequestCreate */}
      <View
        style={[
          styles.footer,
          { height: FOOTER_HEIGHT + insets.bottom, paddingBottom: insets.bottom },
        ]}
      >
        <GradientButton
          title={creating ? 'Đang gửi...' : 'Gửi báo cáo'}
          loading={creating}
          disabled={creating}
          size="medium"
          scheme="normal"
          onPress={onSubmit}
          style={{ borderRadius: 14 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* ===== Layout chung ===== */
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  /* ===== Header ===== */
  headerBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerGradient: {
    backgroundColor: 'transparent',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 50 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },

  /* ===== Footer ===== */
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  /* ===== Khu vực chung (card trên cùng) ===== */
  commonAreaInfo: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  commonAreaTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commonAreaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  commonAreaLabel: {
    fontSize: 11,
    color: '#4F46E5',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commonAreaName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  commonAreaMetaRow: {
    flexDirection: 'row',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  commonAreaLocationRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  commonAreaSub: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },

  /* ===== Section title ===== */
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    marginTop: 8,
  },

  /* ===== Card đối tượng khu vực chung ===== */
  objectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  objectCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    shadowOpacity: 0.08,
  },
  objectRow: {
    flexDirection: 'row',
  },
  objectIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  objectContent: {
    flex: 1,
  },
  objectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  objectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  objectStatus: (status) => ({
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    color: status === 'Active' ? '#166534' : '#991B1B',
    backgroundColor: status === 'Active' ? '#DCFCE7' : '#FEE2E2',
  }),
  objectDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  objectMetaRow: {
    flexDirection: 'row',
    marginTop: 6,
    flexWrap: 'wrap',
  },

  /* ===== Meta pill dùng chung ===== */
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

  /* ===== Error & empty ===== */
  errorText: {
    marginVertical: 6,
    color: '#B91C1C',
    fontSize: 12,
  },
  emptyText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
});
