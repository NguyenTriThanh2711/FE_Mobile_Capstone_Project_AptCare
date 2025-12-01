import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import {
  fetchInspectionReportById,
  selectReportById,
  selectReportLoadingById,
} from '@/src/features/inspectionReport/inspectionRPSlice';
import {
  Colors,
  zincColors,
  appleBlue,
  borderColor,
} from '@/src/utils/colors';
import ImagePickerStrip from '@/src/components/ImagePickerStrip';
import { timeDayDate } from '@/src/utils/date';
import { dotnetArr } from '@/src/helper/dotnetArr';
import { pretty } from '@/src/helper/prettyLog';
import Badge from '@/src/components/Badge';

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
};

const INVOICE_TYPE_LABEL = {
  InternalRepair: 'Sửa chữa nội bộ',
  ExternalRepair: 'Thuê ngoài',
};

const INVOICE_STATUS_LABEL = {
  Draft: 'Nháp',
  Pending: 'Chờ thanh toán',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã huỷ',
};

const formatCurrency = (v) => {
  if (v == null) return '-';
  const n = Number(v) || 0;
  try {
    return n.toLocaleString('vi-VN') + ' ₫';
  } catch {
    return `${n} ₫`;
  }
};

export default function InspectReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const reportId = Number(id);
  const dispatch = useAppDispatch();

  const loading = useAppSelector((s) =>
    selectReportLoadingById(s, reportId)
  );
  const report = useAppSelector((s) => selectReportById(s, reportId));

  console.log('[data => isreport]', pretty(report));

  useEffect(() => {
    if (reportId) dispatch(fetchInspectionReportById(reportId));
  }, [reportId, dispatch]);

  const createdAtText = report?.createdAt
    ? timeDayDate(report.createdAt)
    : '-';

  const medias = useMemo(() => dotnetArr(report?.medias), [report]);

  const techniques = useMemo(
    () => dotnetArr(report?.technican?.techniques),
    [report]
  );

  const invoiceServices = useMemo(
    () => dotnetArr(report?.invoice?.services),
    [report]
  );

  const invoiceAccessories = useMemo(
    () => dotnetArr(report?.invoice?.accessories),
    [report]
  );

  const apartment = report?.appointment?.repairRequest?.apartment;
  const repairRequest = report?.appointment?.repairRequest;
  const invoice = report?.invoice;

  const handleGoInvoiceDetail = () => {
    if (!invoice?.invoiceId) return;
    router.push({
      pathname: '/(technician)/invoice/[id]',
      params: {
        id: String(invoice.invoiceId),
        repairRequestId: String(invoice.repairRequestId ?? ''),
      },
    });
  };

  return (
    <View
      style={{ flex: 1, backgroundColor: THEME.background, paddingTop: 40 }}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Icon name="doc.text" size={20} color={appleBlue} />
        <Text style={styles.headerTitle}>Chi tiết báo cáo khảo sát</Text>
      </View>

      {loading && !report ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: zincColors[500] }}>
            Đang tải…
          </Text>
        </View>
      ) : !report ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: zincColors[600] }}>
            Không tìm thấy báo cáo.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        >
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Thông tin báo cáo</Text>
            <Row
              label="Mã báo cáo"
              value={report.inspectionReportId}
            />
            <Row label="Mã cuộc hẹn" value={report.appointmentId} />
            <Row label="Mã yêu cầu sửa" value={repairRequest?.repairRequestId} />
            <Row label="Thời gian tạo" value={createdAtText} />
            <Row
              label="Trạng thái"
              value={<Badge status={report.status} />}
            />
            <Row label="Khu vực" value={report.areaName || '-'} />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Kết quả khảo sát</Text>
            <Row
              label="Người chịu lỗi"
              value={
                OWNER_LABEL[report.faultOwner] ||
                String(report.faultOwner || '-')
              }
            />
            <Row
              label="Giải pháp"
              value={
                SOLUTION_LABEL[report.solutionType] ||
                String(report.solutionType || '-')
              }
            />

            <Text style={[styles.subTitle, { marginTop: 12 }]}>
              Mô tả hiện trạng
            </Text>
            <Text style={styles.paragraph}>
              {report.description || '-'}
            </Text>

            <Text style={[styles.subTitle, { marginTop: 12 }]}>
              Phương án xử lý
            </Text>
            <Text style={styles.paragraph}>
              {report.solution || '-'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Căn hộ & yêu cầu sửa chữa</Text>
            <Row
              label="Căn hộ"
              value={apartment?.room || '-'}
            />
            <Row
              label="Tầng"
              value={
                apartment?.floorId ??
                apartment?.floor ??
                '-'
              }
            />
            <Row
              label="Mô tả căn hộ"
              value={apartment?.description || '-'}
            />
            {/* <Row
              label="Diện tích"
              value={apartment?.area ? `${apartment.area} m²` : '-'}
            /> */}
            <Row
              label="Tiêu đề yêu cầu"
              value={repairRequest?.object || '-'}
            />
            <Row
              label="Mô tả yêu cầu"
              value={repairRequest?.description || '-'}
            />
          </View>

          {/* Kỹ thuật viên */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Kỹ thuật viên</Text>
            <Text style={styles.paragraph}>
              {report?.technican
                ? `KTV. ${report.technican?.firstName || ''} ${
                    report.technican?.lastName || ''
                  } (${report.technican?.phoneNumber || '-'})`
                : '-'}
            </Text>

            {techniques.length > 0 && (
              <>
                <Text style={[styles.subTitle, { marginTop: 12 }]}>
                  Kỹ năng phụ trách
                </Text>
                <Text style={styles.paragraph}>
                  {techniques.join(', ')}
                </Text>
              </>
            )}
          </View>
          {invoice && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Hóa đơn liên quan</Text>
              <Row label="Mã hóa đơn" value={invoice.invoiceId} />
              <Row
                label="Loại hóa đơn"
                value={
                  INVOICE_TYPE_LABEL[invoice.type] ||
                  String(invoice.type || '-')
                }
              />
              <Row
                label="Có tính phí"
                value={invoice?.isChargeable ? 'Có' : 'Không'}
              />
              <Row
                label="Tổng tiền"
                value={formatCurrency(invoice.totalAmount)}
              />
              <Row
                label="Trạng thái"
                value={<Badge status={invoice.status} />}
              />

              {invoiceServices.length > 0 && (
                <>
                  <Text
                    style={[styles.subTitle, { marginTop: 12 }]}
                  >
                    Công việc
                  </Text>
                  {invoiceServices.map((sv, idx) => (
                    <View
                      key={sv.invoiceServiceId ?? idx}
                      style={styles.serviceRow}
                    >
                      <Text style={styles.serviceName}>
                        {sv.name || `Công việc ${idx + 1}`}
                      </Text>
                      <Text style={styles.servicePrice}>
                        {formatCurrency(sv.price)}
                      </Text>
                    </View>
                  ))}
                </>
              )}

              {invoiceAccessories.length > 0 && (
                <>
                  <Text
                    style={[styles.subTitle, { marginTop: 12 }]}
                  >
                    Vật tư phụ tùng
                  </Text>
                  {invoiceAccessories.map((ac, idx) => (
                    <View
                      key={ac.invoiceAccessoryId ?? idx}
                      style={styles.serviceRow}
                    >
                      <Text style={styles.serviceName}>
                        {ac.name || `Phụ tùng ${idx + 1}`}
                      </Text>
                      <Text style={styles.servicePrice}>
                        x{ac.quantity || 1}
                      </Text>
                    </View>
                  ))}
                </>
              )}
              { invoice.status !== 'Draft' && (
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                <Pressable
                  style={[styles.invoiceBtn]}
                  onPress={handleGoInvoiceDetail}
                >
                  <Icon
                    name="doc.text"
                    size={18}
                    color={appleBlue}
                  />
                  <Text style={styles.invoiceBtnText}>
                    Xem chi tiết hóa đơn
                  </Text>
                </Pressable>
                </View>
              )}
            </View>
          )}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Hình ảnh đính kèm</Text>
            {medias.length === 0 ? (
              <Text style={{ color: zincColors[500] }}>
                Không có hình ảnh.
              </Text>
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
        </ScrollView>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: zincColors[700],
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14,
    color: THEME.text,
    lineHeight: 20,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  rowLabel: {
    flex: 1,
    color: zincColors[600],
    fontWeight: '600',
    fontSize: 13,
  },
  rowValue: {
    flex: 1.4,
    textAlign: 'right',
    color: THEME.text,
    fontWeight: '700',
    fontSize: 13,
  },

  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  serviceName: {
    fontSize: 14,
    color: THEME.text,
    flex: 1,
    marginRight: 8,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },

  invoiceBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appleBlue,
    backgroundColor: '#f8fafc',
    gap: 6,
  },
  invoiceBtnText: {
    color: appleBlue,
    fontWeight: '700',
    fontSize: 13,
  },
});
