import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from 'react-native-paper';

import { Icon } from '@/src/components/Icon.native';
import MUITextField from '@/src/components/common/MUITextField';
import WheelDateTimePicker from '@/src/components/common/WheelDateTimePicker';
import ImagePickerStrip from '@/src/components/ImagePickerStrip';
import GradientButton from '@/src/components/common/GradientButton';
import RequestPreviewCard from '@/src/components/RequestPreviewCard';

import {
  createEmergencyRepairRequest,
  createNormalRepairRequest,
  getRequest,
  selectRequestCreating,
} from '@/src/features/requests/requestsSlice';
import { fetchIssues, selectIssues, selectIssuesLoading } from '@/src/features/issues/issuesSlice';

import { dotnetArr, unwrapDotNetValuesDeep } from '@/src/helper/dotnetArr';
import { compressMany } from '@/src/utils/imageCompression';
import { toLocalIsoNoOffset } from '@/src/utils/date';

const FOOTER_HEIGHT = 64;

export default function RequestCreate() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const theme = useTheme();

  const { emergency, parentRequestId } = useLocalSearchParams();
  const parentId = parentRequestId ? Number(parentRequestId) : null;

  const isEmergency = emergency === 'true' || emergency === true;
  const isFollowUp = !!parentId;

  const user = useSelector((s) => s.auth.user);

  const creating = useSelector(selectRequestCreating);
  const issues = useSelector(selectIssues);
  const issuesLoading = useSelector(selectIssuesLoading);

  const apartments = useMemo(() => dotnetArr(user?.apartments), [user]);
  const firstAptId = apartments?.[0]?.apartmentId ?? null;

  const [initialLoading, setInitialLoading] = useState(true);
  const [parentReq, setParentReq] = useState(null);

  const [openPicker, setOpenPicker] = useState(false);
  const [openIssuePicker, setOpenIssuePicker] = useState(false);
  const [openAptPicker, setOpenAptPicker] = useState(false);

  const [newImages, setNewImages] = useState([]);
  const [parentImages, setParentImages] = useState([]);

  useEffect(() => {
    dispatch(fetchIssues());
  }, [dispatch]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onTouched',
    defaultValues: {
      apartmentId: firstAptId,
      issueId: null,
      shortSummary: '',
      description: '',
      preferredAt: toLocalIsoNoOffset(new Date()),
    },
  });

  const isBusy = isSubmitting || creating;

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setInitialLoading(true);

        if (isFollowUp) {
          const res = await dispatch(getRequest(String(parentId))).unwrap?.();
          const reqData = unwrapDotNetValuesDeep(res?.data || res);
          if (active) setParentReq(reqData);
        }

      } catch (e) {
        console.log('[init RequestCreate error]', e);
        Toast.show({ type: 'error', text1: 'Không tải được dữ liệu' });
      } finally {
        if (active) setInitialLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch, isFollowUp, parentId]);

  useEffect(() => {
    if (!parentReq) return;

    const aptId = parentReq?.apartment?.apartmentId ?? null;
    if (aptId) setValue('apartmentId', aptId, { shouldDirty: false });

    setValue('issueId', parentReq?.issue?.issueId ?? null, { shouldDirty: false });
    setValue('shortSummary', parentReq?.object ?? '', { shouldDirty: false });
    setValue('description', parentReq?.description ?? '', { shouldDirty: false });

    const medias = dotnetArr(parentReq?.medias);
    setParentImages(medias);
    setNewImages([]);
  }, [parentReq, setValue]);

  const filteredIssues = useMemo(
    () => (issues || []).filter((it) => it.isEmergency === !!isEmergency),
    [issues, isEmergency]
  );

  const selectedApartmentId = watch('apartmentId');
  const issueId = watch('issueId');
  const preferredAtISO = watch('preferredAt');

  const selectedApartment = useMemo(
    () => apartments.find((apt) => apt.apartmentId === selectedApartmentId),
    [apartments, selectedApartmentId]
  );

  const aptLabel = useMemo(() => {
    const apt = isFollowUp ? parentReq?.apartment : selectedApartment;
    if (!apt) return '—';
    const floor = apt?.floor ?? apt?.floorId ?? '-';
    const room = apt?.room ?? apt?.roomNumber ?? '';
    return `Tầng ${floor} - Phòng ${room}`;
  }, [isFollowUp, parentReq, selectedApartment]);

  const issueLabel = useMemo(() => {
    if (isFollowUp) return parentReq?.issue?.name || 'Khác';
    if (issueId == null) return issues?.length ? 'Khác' : 'Chọn vấn đề';
    return issues.find((i) => i.issueId === issueId)?.name || 'Chọn vấn đề';
  }, [isFollowUp, parentReq, issueId, issues]);

  const onSubmit = async (values) => {
    try {
      if (!values.shortSummary?.trim()) {
        Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Thiếu tên đối tượng.' });
        return;
      }
      if (!values.apartmentId) {
        Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Thiếu căn hộ.' });
        return;
      }
      if (isEmergency === true && !values.issueId) {
        Toast.show({ type: 'error', text1: 'Thiếu thông tin', text2: 'Khẩn cấp yêu cầu chọn Vấn đề.' });
        return;
      }

      const filesCompressed = await compressMany(newImages, {
        maxWidth: 1280,
        quality: 0.7,
        format: 'jpeg',
      });

      if (isEmergency) {
        const payload = {
          ParentRequestId: parentId,
          ApartmentId: values.apartmentId ?? firstAptId,
          IssueId: values.issueId,
          Object: values.shortSummary?.trim(),
          Description: values.description?.trim() || '',
          Files: filesCompressed,
        };
        await dispatch(createEmergencyRepairRequest(payload)).unwrap();
      } else {
        const payload = {
          ParentRequestId: parentId,
          ApartmentId: values.apartmentId ?? firstAptId,
          IssueId: values.issueId ?? null,
          Object: values.shortSummary?.trim(),
          Description: values.description?.trim() || '',
          PreferredAppointment: values.preferredAt,
          Files: filesCompressed,
        };
        await dispatch(createNormalRepairRequest(payload)).unwrap();
      }

      Toast.show({ type: 'success', text1: 'Thành công', text2: 'Yêu cầu đã được gửi.' });
      router.back();
    } catch (e) {
      console.log('[submit RequestCreate error]', e);
      Toast.show({ type: 'error', text1: 'Gửi thất bại', text2: e?.message || 'Vui lòng thử lại.' });
    }
  };

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft} hitSlop={8}>
            <Icon name="chevron.left" size={24} color="#1a1a1a" />
            <Text style={styles.headerBack}>Quay lại</Text>
          </Pressable>
          <Text style={styles.headerTitle}>
            {isEmergency ? (isFollowUp ? 'Tạo lại (Khẩn cấp)' : 'Tạo khẩn cấp') : (isFollowUp ? 'Tạo yêu cầu sửa chữa lại' : 'Tạo yêu cầu sửa chữa')}
          </Text>
          <View style={{ width: 72 }} />
        </View>

        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1e88e5" />
          <Text style={styles.loadingText}>Đang tải dữ liệu…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {isEmergency ? (
        <LinearGradient
          colors={['#ef4444', '#f59e0b']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.headerBase, styles.headerGradient, { paddingTop: insets.top + 6 }]}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft2} hitSlop={8}>
            <Icon name="chevron.left" size={24} color="#1a1a1a" />
            <Text style={styles.headerBack}>Quay lại</Text>
          </Pressable>
          <Text style={[styles.headerTitle2, { color: '#fff' }]}>
            {isFollowUp ? 'Tạo yêu cầu sửa chữa lại (Khẩn cấp)' : 'Tạo yêu cầu sửa chữa khẩn cấp'}
          </Text>
          <View style={{ width: 72 }} />
        </LinearGradient>
      ) : (
        <View style={[styles.headerBase, styles.headerPlain, { paddingTop: insets.top + 6 }]}>
          <Pressable onPress={() => router.back()} style={styles.headerLeft2} hitSlop={8}>
            <Icon name="chevron.left" size={24} color="#1a1a1a" />
            <Text style={styles.headerBack}>Quay lại</Text>
          </Pressable>
          <Text style={styles.headerTitle2}>{isFollowUp ? 'Tạo yêu cầu sửa chữa lại' : 'Tạo yêu cầu sửa chữa'}</Text>
          <View style={{ width: 72 }} />
        </View>
      )}

      {isEmergency && (
        <View style={styles.emergencyNoteWrap}>
          <Icon name="exclamationmark.triangle.fill" size={16} color="#b45309" />
          <Text style={styles.emergencyNoteText}>
            Chỉ chọn “Khẩn cấp” khi tình huống có nguy cơ mất an toàn (rò rỉ điện, nước tràn, cháy, mùi khét...).
          </Text>
        </View>
      )}

      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT + insets.bottom + 25 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={80}
        extraHeight={80}>
        {parentReq ? (
          <>
            <RequestPreviewCard
              item={parentReq}
              title="Yêu cầu gốc"
              onPress={() =>
                router.push({
                  pathname: '/(resident)/request/[id]',
                  params: { id: String(parentId) },
                })
              }
            />
          </>
        ) : null}

        <View style={{ gap: 10, marginTop: 6 }}>
          <Text style={styles.fieldLabel2}>Căn hộ *</Text>
          {isFollowUp ? (
            <View style={[styles.selectBox, styles.lockedBox]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <Icon name="building.2" size={16} color="#6b7280" />
                <Text style={{ fontSize: 14, color: '#111827'}}>{aptLabel}</Text>
              </View>
              <Icon name="lock" size={16} color="#6b7280" />
            </View>
          ) : (
            <>
              <Pressable onPress={() => setOpenAptPicker(true)} style={styles.selectBox}>
                {selectedApartment ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name="building.2" size={16} color="#6b7280" />
                      <Text style={{ fontSize: 14, color: '#111827' }}>Tầng {selectedApartment?.floor}</Text>
                    </View>
                    <View style={{ width: 1, height: 16, backgroundColor: '#E5E7EB' }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Icon name="door.left.hand.closed.fill" size={16} color="#6b7280" />
                      <Text style={{ fontSize: 14, color: '#111827' }}>Phòng {selectedApartment?.room}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Icon name="building.2" size={16} color="#6b7280" />
                    <Text style={{ fontSize: 14, color: '#6b7280' }}>Chọn căn hộ</Text>
                  </View>
                )}
                <Icon name="chevron.down" size={18} color="#6b7280" />
              </Pressable>

              <Modal visible={openAptPicker} transparent animationType="fade" onRequestClose={() => setOpenAptPicker(false)}>
                <View style={styles.modalBackdrop}>
                  <View style={styles.modalCard}>
                    <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700' }}>Chọn căn hộ</Text>
                    </View>
                    <ScrollView style={{ paddingHorizontal: 6 }}>
                      {apartments.map((apt) => {
                        const active = selectedApartmentId === apt.apartmentId;
                        return (
                          <Pressable
                            key={apt.apartmentId}
                            onPress={() => {
                              setValue('apartmentId', apt.apartmentId, { shouldDirty: true });
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
            </>
          )}
        </View>

        <View style={{ alignItems: 'center', marginTop: 18, marginBottom: 8 }}>
          <Text style={styles.sectionTitle2}>Chi tiết yêu cầu</Text>
        </View>

        <Text style={styles.fieldLabel2}>Vấn đề *</Text>
        {isFollowUp ? (
          <View style={[styles.selectBox, styles.lockedBox, { marginBottom: 12 }]}>
            <Text style={{ fontSize: 15, color: '#111827' }}>{issueLabel}</Text>
            <Icon name="lock" size={16} color="#6b7280" />
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => setOpenIssuePicker(true)}
              style={[
                styles.selectBox,
                {
                  marginBottom: 12,
                  borderColor: '#373C37',
                  borderRadius: 8,
                  paddingHorizontal: 15,
                  paddingVertical: 15,
                  backgroundColor: theme.colors.surface,
                },
              ]}>
              <Text style={styles.selectText}>{issueLabel}</Text>
              <Icon name="chevron.down" size={18} color="#6b7280" />
            </Pressable>

            <Modal visible={openIssuePicker} transparent animationType="fade" onRequestClose={() => setOpenIssuePicker(false)}>
              <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                  <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700' }}>Chọn vấn đề</Text>
                    {issuesLoading ? <Text style={{ color: '#6b7280', marginTop: 6 }}>Đang tải danh sách...</Text> : null}
                  </View>

                  <ScrollView style={{ paddingHorizontal: 6 }}>
                    {filteredIssues.map((it) => (
                      <Pressable
                        key={it.issueId}
                        onPress={() => {
                          setValue('issueId', it.issueId, { shouldDirty: true });
                          setOpenIssuePicker(false);
                        }}
                        style={[styles.optionItem, issueId === it.issueId && styles.optionItemActive]}>
                        <Text style={[styles.optionText, issueId === it.issueId && styles.optionTextActive]}>{it.name}</Text>
                      </Pressable>
                    ))}

                    <Pressable
                      onPress={() => {
                        setValue('issueId', null, { shouldDirty: true });
                        setOpenIssuePicker(false);
                      }}
                      style={[styles.optionItem, issueId == null && styles.optionItemActive, { marginBottom: 8 }]}>
                      <Text style={[styles.optionText, issueId == null && styles.optionTextActive]}>Khác</Text>
                    </Pressable>
                  </ScrollView>

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, padding: 10 }}>
                    <Pressable onPress={() => setOpenIssuePicker(false)} style={styles.mGhost}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#6b7280' }}>Đóng</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}

        <Controller
          control={control}
          name="shortSummary"
          rules={{ required: 'Vui lòng nhập tên đối tượng muốn sửa' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <MUITextField
              label={isFollowUp ? 'Tên đối tượng sửa chữa' : 'Nhập tên đối tượng muốn sửa *'}
              placeholder="VD: Rò rỉ vòi nước bếp, ổ cắm phòng ngủ chập..."
              value={value}
              size="small"
              onChangeText={isFollowUp ? undefined : onChange}
              onBlur={onBlur}
              disabled={isFollowUp}
              variant="outlined"
              startIcon="note-text-outline"
              error={!!errors.shortSummary}
              helperText={errors.shortSummary?.message}
              style={[{ marginBottom: 12 }, isFollowUp && { color: '#F3F4F6' }]}
            />
          )}
        />

        <Controller
          control={control}
          name="description"
          rules={{ required: 'Vui lòng nhập mô tả chi tiết' }}
          render={({ field: { onChange, onBlur, value } }) => (
            <MUITextField
              label="Mô tả tình trạng chi tiết"
              placeholder="Mô tả rõ triệu chứng, thời điểm xuất hiện, đã thử khắc phục gì..."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              size="large"
              variant="outlined"
              multiline
              numberOfLines={4}
              startIcon="text-box-outline"
              error={!!errors.description}
              helperText={errors.description?.message}
              style={{ marginBottom: 12 }}
            />
          )}
        />

        {isFollowUp ? (
          <ImagePickerStrip
            mode="view"
            title="Ảnh từ yêu cầu của bạn"
            items={parentImages}
            mapUri={(m) => m.filePath}
            mapKey={(m, i) => String(m.mediaId || i)}
          />
        ) : null}

        <ImagePickerStrip
          mode="update"
          value={newImages}
          onChange={setNewImages}
          maxCount={10}
          title={isFollowUp ? 'Ảnh bổ sung' : 'Ảnh đính kèm'}
        />

        {isEmergency !== true ? (
          <View style={styles.card2}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.fieldLabel2}>Thời gian phù hợp để kỹ thuật viên đến</Text>
            </View>
            <Pressable style={styles.timeDisplay} onPress={() => setOpenPicker(true)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.timeLabel}>Thời gian mong muốn</Text>
                <Text style={styles.timeValue}>
                  {new Date(preferredAtISO).toLocaleString('vi-VN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </Text>
              </View>
              <Text style={styles.timeChoose}>Chọn</Text>
            </Pressable>

            <WheelDateTimePicker
              visible={openPicker}
              onClose={() => setOpenPicker(false)}
              onConfirm={(date) => setValue('preferredAt', toLocalIsoNoOffset(date), { shouldDirty: true })}
              initialDate={new Date(preferredAtISO)}
              daysAhead={45}
              locale="vi-VN"
              title="Chọn ngày & giờ"
              cancelText="Huỷ"
              confirmText="Xong"
            />
          </View>
        ) : (
          <View style={[styles.card2, styles.urgentBox]}>
            <Text style={styles.urgentText}>Yêu cầu khẩn cấp — điều phối kỹ thuật viên sớm nhất có thể.</Text>
          </View>
        )}
      </KeyboardAwareScrollView>

      <View style={[styles.footer2, { height: FOOTER_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
        <GradientButton
          title={isSubmitting || creating ? 'Đang gửi...' : 'Gửi yêu cầu'}
          loading={isSubmitting || creating}
          disabled={isSubmitting || creating}
          size="medium"
          scheme={isEmergency ? 'emergency' : 'normal'}
          onPress={handleSubmit(onSubmit)}
          style={{ borderRadius: 14 }}
        />
      </View>

      {isBusy ? <View style={styles.blockOverlay} pointerEvents="auto" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 92 },
  headerBack: { fontSize: 16, color: '#1a1a1a' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, fontSize: 14, color: '#6B7280' },

  headerBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerPlain: { backgroundColor: 'white' },
  headerGradient: { backgroundColor: 'transparent' },
  headerLeft2: { flexDirection: 'row', alignItems: 'center', gap: 6, width: 92 },
  headerTitle2: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },

  emergencyNoteWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FDE68A',
  },
  emergencyNoteText: { flex: 1, color: '#B45309', fontSize: 13, lineHeight: 18 },

  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },

  sectionTitle2: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 6 },
  fieldLabel2: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },

  card2: { marginTop: 8 },

  timeDisplay: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeLabel: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  timeValue: { fontSize: 16, color: '#111827', fontWeight: '600' },
  timeChoose: { color: '#1e88e5', fontWeight: '700' },

  urgentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  urgentText: { color: '#B45309', fontSize: 13, flex: 1 },

  selectText: { fontSize: 16, color: '#111827' },
  selectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  lockedBox: { backgroundColor: '#F3F4F6' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 14, paddingVertical: 10, maxHeight: '70%' },
  optionItem: { paddingVertical: 12, paddingHorizontal: 10, marginHorizontal: 10, borderRadius: 10 },
  optionItemActive: { backgroundColor: '#E7F0FF' },
  optionText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  optionTextActive: { fontWeight: '700' },
  mGhost: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F4F6F8' },

  footer2: {
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
  blockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 9999,
    elevation: 9999,
  },
});
