import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { Icon } from '@/src/components/Icon.native';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchReportDetail,
  updateReport,
  deleteReport,
  fetchMyReports,
} from '@/src/features/report/reportSlice';
import MUITextField from '@/src/components/common/MUITextField';
import MediaSection from '@/src/components/ImagePickerStrip';
import * as Yup from 'yup';
import Toast from 'react-native-toast-message';

const schema = Yup.object().shape({
  title: Yup.string().trim().required('Tiêu đề là bắt buộc.'),
  description: Yup.string().trim().nullable(),
});

export default function ReportDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const reportId = Number(id);

  const dispatch = useAppDispatch();
  const {
    reportDetail,
    loadingReportDetail,
    reportDetailError,
    updatingReport,
    updatingError,
    deletingReport,
  } = useAppSelector((state) => state.report);

  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [images, setImages] = useState([]); // [{ uri, name, type, _fromServer?, mediaId? }]
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (reportId) {
      dispatch(fetchReportDetail(reportId));
    }
  }, [reportId, dispatch]);

  useEffect(() => {
    if (reportDetail) {
      setTitle(reportDetail.title || '');
      setDesc(reportDetail.description || '');
      setErrors({});

      const medias =
        reportDetail.medias?.$values || reportDetail.medias || [];
      const mapped = medias.map((m) => ({
        uri: m.filePath,
        name: m.fileName || `media_${m.mediaId}`,
        type: m.contentType || 'image/jpeg',
        _fromServer: true,
        mediaId: m.mediaId,
      }));
      setImages(mapped);
    }
  }, [reportDetail]);

  const onValidate = async () => {
    try {
      const values = { title, description: desc };
      await schema.validate(values, { abortEarly: false });
      setErrors({});
      return values;
    } catch (err) {
      if (err.inner) {
        const nextErrors = {};
        err.inner.forEach((e) => {
          if (e.path) nextErrors[e.path] = e.message;
        });
        setErrors(nextErrors);
      }
      throw err;
    }
  };

  const onSave = async () => {
    try {
      const { title: validTitle, description } = await onValidate();

      if (!reportDetail?.commonAreaObject?.commonAreaObjectId) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi dữ liệu',
          text2: 'Thiếu thông tin đối tượng khu vực chung.',
        });
        return;
      }

      await dispatch(
        updateReport({
          id: reportId,
          data: {
            commonAreaObjectId:
              reportDetail.commonAreaObject.commonAreaObjectId,
            title: validTitle,
            description: description || '',
          },
        })
      ).unwrap();

      await dispatch(fetchReportDetail(reportId));

      Toast.show({
        type: 'success',
        text1: 'Đã lưu thay đổi',
      });

      setEditMode(false);
    } catch (err) {
      if (!err?.inner && updatingError) {
        Toast.show({
          type: 'error',
          text1: 'Cập nhật thất bại',
          text2:
            typeof updatingError === 'string'
              ? updatingError
              : 'Vui lòng thử lại.',
        });
      }
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Xoá báo cáo',
      'Bạn chắc chắn muốn xoá báo cáo này? Hành động này không thể hoàn tác.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteReport(reportId)).unwrap();
              dispatch(
                fetchMyReports({
                  page: 1,
                  size: 20,
                })
              );
              Toast.show({
                type: 'success',
                text1: 'Đã xoá báo cáo',
              });
              router.navigate('/(resident)/my-reports');
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: 'Xoá báo cáo thất bại',
              });
            }
          },
        },
      ]
    );
  };

  const renderContent = useCallback(() => {
    if (loadingReportDetail) {
      return <ActivityIndicator style={{ marginTop: 24 }} />;
    }

    if (reportDetailError) {
      return (
        <Text style={styles.errorText}>
          {String(reportDetailError)}
        </Text>
      );
    }

    if (!reportDetail) return null;

    const obj = reportDetail.commonAreaObject;
    const ca = obj?.commonArea;

    const createdAt = reportDetail.createdAt
      ? new Date(reportDetail.createdAt)
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

    return (
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 32 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topInfoCard}>
          <View style={styles.topInfoRow}>
            <View style={styles.topAvatar}>
              <Icon name="person" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.topName}>
                {reportDetail.user
                  ? `${reportDetail.user.firstName} ${reportDetail.user.lastName}`
                  : 'Người dùng'}
              </Text>
              {!!createdStr && (
                <View style={styles.metaRow}>
                  <Icon name="clock" size={12} color="#9CA3AF" />
                  <Text style={styles.metaTextMuted}>{createdStr}</Text>
                </View>
              )}
            </View>
            {/* <View>
              <Text style={styles.badgeStatus(reportDetail.status)}>
                {reportDetail.status}
              </Text>
            </View> */}
          </View>
        </View>
        {obj && (
          <View style={styles.objectCard}>
            <Text style={styles.sectionLabel}>Đối tượng & khu vực</Text>
            <View style={styles.objectRow}>
              <View style={styles.objectIconWrap}>
                <Icon
                  name="wrench.and.screwdriver"
                  size={18}
                  color="#4B5563"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.objectName} numberOfLines={2}>
                  {obj.name}
                </Text>
                {!!obj.description && (
                  <Text style={styles.objectDesc} numberOfLines={2}>
                    {obj.description}
                  </Text>
                )}
              </View>
            </View>
            {!!ca && (
              <View style={styles.commonAreaBlock}>
                <View style={styles.commonAreaHeader}>
                  <View style={styles.commonAreaIconWrap}>
                    <Icon
                      name="building.2"
                      size={18}
                      color="#4F46E5"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={styles.commonAreaName}
                      numberOfLines={2}
                    >
                      {ca.name}
                    </Text>
                    {!!ca.description && (
                      <Text
                        style={styles.commonAreaDesc}
                        numberOfLines={2}
                      >
                        {ca.description}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.commonAreaMetaRow}>
                  {!!ca.areaCode && (
                    <View style={styles.metaPill}>
                      <Icon
                        name="doc.plaintext"
                        size={12}
                        color="#6B7280"
                      />
                      <Text style={styles.metaPillText}>
                        {ca.areaCode}
                      </Text>
                    </View>
                  )}

                  {!!ca.floor && (
                    <View style={[styles.metaPill, { marginLeft: 6 }]}>
                      <Icon
                        name="door.left.hand.closed"
                        size={12}
                        color="#4F46E5"
                      />
                      <Text style={styles.metaPillText}>
                        Tầng {ca.floor}
                      </Text>
                    </View>
                  )}

                  {/* {!!ca.status && (
                    <View style={[styles.metaPill, { marginLeft: 6 }]}>
                      <Icon
                        name="checkmark.seal"
                        size={12}
                        color={
                          ca.status === 'Active' ? '#16A34A' : '#6B7280'
                        }
                      />
                      <Text style={styles.metaPillText}>{ca.status}</Text>
                    </View>
                  )} */}
                </View>

                {!!ca.location && (
                  <View style={styles.commonAreaLocationRow}>
                    <Icon name="map.pin" size={12} color="#6B7280" />
                    <Text
                      style={styles.commonAreaLocation}
                      numberOfLines={2}
                    >
                      {ca.location}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
        <View style={styles.contentCard}>
          <View style={{alignItems: "center"}}><Text style={styles.sectionTitle}>Nội dung báo cáo</Text></View>
          
          <View pointerEvents={editMode ? 'auto' : 'none'}> 
          <MUITextField
            label="Tiêu đề"
            value={title}
            onChangeText={editMode ? setTitle : () => {}}
            size="medium"
            error={editMode && !!errors.title}
            helperText={editMode ? errors.title : ''}
            style ={{ marginBottom: 12 }}
          />
          </View>
          <View pointerEvents={editMode ? 'auto' : 'none'}> 
          <MUITextField
            label="Mô tả"
            value={desc}
            onChangeText={editMode ? setDesc : () => {}}  //  không cho sửa khi view
            size="large"
            multiline
            numberOfLines={4}
            style={{ marginBottom: 12 }}
          />
          </View>
          
        </View>
        <Text style={styles.sectionTitle}>Hình ảnh</Text>
        <MediaSection
          mode={editMode ? 'update' : 'view'}
          title=""
          items={
            !editMode
              ? reportDetail.medias?.$values || reportDetail.medias || []
              : []
          }
          mapUri={(m) => m.filePath}
          mapKey={(m) => String(m.mediaId)}
          value={editMode ? images : []}
          onChange={editMode ? setImages : undefined}
          maxCount={10}
          style={{ marginBottom: 16 }}
        />

        {updatingError && !editMode && (
          <Text style={styles.errorText}>{String(updatingError)}</Text>
        )}
      </ScrollView>
    );
  }, [
    loadingReportDetail,
    reportDetailError,
    reportDetail,
    editMode,
    title,
    desc,
    images,
    errors,
    insets.bottom,
    updatingError,
  ]);

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
          onPress={() => router.navigate('/(resident)/my-reports')}
          style={styles.headerLeft}
          hitSlop={8}
        >
          <Icon name="chevron.left" size={22} color="#ffffff" />
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#fff' }]}>
          Chi tiết báo cáo
        </Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setEditMode((v) => !v)}
            style={styles.headerIconBtn}
          >
            <Icon
              name={editMode ? 'xmark' : 'pencil'}
              size={18}
              color="#ffffff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={styles.headerIconBtn}
            disabled={deletingReport}
          >
            {deletingReport ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="trash" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {renderContent()}

      {editMode && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: 12 + insets.bottom,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.saveBtn,
              updatingReport && { opacity: 0.7 },
            ]}
            onPress={onSave}
            disabled={updatingReport}
          >
            {updatingReport ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon
                  name="paperplane.fill"
                  size={18}
                  color="#ffffff"
                />
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 70,
    justifyContent: 'flex-end',
  },
  headerIconBtn: {
    padding: 6,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  topInfoCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topAvatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  topName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaTextMuted: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
  },

  sectionLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
    fontWeight: '600',
  },
  objectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  objectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  objectDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  commonAreaBlock: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  commonAreaHeader: {
    flexDirection: 'row',
  },
  commonAreaIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  commonAreaName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  commonAreaDesc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  commonAreaMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  commonAreaLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  commonAreaLocation: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },

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
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 4,
    fontWeight: '500',
  },
  descriptionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: '#374151',
  },
  titleBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  titleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  errorText: {
    marginTop: 16,
    marginHorizontal: 16,
    color: '#B91C1C',
    fontSize: 12,
  },
});