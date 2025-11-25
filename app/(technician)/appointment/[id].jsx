import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert, ActivityIndicator, RefreshControl } from 'react-native';
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
  startAppointmentRepair,
  selectAppointmentCompleting,
  completeAppointment,
  selectAppointmentCreating,
  createAppointment,
} from '@/src/features/appointments/appointmentsSlice';
import { pretty } from '@/src/helper/prettyLog';
import { checkExistingConversation, createConversation, getConversation } from '@/src/features/chat/chatSlice';
import Badge from '@/src/components/Badge';
import { capitalizeFirst } from '@/src/helper/capitalizeFirst';
import { timeDayDate,toLocalIsoNoOffset } from '@/src/utils/date';
import ReportListItem from '@/src/components/ReportListItem';
import { fetchInspectionReportByAppointmentId, selectReportByAppointment, selectReportIdsByAppointment, selectReportLoadingByAppointment } from '@/src/features/inspectionReport/inspectionRPSlice';
import Toast from 'react-native-toast-message';
import { fetchRepairReportByAppointment, selectRepairReportByAppointment, selectRepairReportIdsByAppointment, selectRepairReportLoadingByAppointment } from '@/src/features/repairReport/repairReportSlice';
import ProgressStepper from '@/src/components/ProgressStepper';
import { fetchInvoicesByRepairRequestId, selectInvoicesByRepairRequest, selectInvoicesErrorByRepairRequest, selectInvoicesLoadingByRepairRequest } from '@/src/features/invoices/invoiceSlice';
import InvoiceListItem from '@/src/components/InvoiceListItem';
import WheelDateTimePicker from '@/src/components/common/WheelDateTimePicker';
import { getRequest, selectCurrentRequest } from '@/src/features/requests/requestsSlice';

const THEME = Colors.light;
const OWNER_LABEL = {
  BuildingFault: 'Lỗi tòa nhà',
  ResidentFault: 'Lỗi cư dân',
  1: 'Lỗi tòa nhà',
  2: 'Lỗi cư dân',
};
const SOLUTION_LABEL = {
  Repair: 'Sửa chữa',
  Replacement: 'Thay thế',
  Outsource: 'Thuê ngoài',
  1: 'Sửa chữa',
  2: 'Thay thế',
  3: 'Thuê ngoài',
};// sau ròi để vô helper sau

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('details');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [showAcceptancePicker, setShowAcceptancePicker] = useState(false);
  const [tempAcceptanceDate, setTempAcceptanceDate] = useState(new Date());
  const [showNextApptStartPicker, setShowNextApptStartPicker] = useState(false);
  const [tempNextApptStart, setTempNextApptStart] = useState(new Date());
  const [showNextApptEndPicker, setShowNextApptEndPicker] = useState(false);
  const [tempNextApptEnd, setTempNextApptEnd] = useState(new Date());
  const [nextApptStart, setNextApptStart] = useState(null);
  const dispatch = useAppDispatch();

  
  const appointment = useAppSelector((state) => selectAppointmentById(state, id));
  const loading = useAppSelector((state) => selectAppointmentLoading(state, id));
  const error = useAppSelector((state) => selectAppointmentError(state, id));
  const inspectionReportIds = useAppSelector((s) => selectReportIdsByAppointment(s, id));
  const inspectionReportsById = useAppSelector((s) => s.inspectionReports.byId);
  const inspectionReportLoading = useAppSelector((s) => selectReportLoadingByAppointment(s, id));
  const checkingIn = useAppSelector((state) => selectAppointmentCheckingIn(state, id));
  const repairReportIds = useAppSelector((s) => selectRepairReportIdsByAppointment(s, id));
  const repairReportLoading = useAppSelector((s) => selectRepairReportLoadingByAppointment(s, id));
  const repairReportsById = (useAppSelector((s) => s.repairReports.byId));
  const repairRequestId = appointment?.repairRequest?.repairRequestId;
  const invoices = useAppSelector((state) =>repairRequestId ? selectInvoicesByRepairRequest(state, repairRequestId) : []);
  const invoicesLoading = useAppSelector((state) =>repairRequestId ? selectInvoicesLoadingByRepairRequest(state, repairRequestId) : false);
  const invoicesError = useAppSelector((state) =>repairRequestId ? selectInvoicesErrorByRepairRequest(state, repairRequestId) : null);
  const completing = useAppSelector((state) => selectAppointmentCompleting(state, id));
  const creatingAppt = useAppSelector(selectAppointmentCreating);
  const currentRequest = useAppSelector(selectCurrentRequest);
  // console.log('[appointmentss]', pretty(appointment));

  useEffect(() => {
    if (id) {
      dispatch(fetchAppointmentById(id));
      dispatch(fetchInspectionReportByAppointmentId(id));
      dispatch(fetchRepairReportByAppointment({ appointmentId: id }));
    }
  }, [id, dispatch]);
  
  useEffect(() => {
    if (repairRequestId) {
      dispatch(fetchInvoicesByRepairRequestId(repairRequestId));
      dispatch(getRequest(repairRequestId));
    }
  }, [repairRequestId, dispatch]);

  // const allReportsById = useAppSelector((s) => s.inspectionReports.byId);
  // console.log('[repair report]',pretty(appointment));
  const lastInspectionReport = useMemo(() => {
    if (!inspectionReportIds || inspectionReportIds.length === 0) return null;
    const list = inspectionReportIds
      .map((rid) => inspectionReportsById[rid])
      .filter(Boolean);
    if (list.length === 0) return null;
    return list.reduce((latest, cur) => {
      const t1 = new Date(latest?.createdAt || 0).getTime();
      const t2 = new Date(cur?.createdAt || 0).getTime();
      return t2 > t1 ? cur : latest;
    }, list[0]);
  }, [inspectionReportIds, inspectionReportsById]);

  const lastRepairReport = useMemo(() => {
    if (!repairReportIds || repairReportIds.length === 0) return null;
    const list = repairReportIds
      .map((rid) => repairReportsById[rid])
      .filter(Boolean);
    if (list.length === 0) return null;
    return list.reduce((latest, cur) => {
      const t1 = new Date(latest?.createdAt || 0).getTime();
      const t2 = new Date(cur?.createdAt || 0).getTime();
      return t2 > t1 ? cur : latest;
    }, list[0]);
  }, [repairReportIds, repairReportsById]);

  const hasPreviousAppointment = useMemo(() => {
    if (!currentRequest || !appointment?.appointmentId) return false;
    const rawAppts = currentRequest.appointments;
    const appts = (rawAppts?.$values ?? rawAppts ?? []).slice();
    if (!appts.length) return false;
    appts.sort((a, b) => {
      const ta = new Date(a.startTime || a.createdAt || 0).getTime();
      const tb = new Date(b.startTime || b.createdAt || 0).getTime();
      return ta - tb;
    });
    const idx = appts.findIndex(
      (x) => x.appointmentId === appointment.appointmentId
    );
    if (idx === -1) return false;    // không tìm thấy -> coi như buổi đầu
    return idx > 0;                  // index > 0 => đã có ít nhất 1 buổi trước đó
  }, [currentRequest, appointment?.appointmentId]);


  // console.log('appointment = useAppSelector', pretty(appointment));
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
    if (!id) return;
    setTempAcceptanceDate(new Date());
    setShowAcceptancePicker(true);
  };
  
  const handleAcceptancePicked = async (date) => {
    if (!id) return;
    setShowAcceptancePicker(false);
    const acceptanceTime = date.toISOString().slice(0, 10); 

    try {
      await dispatch(
        completeAppointment({
          id: Number(id),
          note: 'Kỹ thuật viên xác nhận đã hoàn thành công việc.',
          hasNextAppointment: false,
          acceptanceTime,
        })
      ).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Đã hoàn tất lịch hẹn',
      });

      dispatch(fetchAppointmentById(id));
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Hoàn tất thất bại',
        text2: e?.message || 'Vui lòng thử lại.',
      });
    }
  };
  const handleCompleteAndPlanNext = () => {
    if (!id) return;

    Alert.alert(
      'Kết thúc buổi hiện tại',
      'Bạn sẽ hẹn lịch mới cho lần sửa tiếp theo.',
      [
        { text: 'Huỷ', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: async () => {
            try {
              await dispatch(
                completeAppointment({
                  id: Number(id),
                  note: 'Kết thúc buổi hẹn, sẽ có lịch hẹn tiếp theo.',
                  hasNextAppointment: true,
                  acceptanceTime: null, // ❗ không cần nghiệm thu ở buổi hẹn tạm
                })
              ).unwrap();

              Toast.show({
                type: 'success',
                text1: 'Đã hoàn tất buổi hẹn',
                text2: 'Bạn có thể tạo lịch hẹn mới.',
              });

              dispatch(fetchAppointmentById(id));
            } catch (e) {
              Toast.show({
                type: 'error',
                text1: 'Hoàn tất thất bại',
                text2: e?.message || 'Vui lòng thử lại.',
              });
            }
          },
        },
      ]
    );
  };

  const handleCreateNewAppointment = () => {
    if (!appointment?.repairRequest?.repairRequestId) {
      Alert.alert('Thiếu dữ liệu', 'Không tìm thấy ID yêu cầu sửa chữa.');
      return;
    }

    const now = new Date();
    setTempNextApptStart(now);
    setShowNextApptStartPicker(true);
  };

  const handleNextApptStartPicked = (date) => {
    if (!appointment?.repairRequest?.repairRequestId) {
      Alert.alert('Thiếu dữ liệu', 'Không tìm thấy ID yêu cầu sửa chữa.');
      return;
    }

    setShowNextApptStartPicker(false);

    setNextApptStart(date);
    const suggestedEnd = new Date(date.getTime() + 60 * 60 * 1000);
    setTempNextApptEnd(suggestedEnd);

    setShowNextApptEndPicker(true);
  };

  // Bước 2: chọn thời gian kết thúc
  const handleNextApptEndPicked = async (date) => {
    if (!appointment?.repairRequest?.repairRequestId) {
      Alert.alert('Thiếu dữ liệu', 'Không tìm thấy ID yêu cầu sửa chữa.');
      return;
    }

    const start = nextApptStart || tempNextApptStart;

    if (date <= start) {
      Alert.alert(
        'Thời gian không hợp lệ',
        'Thời gian kết thúc phải sau thời gian bắt đầu.'
      );
      const suggestedEnd = new Date(start.getTime() + 60 * 60 * 1000);
      setTempNextApptEnd(suggestedEnd);
      return;
    }

    setShowNextApptEndPicker(false);

    const repairRequestId = appointment.repairRequest.repairRequestId;
    const startTime = toLocalIsoNoOffset(start); 
    const endTime = toLocalIsoNoOffset(date);   

    try {
      await dispatch(
        createAppointment({
          repairRequestId,
          startTime,
          endTime,
          note: `Lịch hẹn tiếp theo cho yêu cầu #${repairRequestId}`,
        })
      ).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Đã tạo lịch hẹn mới',
        text2: 'Lịch tiếp theo cho yêu cầu này đã được tạo.',
      });

      if (id) {
        dispatch(fetchAppointmentById(id));
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Tạo lịch hẹn mới thất bại',
        text2: e?.message || 'Vui lòng thử lại.',
      });
    }
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
      pathname: '/(technician)/invoice-payment',
      params: { repairRequestId: Number(appointment?.repairRequest?.repairRequestId) },
    });
  };
  const goInvoiceDetail = (invoiceId) => {
    if (!invoiceId) return;
    router.push({
      pathname: '/(technician)/invoice/[id]',
      params: {
        id: String(invoiceId),
        repairRequestId: String(appointment?.repairRequest?.repairRequestId ?? ''),
      },
    });
  };
  const handleCreateChatWithResident = async () => {
    // Lấy residentId đúng từ apartment
    const residentId = appointment?.appointmentTrackings[0]?.updatedByUser?.userId;

    if (!residentId) {
      Alert.alert('Không thể mở chat', 'Thiếu thông tin cư dân của căn hộ.');
      return;
    }

    try {
      // 1. Kiểm tra xem đã có room 1–1 chưa
      const existingConvId = await dispatch(
        checkExistingConversation(residentId)
      ).unwrap();

      let convId = existingConvId;
      let convTitle = '';

      // 2. Nếu chưa có -> tạo mới
      if (!convId) {
        const res = await dispatch(
          createConversation({
            title: '',              // 1–1 thì để rỗng, BE tự sinh tiêu đề
            userIds: [residentId],
          })
        ).unwrap();

        const conv = res?.data || res;
        convId = conv?.conversationId ?? conv?.id;
        convTitle = conv?.title || `Cư dân #${residentId}`;

        if (!convId) {
          throw new Error('Không nhận được conversationId từ server');
        }
      }

      // 3. Điều hướng sang màn chat, param id là conversationId
      router.push({
        pathname: '/(technician)/chat/[id]',
        params: {
          id: String(convId),
          title: convTitle || `Cư dân #${residentId}`,
        },
      });
    } catch (e) {
      console.log('[openConversationWithResident error]', e);
      Alert.alert(
        'Không thể mở hội thoại',
        e?.message || 'Vui lòng thử lại sau.'
      );
    }
  };

  const goInspectionReportDetail = (reportId) => {
    router.push({ pathname: '/(technician)/inspectionReport/[id]', params: { id: String(reportId) } });
  };
  const goRepairReportDetail = (reportId) => {
    router.push({ pathname: '/(technician)/repairReport/[id]', params: { id: String(reportId) } });
  };
  const PIPELINE = [
    'Pending',
    'Assigned',
    'Confirmed',
    'InVisit',
    'AwaitingIRApproval',
    'InRepair',
    'Completed',
  ];

  const STATUS_DISPLAY = {
    Pending: 'Chờ phân công',
    Assigned: 'Đã phân công',
    Confirmed: 'Đã xác nhận',
    InVisit: 'Đã check-in',
    AwaitingIRApproval: 'Chờ duyệt báo cáo kiểm tra',
    InRepair: 'Đang sửa chữa',
    Completed: 'Hoàn tất',
  };

  function normalizeTrackings(appointment) {
    const raw = appointment?.appointmentTrackings;
    const arr = (raw?.$values ?? raw ?? []);
    return arr
      .map(x => ({
        trackingId: x.trackingId,
        status: x.status,
        note: x.note,
        at: x.updatedAt,
        by: x.updatedByUser
          ? `${x.updatedByUser.firstName || ''} ${x.updatedByUser.lastName || ''}`.trim()
          : '',
      }))
      .sort((a, b) => new Date(a.at) - new Date(b.at));
  }

  function computeCurrentIndex(trackings) {
    let max = -1;
    for (const t of trackings) {
      const idx = PIPELINE.indexOf(t.status);
      if (idx > max) max = idx;
    }
    return max;
  }
  const onRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      const promises = [];

      promises.push(dispatch(fetchAppointmentById(id)).unwrap());
      promises.push(dispatch(fetchInspectionReportByAppointmentId(id)).unwrap());
      promises.push(dispatch(fetchRepairReportByAppointment({ appointmentId: id })).unwrap());


      if (repairRequestId) {
        promises.push(dispatch(fetchInvoicesByRepairRequestId(repairRequestId)).unwrap());
      }

      await Promise.all(promises);
    } catch (e) {
      console.log('Refresh error', e);
      Toast.show({
        type: 'error',
        text1: 'Làm mới thất bại',
        text2: e.message || 'Vui lòng thử lại.',
      });
    } finally {
      setRefreshing(false);
    }
  };
  // mục đích là để loadxong hết mới hiện data
  useEffect(() => {
    if (initialLoaded) return;

    const hasAppointmentOrError = !!appointment || !!error;
    const inspectionDone = !inspectionReportLoading;
    const repairDone = !repairReportLoading;
    const invoiceDone =
      !repairRequestId || !invoicesLoading || !!invoicesError;

    if (hasAppointmentOrError && inspectionDone && repairDone && invoiceDone) {
      setInitialLoaded(true);
    }
  }, [
    initialLoaded,
    appointment,
    error,
    inspectionReportLoading,
    repairReportLoading,
    invoicesLoading,
    repairRequestId,
    invoicesError,
  ]);

  if (!initialLoaded) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={appleBlue} />
        <Text style={{ marginTop: 8, color: zincColors[600] }}>Đang tải dữ liệu cuộc hẹn…</Text>
      </View>
    );
  }

  const solutionTypeRaw = lastInspectionReport?.solutionType;
  const solutionTypeNorm =
    solutionTypeRaw === 1 || solutionTypeRaw === 'Repair'
      ? 'Repair'
      : solutionTypeRaw === 2 || solutionTypeRaw === 'Replacement'
      ? 'Replacement'
      : solutionTypeRaw === 3 || solutionTypeRaw === 'Outsource'
      ? 'Outsource'
      : undefined;

  const isOutsource = solutionTypeNorm === 'Outsource';

  const hasInspectionReport = inspectionReportIds && inspectionReportIds.length > 0;
  const hasRepairReport = repairReportIds && repairReportIds.length > 0;
  const hasInvoice = invoices && invoices.length > 0;
  const inspectionApproved = lastInspectionReport?.status === 'Approved';
  const repairApproved = lastRepairReport?.status === 'Approved';
  //console.log('lastsss', appointment?.status === 'InRepair'
          //&& isHasPreviousAppointment);
          //console.log('thanh',appointment?.status)
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
      <ScrollView style={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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
                <Item icon="flag" label="Người chịu lỗi" value={
                  lastInspectionReport
                  ? (OWNER_LABEL[lastInspectionReport.faultOwner] ?? String(lastInspectionReport.faultOwner))
                  : '-'} />
                <Item
                  icon="wrench"
                  label="Loại giải pháp"
                  value={
                  lastInspectionReport
                    ? (SOLUTION_LABEL[lastInspectionReport?.solutionType] ?? String(lastInspectionReport?.solutionType))
                    : '-'}
                />
                <Item
                  icon="clock"
                  label="Ngày tạo"
                  value={timeDayDate(appointment?.createdAt) || '-'}
                />
                <Item
                  icon="text.justify"
                  label="Mô tả hiện trạng"
                  value={lastInspectionReport?.description || '-'}
                />
                <Item icon="list.bullet" label="Giải pháp" value={lastInspectionReport?.solution || '-'} />
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
                {repairReportLoading && repairReportIds.length === 0 ? (
                  <Text style={{ color: zincColors[500], marginLeft: 40}}>Đang tải danh sách báo cáo…</Text>
                ) : repairReportIds.length === 0 ? (
                  <Text style={{ color: zincColors[500], marginLeft: 40 }}>Chưa có báo cáo nào.</Text>
                ) : ( 
                  <View style={{ gap: 10 }}>
                    {repairReportIds.map((rrid, idx) => (
                      <ReportListItem
                        key={rrid}
                        index={idx + 1} // "Báo cáo [x]"
                        report={repairReportsById[rrid]}
                        type='Repair'
                        onPress={() => goRepairReportDetail(rrid)}
                      />
                    ))}
                  </View>
                )}
            </View>
            {/* invoice */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hóa đơn</Text>

              {invoicesLoading ? (
                <Text style={{ color: zincColors[500], marginLeft: 40 }}>
                  Đang tải danh sách hóa đơn…
                </Text>
              ) : invoicesError ? (
                <Text style={styles.invoiceError}>{invoicesError}</Text>
              ) : invoices.length === 0 ? (
                <Text style={{ color: zincColors[500], marginLeft: 40 }}>
                  Chưa có hóa đơn nào.
                </Text>
              ) : (
                <View style={{ gap: 10 }}>
                  {invoices.map((inv, idx) => (
                    <InvoiceListItem
                      key={inv.invoiceId}
                      index={idx + 1}
                      invoice={inv}
                      onPress={() => goInvoiceDetail(inv.invoiceId)}
                    />
                  ))}
                </View>
              )}
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
                  value={appointment?.repairRequest?.apartment?.room || '-'}
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
            {(() => {
              const trackings = normalizeTrackings(appointment);
              console.log('[trackings]', trackings)
              const currentIndex = computeCurrentIndex(trackings);
              
              return (
                <View>
                  <Text style={styles.sectionTitle}>Tiến độ</Text>

                  <ProgressStepper
                    steps={PIPELINE.map(k => STATUS_DISPLAY[k] || k)}
                    currentIndex={currentIndex}
                    showPercent
                  />

                  <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Dòng thời gian</Text>
                  <View style={styles.timeline}>
                    {trackings.length === 0 ? (
                      <Text style={{ color: '#64748B', marginLeft: 8 }}>Chưa có cập nhật tiến độ.</Text>
                    ) : (
                      trackings.map((t) => (
                        <TimelineItem
                          key={t.trackingId}
                          icon="clock"
                          title={STATUS_DISPLAY[t.status] || t.status}
                          date={timeDayDate(t.at)}
                          desc={[t.note, t.by ? `Bởi ${t.by}` : ''].filter(Boolean).join(' • ')}
                        />
                      ))
                    )}
                  </View>
                </View>
              );
            })()}
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
        {(appointment?.status === 'Completed')
        && !isOutsource && (
            <Pressable style={styles.primaryBtn} onPress={handleCreateInvoice}>
              <Icon name="doc.text" size={20} color={THEME.background} />
              <Text style={styles.primaryBtnText}>
                {hasInvoice ? 'Tạo thêm hóa đơn' : 'Tạo hóa đơn'}
              </Text>
            </Pressable>
        )}
        {appointment?.status === 'Confirmed' && (
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
        )}
        {(
          appointment?.status === 'AwaitingIRApproval' ||
          (appointment?.status === 'InVisit' && !hasPreviousAppointment)
        ) && (
          <Pressable style={styles.primaryBtn} onPress={handleCreateInspectionReport}>
            <Icon name="doc.text" size={20} color={THEME.background} />
            <Text style={styles.primaryBtnText}>
              {hasInspectionReport ? 'Thêm báo cáo k/sát' : 'Báo cáo khảo sát'}
            </Text>
          </Pressable>
        )}
        {appointment?.status === 'InVisit' && hasPreviousAppointment && (
          <Pressable style={styles.secondaryBtn} onPress={handleStartRepair}>
            <Icon name="pencil" size={20} color={appleBlue} />
            <Text style={styles.secondaryBtnText}>Bắt đầu sửa chữa</Text>
          </Pressable>
        )}
        {appointment?.status === 'AwaitingIRApproval' && inspectionApproved && (
          <>
            {isOutsource ? (
              <Pressable
                style={styles.secondaryBtn}
                onPress={handleCompleteAndPlanNext}
              >
                <Icon name="checkmark.circle" size={20} color={appleGreen} />
                <Text style={styles.secondaryBtnText}>
                  Hoàn tất
                </Text>
              </Pressable>
            ) : (
              <Pressable style={styles.secondaryBtn} onPress={handleStartRepair}>
                <Icon name="pencil" size={20} color={appleBlue} />
                <Text style={styles.secondaryBtnText}>Bắt đầu sửa chữa</Text>
              </Pressable>
            )}
          </>
        )}
        {appointment?.status === 'InRepair' && (
          <>
            <Pressable style={styles.primaryBtn} onPress={handleCreateRepairReport}>
              <Icon name="pencil" size={20} color={appleBlue} />
              <Text style={styles.primaryBtnText}>
                {hasRepairReport ? 'Thêm báo cáo sửa chữa' : 'Báo cáo sửa chữa'}
              </Text>
            </Pressable>

            {repairApproved && (
              <Pressable style={styles.secondaryBtn} onPress={handleMarkCompleted}>
                <Icon name="checkmark.circle" size={20} color={appleGreen} />
                <Text style={styles.secondaryBtnText}>Hoàn tất</Text>
              </Pressable>
            )}
          </>
        )}
        
        {appointment?.status === 'Completed'
          && hasInspectionReport
          && isOutsource && (
            <Pressable
              style={[styles.secondaryBtn, creatingAppt && { opacity: 0.6 }]}
              onPress={creatingAppt ? undefined : handleCreateNewAppointment}
              disabled={creatingAppt}
            >
              {creatingAppt ? (
                <ActivityIndicator color={appleGreen} />
              ) : (
                <>
                  <Icon name="calendar" size={20} color={appleGreen} />
                  <Text style={styles.secondaryBtnText}>Tạo lịch hẹn mới</Text>
                </>
              )}
            </Pressable>
        )}
        {/* buổi 2 là inrepair */}
      </View>
      <WheelDateTimePicker
        visible={showAcceptancePicker}
        onClose={() => setShowAcceptancePicker(false)}
        initialDate={tempAcceptanceDate}
        title="Chọn ngày nghiệm thu"
        cancelText="Huỷ"
        confirmText="Chọn"
        onConfirm={handleAcceptancePicked}
      />
      {/* chọn thời gian mới */}
      <WheelDateTimePicker
        visible={showNextApptStartPicker}
        onClose={() => setShowNextApptStartPicker(false)}
        initialDate={tempNextApptStart}
        title="Chọn thời gian bắt đầu"
        cancelText="Huỷ"
        confirmText="Tiếp tục"
        onConfirm={handleNextApptStartPicked}
      />
      <WheelDateTimePicker
        visible={showNextApptEndPicker}
        onClose={() => setShowNextApptEndPicker(false)}
        initialDate={tempNextApptEnd}
        title="Chọn thời gian kết thúc"
        cancelText="Huỷ"
        confirmText="Tạo lịch hẹn"
        onConfirm={handleNextApptEndPicked}
      />
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
