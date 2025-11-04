import React, { use, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import {
  Colors,
  zincColors,
  appleBlue,
  appleGreen,
  appleRed,
  borderColor,
} from '@/src/utils/colors';
import { Icon } from '@/src/components/Icon.native';
import { getOrderTypeLabel } from '@/src/helper/request-header';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  fetchAppointmentById,
  selectAppointmentById,
  selectAppointmentLoading,
  selectAppointmentError,
  checkInAppointment,
  selectAppointmentCheckingIn,
} from '@/src/features/appointments/appointmentsSlice';
import { pretty } from '@/src/helper/prettyLog';
import { getConversation } from '@/src/features/chat/chatSlice';
import Badge from '@/src/components/Badge';
import { capitalizeFirst } from '@/src/helper/capitalizeFirst';
import { timeDayDate } from '@/src/utils/date';
import ReportListItem from '@/src/components/ReportListItem';
import { fetchInspectionReportByAppointmentId, selectReportByAppointment, selectReportIdsByAppointment, selectReportLoadingByAppointment } from '@/src/features/inspectionReport/inspectionRPSlice';
import Toast from 'react-native-toast-message';

const THEME = Colors.light;

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('details');
  const dispatch = useAppDispatch();

  const appointment = useAppSelector((state) => selectAppointmentById(state, id));
  const loading = useAppSelector((state) => selectAppointmentLoading(state, id));
  const error = useAppSelector((state) => selectAppointmentError(state, id));
  const inspectionReportIds = useAppSelector((s) => selectReportIdsByAppointment(s, id));
  const inspectionReportsById = useAppSelector((s) => s.inspectionReports.byId);
  const inspectionReportLoading = useAppSelector((s) => selectReportLoadingByAppointment(s, id));
  const checkingIn = useAppSelector((state) => selectAppointmentCheckingIn(state, id));

  useEffect(() => {
  if (id) {
    dispatch(fetchAppointmentById(id));
    dispatch(fetchInspectionReportByAppointmentId(id));
  }
}, [id, dispatch]);
  // const allReportsById = useAppSelector((s) => s.inspectionReports.byId);

  useEffect(() => {
    if (id) {
      dispatch(fetchAppointmentById(id));
    }
  }, [id, dispatch]);
  console.log('appointment = useAppSelector', pretty(appointment));

  const handleStartRepair = async () => {
    if (!id) return;
    try {
      await dispatch(startAppointmentRepair(id)).unwrap();
      // load lại appointment
      dispatch(fetchAppointmentById(id));
      Toast.show({
        type: 'success',
        text1: 'Bắt đầu sửa chữa thành công',
      });
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Bắt đầu sửa chữa thất bại',
        text2: e || 'Vui lòng thử lại.',
      });
    }
  };
  const handleCheckIn = async () => {
  if (!id) return;
  try {
    console.log('gọi api')
    await dispatch(checkInAppointment(id)).unwrap();
    // check-in xong -> load lại appointment
    dispatch(fetchAppointmentById(id));
    Toast.show({
      type: 'success',
      text1: 'Đã check-in',
      text2: 'Bạn có thể bắt đầu buổi hẹn.',
    });
  } catch (e) {
    Toast.show({
      type: 'error',
      text1: 'Check-in thất bại',
      text2: e || 'Vui lòng thử lại.',
    });
  }
};
  const handleUpdateProgress = () => {
    Alert.alert('Cập nhật tiến độ', 'Chọn cập nhật:', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Upload ảnh', onPress: () => console.log('Upload photos flow (placeholder)') },
      { text: 'Đang xử lý', onPress: () => console.log('status=in_progress') },
      { text: 'Hoàn tất', onPress: () => console.log('status=completed') },
    ]);
  };

  const handleMarkCompleted = () => {
    Alert.alert('Thanh toán', 'Khách đã thanh toán?', [
      {
        text: 'Chưa',
        onPress: () => router.push(`/payment?appointmentId=${inspection.appointmentId}`),
      },
      {
        text: 'Rồi',
        onPress: () => {
          console.log('Paid -> Mark completed');
          router.push(
            `/reports/create?inspectionId=${inspection.id}&appointmentId=${inspection.appointmentId}`
          );
        },
      },
    ]);
  };

  const handleCreateInspectionReport = () => {
    const apptId = appointment?.appointmentId;
    if (!apptId) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng khởi động lại ứng dụng.');
      return;
    }
    router.push({
      pathname: '/(technician)/inspectReport-create',
      params: { appointmentId: Number(apptId) },
    });
  };
  const handleCreateRepairReport = () => {
    const apptId = appointment?.appointmentId;
    if (!apptId) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng khởi động lại ứng dụng.');
      return;
    }
    router.push({
      pathname: '/(technician)/repairReport-create',
      params: { appointmentId: Number(apptId) },
    });
  };
  const handleCreateInvoice = () => {
    const apptId = appointment?.appointmentId;
    if (!apptId) {
      Alert.alert('Thiếu dữ liệu', 'Vui lòng khởi động lại ứng dụng.');
      return;
    }
    router.push({
      pathname: '/(technician)/invoice-create',
      params: { repairRequestId: Number(appointment?.repairRequest?.repairRequestId) },
    });
  };

  const handleCreateChatWithResident = () => {
    router.push({ pathname: '/(technician)/chat/[id]', params: { userId: String(appointment?.repairRequest?.apartment?.residentId) } });
  };
  const goInspectionReportDetail = (reportId) => {
    router.push({ pathname: '/(technician)/inspectionReport/[id]', params: { id: String(reportId) } });
  };

  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Quay lại">
              <Icon name="chevron.left" size={22} color={appleBlue} />
            </Pressable>
            <Icon name="wrench.and.screwdriver" size={22} color={appleBlue} />
            <Text style={styles.headerCategory}>
              {getOrderTypeLabel(appointment?.repairRequest?.type) || 'loại appointment'}
            </Text>
          </View>

          <Badge status={(appointment?.repairRequest?.isEmergency) ? 'Emergency' : 'Normal'}/>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {capitalizeFirst(appointment?.repairRequest?.object) || '-Tên cuộc hẹn-'}
        </Text>

        <View style={styles.metaRow}>
          <Badge status={appointment?.status} />
          {appointment?.technicians.map((tech) => (
            <View style={styles.metaItem} key={tech.userId}>
              <Icon name="person" size={16} color={zincColors[500]} />
              <Text style={styles.metaText}>KTV. {tech.lastName}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {['details', 'updates', 'chat'].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'details' ? 'Chi tiết' : tab === 'updates' ? 'Tiến độ' : 'Chat'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'details' && (
          <View style={styles.sectionWrap}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.description}>{capitalizeFirst(appointment?.repairRequest?.description)}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin </Text>
              <View style={styles.infoBlock}>
                <Item
                  icon="doc.text"
                  label="ID yêu cầu"
                  value={appointment?.repairRequest?.repairRequestId || '-'}
                />

                <Item
                  icon="calendar"
                  label="ID cuộc hẹn"
                  value={appointment?.appointmentId || '-'}
                />
                <Item icon="flag" label="Lỗi của chủ nhà" value={appointment?.faultOwner || '-'} />
                <Item
                  icon="wrench"
                  label="Loại giải pháp"
                  value={appointment?.solutionType || '-'}
                />
                <Item
                  icon="clock"
                  label="Ngày tạo"
                  value={timeDayDate(appointment?.createdAt) || '-'}
                />
                <Item icon="list.bullet" label="Giải pháp" value={appointment?.solution || '-'} />
              </View>
            </View>

            {/* Inspection Reports */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Báo cáo khảo sát</Text>
                {inspectionReportLoading ? (
                  <Text style={{ color: zincColors[500], marginLeft: 40 }}>Đang tải danh sách báo cáo…</Text>
                ) : inspectionReportIds.length === 0 ? (
                  <Text style={{ color: zincColors[500], marginLeft: 40 }}>Chưa có báo cáo nào.</Text>
                ) : ( 
                  <View style={{ gap: 10 }}>
                    {inspectionReportIds.map((irid, idx) => (
                      <ReportListItem
                        key={irid}
                        index={idx + 1} // "Báo cáo [x]"
                        report={inspectionReportsById[irid]}
                        type='Inspection'
                        onPress={() => goInspectionReportDetail(irid)}
                      />
                    ))}
                  </View>
                )} 
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Báo cáo sửa chữa</Text>
                {/* {loadingReports && reportIds.length === 0 ? (
                  <Text style={{ color: zincColors[500] }}>Đang tải danh sách báo cáo…</Text>
                ) : reportIds.length === 0 ? (
                  <Text style={{ color: zincColors[500] }}>Chưa có báo cáo nào.</Text>
                ) : ( 
                  <View style={{ gap: 10 }}>
                    {reportIds.map((rrid, idx) => (
                      <ReportListItem
                        key={rrid}
                        index={idx + 1} // "Báo cáo [x]"
                        report={reportIds[rrid]}
                        type='Repair'
                        onPress={() => goRepairReportDetail(rrid)}
                      />
                    ))}
                  </View>
                )} */}
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Căn hộ</Text>
              <View style={styles.infoBlock}>
                {/* <Item
                  icon="person"
                  label="ID người dùng"
                  value={appointment?.repairRequest?.apartment?.residentId || '-'}
                />*/}
                <Item
                  icon="building.2"
                  label="Căn hộ"
                  value={appointment?.repairRequest?.apartment?.roomNumber || '-'}
                />
                <Item
                  icon="door.left.hand.closed"
                  label="Lầu"
                  value={appointment?.repairRequest?.apartment?.floor ? appointment?.repairRequest?.apartment?.floor : ( appointment?.repairRequest?.apartment?.floorId ? appointment?.repairRequest?.apartment?.floorId : '-') }
                />
                <Item
                  style={{}}
                  icon="person.fill"
                  label="Mô tả"
                  value={appointment?.repairRequest?.apartment?.description || '-'}
                /> 
                {appointment?.startTime ? (
                  <Item
                    icon="clock.fill"
                    label="Lịch hẹn"
                    value={timeDayDate(appointment?.startTime)}
                  />
                ) : null}
              </View>
            </View>
          </View>
        )}

        {activeTab === 'updates' && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Dòng thời gian</Text>
            <View style={styles.timeline}>
              <TimelineItem
                icon="plus.circle"
                title="Tạo yêu cầu / Inspection"
                date={timeDayDate(appointment?.createdAt)}
                desc={`Tạo bởi ${appointment?.repairRequest?.apartment?.users?.residentName || 'Cư dân'}`}
              />
              {(appointment?.status === 'in_progress' || appointment?.status === 'completed') && (
                <TimelineItem
                  icon="play.circle"
                  title="Đã bắt đầu sửa"
                  date={timeDayDate(appointment?.updatedAt)}
                  desc="Kỹ thuật viên bắt đầu xử lý"
                />
              )}
              {appointment?.status === 'completed' && (
                <TimelineItem
                  icon="checkmark.circle"
                  title="Hoàn tất"
                  date={timeDayDate(appointment?.updatedAt)}
                  desc="Đã đánh dấu hoàn tất"
                />
              )}
            </View>
          </View>
        )}

        {activeTab === 'chat' && (
          <View style={styles.sectionWrap}>
            <View style={styles.chatPlaceholder}>
              <Icon name="chat" size={44} color={zincColors[500]} />
              {/* <Text style={styles.chatText}>Tin nhắn sẽ hiển thị tại đây</Text> */}
              <Pressable style={styles.ghostBtn} onPress={handleCreateChatWithResident}>
                <Text style={styles.ghostBtnText}>Mở hội thoại</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        {appointment?.status === 'InVisited' ? (
          <>
            <Pressable style={styles.primaryBtn} onPress={handleCreateInspectionReport}>
              <Icon name="doc.text" size={20} color={THEME.background} />
              <Text style={styles.primaryBtnText}>Báo cáo khảo sát</Text>
            </Pressable>
          </>
        ) : null}
        {appointment?.status === 'Pending' || appointment?.status === 'InProgress' ? (
          <>
            <Pressable style={styles.primaryBtn} onPress={handleCreateInvoice}>
              <Icon name="doc.text" size={20} color={THEME.background} />
              <Text style={styles.primaryBtnText}>Tạo hóa đơn</Text>
            </Pressable>
          </>
        ) : null}
        {appointment?.status === 'Confirmed' ? (
          <>
            <Pressable
              style={[styles.secondaryBtn, checkingIn && { opacity: 0.6 }]}
              onPress={checkingIn ? undefined : handleCheckIn}
              disabled={checkingIn}
            >
              {checkingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Icon name="play.circle" size={20} color={appleBlue} />
                  <Text style={styles.secondaryBtnText}>Bắt đầu buổi gặp</Text>
                </>
              )}
            </Pressable>
          </>
        ) : null}
        {appointment?.status === 'InVisit' || appointment?.status === 'AwaitingIRApproval' ? (
          <Pressable style={styles.secondaryBtn} onPress={handleStartRepair}>
            <Icon name="pencil" size={20} color={appleBlue} />
            <Text style={styles.secondaryBtnText}>Bắt đầu sửa chữa</Text>
          </Pressable>
        ) : null}
        {appointment?.status === 'InRepair' ? (
          <Pressable style={styles.primaryBtn} onPress={handleCreateRepairReport}>
            <Icon name="pencil" size={20} color={appleBlue} />
            <Text style={styles.primaryBtnText}>Báo cáo sữa chữa</Text>
          </Pressable>
        ) : null}
        {appointment?.status === 'Completed' ? (
          <Pressable style={styles.secondaryBtn} onPress={handleMarkCompleted}>
            <Icon name="checkmark.circle" size={20} color={appleGreen} />
            <Text style={styles.secondaryBtnText}>Hoàn tất</Text>
          </Pressable>
        ) : null}  
        
      </View>
    </View>
  );
}

function Item({ icon, label, value }) {
  return (
    <View style={[styles.itemRow]}>
      <Icon name={icon} size={16} color={zincColors[500]} />
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={styles.itemValue} numberOfLines={2}>
        {value || '-'}
      </Text>
    </View>
  );
}

function TimelineItem({ icon, title, date, desc }) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIcon}>
        <Icon name={icon} size={20} color={appleBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineDate}>{date}</Text>
        {!!desc && <Text style={styles.timelineDesc}>{desc}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, paddingTop: 30 },
  header: {
    padding: 20,
    backgroundColor: THEME.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    marginRight: 8,
    padding: 4, // để dễ bấm hơn (kết hợp hitSlop)
    borderRadius: 999,
  },
  headerCategory: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '700',
    color: appleBlue,
    letterSpacing: 0.5,
  },
  title: { fontSize: 24, fontWeight: '800', color: THEME.text, marginVertical: 6, lineHeight: 30 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: zincColors[100],
    borderRadius: 10,
  },
  metaText: { color: zincColors[600], fontSize: 12 },

  badge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: zincColors[50],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: appleBlue },
  tabText: { fontSize: 14, fontWeight: '500', color: zincColors[500] },
  activeTabText: { color: appleBlue, fontWeight: '700' },

  content: { flex: 1 },
  sectionWrap: { padding: 20 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: THEME.text, marginBottom: 14 },
  description: { fontSize: 16, color: THEME.text, lineHeight: 22 },

  infoBlock: { gap: 12 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: zincColors[100],
    borderRadius: 12,
  },
  itemLabel: { marginLeft: 10, color: zincColors[600], fontWeight: '600', flex: 1, fontSize: 14 },
  itemValue: { color: THEME.text, fontWeight: '700', fontSize: 14, maxWidth: '55%' },

  timeline: { paddingLeft: 8, marginTop: 6 },
  timelineItem: { flexDirection: 'row', marginBottom: 20 },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: THEME.background,
    borderWidth: 1,
    borderColor: borderColor,
  },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: THEME.text },
  timelineDate: { marginTop: 2, fontSize: 12, color: zincColors[500] },
  timelineDesc: { marginTop: 6, fontSize: 14, color: zincColors[600], lineHeight: 20 },

  chatPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  chatText: { marginTop: 12, marginBottom: 20, color: zincColors[600], fontSize: 15 },

  actionBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: borderColor,
    backgroundColor: THEME.background,
  },
  primaryBtn: {
    flex: 1.1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appleBlue,
    paddingVertical: 14,
    paddingLeft: 12,
    borderRadius: 12,
  },
  primaryBtnText: { marginLeft: 1, color: THEME.background, fontSize: 15, fontWeight: '700' },

  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: zincColors[50],
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: borderColor,
  },
  secondaryBtnText: { marginLeft: 8, color: appleBlue, fontSize: 16, fontWeight: '700' },

  ghostBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: appleBlue,
    backgroundColor: 'transparent',
  },
  ghostBtnText: { color: appleBlue, fontWeight: '700' },
});
