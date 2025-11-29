import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { Icon } from '@/src/components/Icon.native';
import { dotnetArr, unwrapDotNetValuesDeep } from '@/src/helper/dotnetArr';
import {
  fetchRepairRequests,
  getRequest,
  selectCurrentRequest,
} from '@/src/features/requests/requestsSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import Badge from '@/src/components/Badge';
import ImagePickerStrip from '@/src/components/ImagePickerStrip';
import { capitalizeFirst } from '@/src/helper/capitalizeFirst';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { timeDate } from '@/src/utils/date';
import { fetchInvoicesByRepairRequestId, selectInvoicesByRepairRequest, selectInvoicesLoadingByRepairRequest } from '@/src/features/invoices/invoiceSlice';
import { createFeedback, fetchFeedbackByRepairRequest, selectFeedbackByRepairRequest, selectFeedbackLoadingByRepairRequest } from '@/src/features/feedback/feedbacksSlice';
import { pretty } from '@/src/helper/prettyLog';
import Toast from 'react-native-toast-message';

export default function RequestDetail() {
  const { id } = useLocalSearchParams();
  const repairRequestId = Number(id);
  const rawData = useSelector(selectCurrentRequest);
  const data = useMemo(
    () => unwrapDotNetValuesDeep(rawData),
    [rawData]
  );

  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const invoices = useAppSelector((s) => selectInvoicesByRepairRequest(s, repairRequestId));
  const invoicesLoading = useAppSelector((s) => selectInvoicesLoadingByRepairRequest(s, repairRequestId));

  const feedbackThread = useAppSelector((s) =>selectFeedbackByRepairRequest(s, repairRequestId));
  console.log('[feedbackThread]', pretty(feedbackThread));
  const feedbackLoading = useAppSelector((s) =>selectFeedbackLoadingByRepairRequest(s, repairRequestId));
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const medias = useMemo(() => {
    if (!data) return [];
    return dotnetArr(data.medias);
  }, [data]);

  const trackings = useMemo(() => {
    if (!data) return [];
    const arr = dotnetArr(data.requestTrackings);
    return [...arr].sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
  }, [data]);

  const latestTrackingStatus = trackings?.length > 0 ? trackings[trackings.length - 1].status : null;
  const canSendFeedback =
      (latestTrackingStatus === 'AcceptancePendingVerify' ||latestTrackingStatus === 'Completed');
  console.log('[canSendFeedback]',canSendFeedback)
  const appts = useMemo(() => {
    if (!data) return [];
    return dotnetArr(data.appointments);
  }, [data]);

  const createdAt = useMemo(() => {
    if (!data) return '';
    return (
      timeDate(data.createdAt) ||
      timeDate(trackings?.[0]?.updatedAt) ||
      ''
    );
  }, [data, trackings]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        setInitialLoading(true);
        await dispatch(getRequest(id)).unwrap?.();
        await dispatch(fetchInvoicesByRepairRequestId(repairRequestId)).unwrap?.();
        await dispatch(fetchFeedbackByRepairRequest(repairRequestId)).unwrap?.();
      } catch (e) {
        console.log('[getRequest error]', e);
      } finally {
        if (active) setInitialLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, dispatch]);

  const reload = useCallback(async () => {
    try {
      setRefreshing(true);
      await dispatch(
        fetchRepairRequests({
          page: 1,
          size: 10,
        })
      ).unwrap();
      await dispatch(getRequest(id)).unwrap();
      await dispatch(fetchInvoicesByRepairRequestId(repairRequestId)).unwrap?.();
      await dispatch(fetchFeedbackByRepairRequest(repairRequestId)).unwrap?.();
    } catch (e) {
      console.log('[request detail refresh error]', e?.normalized || e);
    } finally {
      setRefreshing(false);
    }
  }, [id, dispatch]);

  const handleSubmitFeedback = useCallback(async () => {
    if (!repairRequestId) return;

    if (!rating) {
      Toast.show({
        type: 'error',
        text1: 'Vui lòng chọn số sao đánh giá',
      });
      return;
    }

    try {
      setSubmittingFeedback(true);
      await dispatch(
        createFeedback({
          repairRequestId,
          rating,
          comment: comment.trim(),
        })
      ).unwrap?.();

      Toast.show({
        type: 'success',
        text1: 'Gửi đánh giá thành công',
      });

      setRating(0);
      setComment('');

      await dispatch(fetchFeedbackByRepairRequest(repairRequestId)).unwrap?.();
    } catch (e) {
      console.log('[createFeedback error]', e?.normalized || e);
      Toast.show({
        type: 'error',
        text1: 'Không gửi được đánh giá',
        text2: e?.message || 'Vui lòng thử lại sau',
      });
    } finally {
      setSubmittingFeedback(false);
    }
  }, [repairRequestId, rating, comment, dispatch]);

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerLeft}
            hitSlop={8}
          >
            <Icon name="chevron.left" size={24} color="#1a1a1a" />
            <Text style={styles.headerBack}>Quay lại</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
          <View style={{ width: 72 }} />
        </View>

        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1e88e5" />
          <Text style={styles.loadingText}>Đang tải chi tiết yêu cầu…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data || String(data?.repairRequestId) !== String(id)) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.headerLeft}
            hitSlop={8}
          >
            <Icon name="chevron.left" size={24} color="#1a1a1a" />
            <Text style={styles.headerBack}>Quay lại</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
          <View style={{ width: 72 }} />
        </View>

        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Không tìm thấy yêu cầu</Text>
          <Text style={styles.emptySub}>
            Hãy mở lại từ danh sách yêu cầu.
          </Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Icon name="chevron.left" size={18} color="#fff" />
            <Text style={styles.backBtnText}>Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.headerLeft}
          hitSlop={8}
        >
          <Icon name="chevron.left" size={24} color="#1a1a1a" />
          <Text style={styles.headerBack}>Quay lại</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={reload}
            colors={['#1e88e5']}
            tintColor="#1e88e5"
            title={refreshing ? 'Đang làm mới...' : undefined}
          />
        }
        alwaysBounceVertical
        overScrollMode="always"
      >
        {/* Title row */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={styles.titleText} numberOfLines={2}>
              {capitalizeFirst(data?.object) || 'Không có tiêu đề'}
            </Text>
            <View style={styles.metaRow}>
              <Icon name="calendar" size={14} color="#6B7280" />
              <Text style={styles.metaText}>
                {'Ngày tạo: ' + createdAt || '—'}
              </Text>
            </View>
          </View>
          <View
            style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}
          >
            <Badge
              status={data?.appointments?.[0]?.status}
              styles={{ flex: 1, marginLeft: 4 }}
            />
            <Badge
              status={data?.isEmergency == true ? 'Emergency' : 'Normal'}
              styles={{ flex: 1, marginLeft: 12 }}
            />
          </View>
        </View>

        {/* Issue & Apartment */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon
              name="wrench.and.screwdriver"
              size={16}
              color="#0C4A6E"
            />
            <Text style={styles.cardLabel}>Vấn đề</Text>
          </View>
          <Text style={styles.cardValue}>
            {data?.issue?.name || 'Khác'}
          </Text>

          <View style={[styles.row, { marginTop: 12 }]}>
            <Icon name="building.2" size={16} color="#0C4A6E" />
            <Text style={styles.cardLabel}>Căn hộ</Text>
          </View>
          <Text style={styles.cardValue}>
            {data?.apartment
              ? `Tầng ${
                  data?.apartment?.floor
                    ? data?.apartment?.floor
                    : data?.apartment?.floorId
                    ? data?.apartment?.floorId
                    : '-'
                } - P.${data?.apartment?.room ?? ''}`
              : '—'}
          </Text>
        </View>

        {/* Description */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="doc.text" size={16} color="#6B7280" />
            <Text style={styles.cardLabel}>Mô tả</Text>
          </View>
          <Text style={styles.descText}>{data?.description || '—'}</Text>
        </View>

        {/* Medias */}
        <ImagePickerStrip
          mode="view"
          title="Hình ảnh"
          items={medias}
          mapUri={(m) => m.filePath}
          mapKey={(m, i) => String(m.mediaId || i)}
        />

        {/* Appointments */}
        {appts?.length ? (
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="calendar" size={16} color="#0C4A6E" />
              <Text style={styles.cardLabel}>Lịch hẹn</Text>
            </View>

            {appts.map((ap) => {
              const techs = dotnetArr(ap?.technicians);
              return (
                <View key={ap.appointmentId} style={styles.apptItem}>
                  <Badge
                    status={ap.status}
                    style={{ fontSize: 14, fontWeight: '700' }}
                  />
                  <View style={styles.apptRow}>
                    <Icon
                      name="clock.fill"
                      size={14}
                      color="#2563EB"
                    />
                    <Text style={styles.apptTime}>
                      {timeDate(ap.startTime)} —{' '}
                      {timeDate(ap.endTime ?? ap.startTime)}
                    </Text>
                  </View>
                  {!!techs?.length && (
                    <View style={styles.apptTechs}>
                      <Icon
                        name="person.fill"
                        size={14}
                        color="#6B7280"
                      />
                      <Text style={styles.apptTechsText}>
                        {techs
                          .map((t) =>
                            `${t.firstName || ''} ${
                              t.lastName || ''
                            }`.trim()
                          )
                          .join(', ')}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ) : null}
        {/* Invoices */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon name="doc.text" size={16} color="#0C4A6E" />
            <Text style={styles.cardLabel}>Hoá đơn</Text>
          </View>

          {invoicesLoading ? (
            <View style={{ paddingVertical: 10 }}>
              <ActivityIndicator size="small" color="#1e88e5" />
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Đang tải danh sách hoá đơn...
              </Text>
            </View>
          ) : invoices.length === 0 ? (
            <Text style={styles.emptyLine}>
              Chưa có hoá đơn cho yêu cầu này.
            </Text>
          ) : (
            invoices.map((inv) => (
              <Pressable
                key={inv.invoiceId}
                style={[styles.invoiceItem, { marginTop: 10 }]}
                // onPress={() => handleOpenInvoice(inv)}
              >
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={styles.invoiceTitle}>
                      Hóa đơn #{inv.invoiceId}
                    </Text>
                    <Badge status={inv.status} />
                  </View>
                  <Text style={styles.invoiceMeta}>
                    Tổng tiền: {inv.totalAmount + ' VND'}
                  </Text>
                  {/* <Text style={styles.invoiceMeta}>
                    Loại: {inv.type || '-'}
                  </Text> */}
                  <Text style={styles.invoiceMeta}>
                    Ngày tạo:{' '}
                    {inv.createdAt ? timeDate(inv.createdAt) : '-'}
                  </Text>
                </View>
                {/* <Icon name="chevron.right" size={18} color="#9CA3AF" /> */}
              </Pressable>
            ))
          )}
        </View>
        {/* Tracking timeline */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Icon
              name="arrow.up.arrow.down"
              size={16}
              color="#6B7280"
            />
            <Text style={styles.cardLabel}>Tiến trình</Text>
          </View>
          {!trackings || trackings.length === 0 ? (
            <Text style={styles.emptyLine}>Chưa có cập nhật.</Text>
          ) : (
            <View style={{ marginTop: 8 }}>
              {trackings.map((t, idx) => {
                const isLatest = idx === trackings.length - 1;
                return (
                  <View
                    key={t.requestTrackingId}
                    style={[
                      styles.trackRow,
                      !isLatest && { opacity: 0.4 },
                    ]}
                  >
                    <View style={styles.trackDot} />
                    <View style={{ flex: 1 }}>
                      <Badge
                        status={t.status}
                        style={{ fontSize: 14, fontWeight: '700' }}
                      />
                      <Text style={styles.trackTime}>
                        {timeDate(t.updatedAt)}
                      </Text>
                      {t.updatedByUser ? (
                        <Text style={styles.trackBy}>
                          bởi {t.updatedByUser.firstName}{' '}
                          {t.updatedByUser.lastName}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        {canSendFeedback && (
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="star.fill" size={16} color="#F59E0B" />
              <Text style={styles.cardLabel}>Danh sách đánh giá</Text>
            </View>

            {feedbackLoading ? (
              <View style={{ paddingVertical: 10 }}>
                <ActivityIndicator size="small" color="#1e88e5" />
                <Text
                  style={{
                    fontSize: 12,
                    color: '#6B7280',
                    marginTop: 4,
                  }}
                >
                  Đang tải đánh giá...
                </Text>
              </View>
            ) : null}

            {feedbackThread?.rootFeedbacks?.length > 0 && (
              <View style={{ marginTop: 10 }}>
                {feedbackThread?.rootFeedbacks.map((fb) => (
                  <View
                    key={fb.feedbackId}
                    style={styles.feedbackItem}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={styles.feedbackAuthor}>
                        {fb.userName || 'Bạn'}
                      </Text>
                      {!!fb.rating && (
                        <View style={styles.feedbackRating}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Icon
                              key={star}
                              name={
                                star <= fb.rating
                                  ? 'star.fill'
                                  : 'star'
                              }
                              size={12}
                              color={
                                star <= fb.rating
                                  ? '#F59E0B'
                                  : '#E5E7EB'
                              }
                            />
                          ))}
                        </View>
                      )}
                    </View>
                    {!!fb.comment && (
                      <Text style={styles.feedbackComment}>
                        {fb.comment}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
        </View>
        )}
        {canSendFeedback && (
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="star.fill" size={16} color="#F59E0B" />
              <Text style={styles.cardLabel}>Đánh giá dịch vụ</Text>
            </View>
            {/* Form gửi feedback */}
            <View style={{ marginTop: 12 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: '#374151',
                marginBottom: 6,
              }}
            >
              Mức độ hài lòng:
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  hitSlop={8}
                >
                  <Icon
                    name={star <= rating ? 'star.fill' : 'star'}
                    size={24}
                    color={
                      star <= rating ? '#F59E0B' : '#D1D5DB'
                    }
                  />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ marginTop: 10 }}>
            <Text
              style={{
                fontSize: 14,
                color: '#374151',
                marginBottom: 4,
              }}
            >
              Nhận xét thêm (không bắt buộc)
            </Text>
            <View
              style={{
                borderWidth: 1,
                borderColor: '#E5E7EB',
                borderRadius: 8,
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: '#F9FAFB',
              }}
            >
              <TextInput
                style={{
                  minHeight: 80,
                  fontSize: 14,
                  color: '#111827',
                  textAlignVertical: 'top',
                }}
                multiline
                placeholder="Bạn thấy dịch vụ như thế nào?"
                value={comment}
                onChangeText={setComment}
              />
            </View>
          </View>

          <Pressable
            onPress={handleSubmitFeedback}
            disabled={submittingFeedback}
            style={[
              styles.feedbackBtn,
              submittingFeedback && { opacity: 0.7 },
            ]}
          >
            {submittingFeedback ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.feedbackBtnText}>
                Gửi đánh giá
              </Text>
            )}
          </Pressable>
        </View>
        )}
        {/* Requester */}
        {data?.user && (
          <View style={styles.card}>
            <View style={styles.row}>
              <Icon name="person.fill" size={16} color="#6B7280" />
              <Text style={styles.cardLabel}>Người gửi đơn</Text>
            </View>
            <Text style={styles.cardValue}>
              {(data?.user?.firstName || '') +
                ' ' +
                (data?.user?.lastName || '')}
            </Text>
            <View style={[styles.row, { marginTop: 6 }]}>
              <Icon
                name="phone.fill"
                size={16}
                color="#16A34A"
              />
              <Text style={styles.smallValue}>
                {data?.user?.phoneNumber || '—'}
              </Text>
            </View>
            <View style={[styles.row, { marginTop: 6 }]}>
              <Icon
                name="envelope.fill"
                size={16}
                color="#2563EB"
              />
              <Text style={styles.smallValue}>
                {data?.user?.email || '—'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

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

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginLeft: 8,
    marginRight: 5,
  },
  titleText: { fontSize: 18, fontWeight: '700', color: '#111827', lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontSize: 12, color: '#6B7280' },

  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  cardValue: { fontSize: 15, color: '#111827', marginTop: 6, fontWeight: '600' },

  descText: { fontSize: 14, color: '#374151', marginTop: 6, lineHeight: 20 },

  apptItem: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  apptRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  apptTime: { fontSize: 14, color: '#111827', fontWeight: '600' },
  apptTechs: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  apptTechsText: { fontSize: 13, color: '#374151' },

  trackRow: { flexDirection: 'row', gap: 12, paddingVertical: 8 },
  trackDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginTop: 6 },
  trackTime: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  trackBy: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  emptyLine: { fontSize: 13, color: '#6B7280', marginTop: 6 },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  emptySub: { fontSize: 14, color: '#6B7280', marginTop: 6 },
  backBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e88e5',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: { color: '#fff', fontWeight: '700' },

  smallValue: { fontSize: 13, color: '#374151' },

  feedbackItem: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  feedbackAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  feedbackComment: {
    fontSize: 13,
    color: '#374151',
    marginTop: 4,
  },
  feedbackRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackBtn: {
    marginTop: 12,
    backgroundColor: '#1e88e5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
