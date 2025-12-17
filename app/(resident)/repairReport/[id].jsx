import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';

import { Colors, zincColors, appleBlue, borderColor } from '@/src/utils/colors';
import { timeDayDate } from '@/src/utils/date';
import { dotnetArr } from '@/src/helper/dotnetArr';
import ImagePickerStrip from '@/src/components/ImagePickerStrip';
import { approveResidentRepairReport, checkResidentApproveRepairReport, fetchRepairReportById, selectApprovingResidentByReportId, selectCheckingResidentApproveByReportId, selectRepairReportById, selectRepairReportByIdLoading, selectResidentApprovedByReportId } from '@/src/features/repairReport/repairReportSlice';
import Badge from '@/src/components/Badge';
import { pretty } from '@/src/helper/prettyLog';
import Toast from 'react-native-toast-message';

const THEME = Colors.light;

export default function RepairReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const reportId = Number(id);
  const dispatch = useAppDispatch();

  const loading = useAppSelector((s) => selectRepairReportByIdLoading(s, reportId));
  const report  = useAppSelector((s) => selectRepairReportById(s, reportId));
  const approved = useAppSelector((s) => selectResidentApprovedByReportId(s, reportId));
  const checkingApproved = useAppSelector((s) => selectCheckingResidentApproveByReportId(s, reportId));
  const approving = useAppSelector((s) => selectApprovingResidentByReportId(s, reportId));

  const reportStatus = (report?.status || '').toLowerCase();
  const canShowResidentActions = report && reportStatus !== 'rejected' && approved === false;
  useEffect(() => {
    if (!reportId) return;
    dispatch(fetchRepairReportById(reportId));
    dispatch(checkResidentApproveRepairReport({ reportId }));
  }, [reportId, dispatch]);
  
  console.log('[report]',pretty(report))
  const createdAt = report?.createdAt ? timeDayDate(report.createdAt) : '-';

  const medias = useMemo(() => dotnetArr(report?.medias), [report]);
  const approvals = useMemo(() => dotnetArr(report?.reportApprovals), [report]);

  const appt = report?.appointment;
  const req  = appt?.repairRequest;
  const apt  = req?.apartment;

  const handleApprove = async () => {
    if (!reportId) return;
    console.log('[sss]')
    try {
      await dispatch(approveResidentRepairReport({ reportId })).unwrap();
      dispatch(fetchRepairReportById(reportId));
      const {approved} = await dispatch(checkResidentApproveRepairReport({ reportId })).unwrap();
      console.log('[checkResidentApproveRepairReport after approve]', approved);
      if (approved)
        {
          router.back();
          Toast.show({
            type: 'success',
            text1: 'Đã chấp thuận báo cáo sửa chữa',
          });
        }
      throw new Error('Báo cáo sửa chữa chưa được chấp thuận. Vui lòng thử lại sau!');
    } catch (e) {
      console.log('[error approveResidentRepairReport]', e);
      Toast.show({
        type: 'error',
        text1: 'Lỗi khi chấp thuận báo cáo sửa chữa',
        text2: e?.message || 'Vui lòng thử lại sau.',
      });
    }
  };
  const handleReject = async () => {
    console.log('[chưa cho api reject]')
  };
  return (
    <View style={{ flex: 1, backgroundColor: THEME.background, paddingTop: 40 }}>
      {/* Header */}
      <View className="bg-white" style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Icon name="doc.text" size={20} color={appleBlue} />
        <Text style={styles.headerTitle}>Chi tiết báo cáo sửa chữa cần duyệt</Text>
      </View>

      {loading && !report ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: zincColors[500] }}>Đang tải…</Text>
        </View>
      ) : !report ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: zincColors[600] }}>Không tìm thấy báo cáo.</Text>
        </View>
      ) : (
        <>
        <ScrollView
          contentContainerStyle={{
            padding: 16,
            paddingBottom: canShowResidentActions ? 16 + 84 : 24, 
          }}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mô tả công việc kĩ thuật viên đã làm</Text>
            <Text style={styles.paragraph}>{report.description || '-'}</Text>
          </View>
          {/* Medias */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Hình ảnh đính kèm</Text>
            {medias.length === 0 ? (
              <Text style={{ color: zincColors[500] }}>Không có hình ảnh.</Text>
            ) : (
              <ImagePickerStrip
                mode="view"
                title=""
                items={medias}
                mapUri={(m) => m.filePath}
                mapKey={(m, i) => String(m.mediaId ?? i)}
              />
            )}
          </View>
          <View style={styles.card}>
            <View style={{ display: 'flex', alignItems: 'center' }}><Text style={styles.sectionTitle}>Thông tin thêm về báo cáo</Text></View>
            <Row label="Mã báo cáo"   value={report.repairReportId} />
            <Row label="Người tạo báo cáo"    value={report.userFullName || '-'} />
            <Row label="Trạng thái"   value={<Badge status={report.status} /> || '-'} />
            <Row label="Thời gian tạo" value={createdAt} />
          </View>


          

          {/* Appointment & Request & Apartment */}
          <View style={styles.card}>
            <View style={{ display: 'flex', alignItems: 'center' }}><Text style={styles.sectionTitle}>Thông tin cuộc hẹn</Text></View>
            <Row label="Giờ bắt đầu" value={appt?.startTime ? timeDayDate(appt.startTime) : '-'} />
            <Row label="Giờ kết thúc" value={appt?.endTime ? timeDayDate(appt.endTime) : '-'} />
            <Row label="Ghi chú" value={appt?.note || '-'} />
            <View style={{ display: 'flex', alignItems: 'center' }}><Text style={[styles.sectionTitle, { marginTop: 16 }]}>Thông tin yêu cầu sửa chữa</Text></View>
            <Row label="Đối tượng muốn sửa" value={req?.object || '-'} />
            <Row label="Mô tả chi tiết tình huống"   value={req?.description || '-'} />
            <Row label="Có phải trường hợp khẩn cấp" value={String(req?.isEmergency ? 'Khẩn cấp' : 'Không')} />

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Căn hộ</Text>
            <Row label="Phòng" value={apt?.room || apt?.roomNumber || '-'} />
            <Row label="Tầng"  value={apt?.floor ?? apt?.floorId ?? '-'} />
            <Row label="Mô tả" value={apt?.description || '-'} />
          </View>

          {/* Approvals */}
          <View style={styles.card}>
            <View style={{ display: 'flex', alignItems: 'center' }}><Text style={styles.sectionTitle}>Phê duyệt báo cáo</Text></View>
            {approvals.length === 0 ? (
              <Text style={{ color: zincColors[500] }}>Chưa có dữ liệu phê duyệt.</Text>
            ) : (
              approvals.map((ap) => (
                <View key={ap.reportApprovalId} style={styles.apprRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apprName}>
                      {ap.fullName || '-'} <Text style={styles.apprRole}>({ap.role === 'Resident' ? 'Cư dân' : ap.role === 'TechnicianLead' ? 'Kỹ thuật viên Trưởng' : ap.role === 'Manager' ? 'Quản lý' : '-'})</Text>
                    </Text>
                    <Text style={styles.apprMeta}>
                      {<Badge status={ap.status} />} • {ap.createdAt ? timeDayDate(ap.createdAt) : '-'}
                    </Text>
                    {!!ap.comment && <Text style={styles.apprCmt}>{ap.comment}</Text>}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
        {canShowResidentActions && (
            <View style={styles.fixedActionBar}>
              {/* <Pressable
                style={[styles.rejectBtn, approving && { opacity: 0.6 }]}
                disabled={approving}
                onPress={handleReject}
              >
                <Text style={styles.rejectText}>Từ chối chấp thuận</Text>
              </Pressable> */}

              <Pressable
                style={[styles.approveBtn, approving && { opacity: 0.6 }]}
                disabled={approving}
                onPress={handleApprove}
              >
                {approving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.approveText}>Chấp thuận báo cáo sửa chữa</Text>
                )}
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value ?? '-'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
    backgroundColor: '#fff',
  },
  backBtn: { padding: 6, marginRight: 2, borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.text },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 8 },
  paragraph: { fontSize: 14, color: THEME.text, lineHeight: 20 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  rowLabel: { flex: 1, color: zincColors[600], fontWeight: '600' },
  rowValue: { flex: 1.2, textAlign: 'right', color: THEME.text, fontWeight: '700' },

  apprRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  apprName: { fontSize: 14, fontWeight: '700', color: THEME.text },
  apprRole: { fontSize: 12, color: zincColors[500], fontWeight: '600' },
  apprMeta: { marginTop: 2, fontSize: 12, color: zincColors[500] },
  apprCmt: { marginTop: 6, fontSize: 14, color: THEME.text },
  
  fixedActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    paddingBottom: 16, // nếu muốn né safe-area iPhone thì tăng lên
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: borderColor,
    backgroundColor: '#fff',
    flexDirection: 'row',
    gap: 10,
  },

  rejectBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  rejectText: { fontWeight: '800', color: '#EF4444' },

  approveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appleBlue,
  },
  approveText: { fontWeight: '800', color: '#fff' },

});
