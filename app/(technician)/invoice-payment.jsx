import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Image, Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Toast from 'react-native-toast-message';
import http from '@/src/services/http';
import { Icon } from '@/src/components/Icon.native';
import { Colors, zincColors, appleBlue, appleGreen, borderColor } from '@/src/utils/colors';

// ==== ĐỔI CHO PHÙ HỢP VỚI BE CỦA BẠN ====
const INVOICE_GET_ENDPOINT = (id) => `/api/invoices/${id}`;
const INVOICE_CREATE_INTERNAL = '/api/invoices/internal';           // POST
const INVOICE_MARK_PAID = (id) => `/api/invoices/${id}/pay`;        // POST
const PAYMENT_QR_ENDPOINT = '/api/payments/qr';                     // POST {invoiceId, amount} -> {qrCodeUrl|qrDataUrl|imageBase64, checkoutUrl?}

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };

const METHODS = [
  { key: 'CASH', label: 'Tiền mặt', icon: 'banknote' },
  { key: 'TRANSFER', label: 'Chuyển khoản', icon: 'arrow.right.arrow.left' },
  { key: 'CARD', label: 'Thẻ', icon: 'creditcard' },
  { key: 'QR', label: 'QR (PayOS/VNPay)', icon: 'qrcode' },
];

export default function InvoicePaymentScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const [invoice, setInvoice] = useState(null);
  const [method, setMethod] = useState('CASH');
  const [given, setGiven] = useState('');
  const [note, setNote] = useState('');
  const [qrData, setQrData] = useState(null); // {image, url}
  const [qrOpen, setQrOpen] = useState(false);

  const invoiceIdParam = params?.invoiceId ? Number(params.invoiceId) : null;
  const rrIdParam = params?.repairRequestId ? Number(params.repairRequestId) : null;

  // ---- Helpers để tính tổng nếu BE không gửi totalAmount
  const services = Array.isArray(invoice?.services) ? invoice.services : [];
  const accessories = Array.isArray(invoice?.accessories) ? invoice.accessories : [];

  // Nếu BE có totalAmount thì ưu tiên dùng
  const fallbackTotal = useMemo(() => {
    const svc = services.reduce((s, x) => s + (Number(x?.price) || 0), 0);
    const acc = accessories.reduce((s, x) => {
      // nếu BE trả unitPrice -> tính unitPrice*quantity; nếu không -> 0
      const unit = Number(x?.unitPrice ?? 0);
      const q = Number(x?.quantity ?? 0);
      return s + (unit * q);
    }, 0);
    return svc + acc;
  }, [services, accessories]);

  const total = Number(invoice?.totalAmount ? invoice.totalAmount : fallbackTotal || 0);
  const givenAmount = Number((given || '').toString().replace(/[^\d.]/g, '')) || 0;
  const change = Math.max(givenAmount - total, 0);

  // ---- Load invoice (hoặc tạo nhanh nếu chỉ có rrId)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let inv = null;

        if (invoiceIdParam) {
          const { data } = await http.get(INVOICE_GET_ENDPOINT(invoiceIdParam));
          inv = data;
        } else if (rrIdParam) {
          // tạo nhanh 1 invoice nội bộ isChargeable: true, chưa có phụ kiện/dịch vụ
          setCreating(true);
          const payload = {
            repairRequestId: rrIdParam,
            isChargeable: true,
            accessories: [],
            services: [],
          };
          const { data: created } = await http.post(INVOICE_CREATE_INTERNAL, payload);
          inv = created;
        }

        if (!inv) {
          Toast.show({ type: 'error', text1: 'Không tìm thấy hóa đơn' });
          router.back();
          return;
        }

        setInvoice(inv);
      } catch (e) {
        const msg = e?.response?.data?.detail || e?.message || 'Không tải được hoá đơn';
        Toast.show({ type: 'error', text1: msg });
        router.back();
      } finally {
        setCreating(false);
        setLoading(false);
      }
    })();
  }, [invoiceIdParam, rrIdParam]);

  const buildCustomerTitle = () => {
    const apt = invoice?.repairRequest?.apartment;
    return (apt?.residentName && apt?.room) ? `${apt.residentName} (${apt.room})` : (apt?.room || '--');
  };

  const handleCreateQR = async () => {
    if (!invoice?.invoiceId) return;
    try {
      setQrLoading(true);
      setQrData(null);

      const payload = { invoiceId: Number(invoice.invoiceId), amount: Number(total) };
      const { data } = await http.post(PAYMENT_QR_ENDPOINT, payload);

      const image =
        data?.qrDataUrl || data?.qrCodeUrl || data?.imageBase64
          ? (data?.qrDataUrl || data?.qrCodeUrl || `data:image/png;base64,${data?.imageBase64}`)
          : null;
      const url = data?.checkoutUrl || data?.deeplink || null;

      if (!image && !url) {
        Toast.show({ type: 'info', text1: 'Không nhận được QR từ máy chủ' });
        return;
      }
      setQrData({ image, url });
      setQrOpen(true);
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Không tạo được QR';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setQrLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice?.invoiceId) return;
    try {
      setPaying(true);
      const payload = {
        method,                      
        amount: Number(total),       
        givenAmount: givenAmount || undefined,
        note: note?.trim() || undefined,
      };
      await http.post(INVOICE_MARK_PAID(invoice.invoiceId), payload);
      Toast.show({ type: 'success', text1: 'Đã ghi nhận thanh toán' });
      router.back();
    } catch (e) {
      const msg = e?.response?.data?.detail || e?.message || 'Ghi nhận thanh toán thất bại';
      Toast.show({ type: 'error', text1: msg });
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ color: zincColors[500], marginTop: 6 }}>{creating ? 'Đang tạo hóa đơn…' : 'Đang tải hoá đơn…'}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background, paddingTop: 20 }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Icon name="creditcard" size={20} color={appleBlue} />
        <Text style={styles.headerTitle}>Thanh toán hoá đơn</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* Thông tin chung */}
        <View style={styles.card}>
          <Row label="Mã hóa đơn" value={invoice?.invoiceId ?? '--'} />
          <Row label="Yêu cầu sửa" value={invoice?.repairRequestId ?? '--'} />
          <Row label="Khách/Căn hộ" value={buildCustomerTitle()} />
        </View>

        {/* Dịch vụ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="hammer" size={18} color={appleBlue} />
            <Text style={styles.cardTitle}>Dịch vụ</Text>
          </View>
          {services.length === 0 ? (
            <Text style={{ color: zincColors[500] }}>Không có dịch vụ.</Text>
          ) : services.map((s, i) => (
            <LineItemRow
              key={`${s?.name}-${i}`}
              name={s?.name || `Dịch vụ #${i + 1}`}
              right={(Number(s?.price) || 0).toLocaleString('vi-VN') + ' đ'}
            />
          ))}
        </View>

        {/* Phụ kiện */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="wrench" size={18} color={appleBlue} />
            <Text style={styles.cardTitle}>Phụ kiện</Text>
          </View>
          {accessories.length === 0 ? (
            <Text style={{ color: zincColors[500] }}>Không có phụ kiện.</Text>
          ) : accessories.map((a, i) => {
            const unit = Number(a?.unitPrice ?? 0);
            const qty = Number(a?.quantity ?? 0);
            const line = unit * qty;
            return (
              <LineItemRow
                key={`${a?.accessoryId}-${i}`}
                name={`#${a?.accessoryId} x${qty}`}
                right={(line || 0).toLocaleString('vi-VN') + ' đ'}
                sub={unit ? `đơn giá ${unit.toLocaleString('vi-VN')} đ` : undefined}
              />
            );
          })}
        </View>

        {/* Tổng tiền */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Tổng thanh toán</Text>
          <Text style={styles.totalValue}>{total.toLocaleString('vi-VN')} đ</Text>
        </View>

        {/* Phương thức */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { marginBottom: 10 }]}>Phương thức thanh toán</Text>
          <View style={{ gap: 8 }}>
            {METHODS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => setMethod(m.key)}
                style={[
                  styles.methodRow,
                  method === m.key && { borderColor: appleBlue, backgroundColor: '#F0F7FF' },
                ]}
              >
                <Icon name={m.icon} size={18} color={method === m.key ? appleBlue : zincColors[600]} />
                <Text style={[styles.methodText, method === m.key && { color: appleBlue }]}>{m.label}</Text>
                {method === m.key && <Icon name="checkmark.circle.fill" size={18} color={appleBlue} />}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tiền khách đưa (chỉ hiện khi tiền mặt) */}
        {method === 'CASH' && (
          <View style={styles.card}>
            <Text style={styles.smallLabel}>Khách đưa (VND)</Text>
            <TextInput
              value={given}
              onChangeText={(t) => setGiven(t.replace(/[^\d.]/g, ''))}
              keyboardType="decimal-pad"
              placeholder="0"
              style={styles.input}
            />
            <View style={styles.changeRow}>
              <Text style={{ color: zincColors[600], fontWeight: '700' }}>Tiền thừa</Text>
              <Text style={{ fontWeight: '800', color: THEME.text }}>
                {change.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>
        )}

        {/* Ghi chú */}
        <View style={styles.card}>
          <Text style={styles.smallLabel}>Ghi chú</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ví dụ: khách chuyển khoản lúc 14:35"
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            multiline
          />
        </View>

        {/* QR */}
        {method === 'QR' && (
          <View style={[styles.card, { alignItems: 'flex-start', gap: 10 }]}>
            <Pressable onPress={handleCreateQR} style={[styles.qrBtn, qrLoading && { opacity: 0.6 }]} disabled={qrLoading}>
              {qrLoading ? <ActivityIndicator /> : (
                <>
                  <Icon name="qrcode" size={18} color={appleBlue} />
                  <Text style={{ color: appleBlue, fontWeight: '800' }}>Tạo mã QR</Text>
                </>
              )}
            </Pressable>
            {qrData?.url ? (
              <Text style={{ color: zincColors[600] }}>Link thanh toán: {qrData.url}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Pressable
          onPress={handleMarkPaid}
          style={[styles.primaryBtn, (paying) && { opacity: 0.6 }]}
          disabled={paying}
        >
          {paying ? <ActivityIndicator color="#fff" /> : (
            <>
              <Icon name="checkmark.circle" size={18} color="#fff" />
              <Text style={styles.primaryText}>Xác nhận đã thanh toán</Text>
            </>
          )}
        </Pressable>
      </View>

      {/* QR Modal */}
      <Modal visible={qrOpen} transparent animationType="fade" onRequestClose={() => setQrOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Quét để thanh toán</Text>
            {qrData?.image ? (
              <Image source={{ uri: qrData.image }} style={{ width: 240, height: 240, alignSelf: 'center' }} />
            ) : (
              <Text style={{ color: zincColors[600], marginVertical: 20 }}>Không có ảnh QR.</Text>
            )}
            {qrData?.url ? (
              <Text style={{ color: zincColors[600], marginTop: 10 }}>
                Hoặc mở link: {qrData.url}
              </Text>
            ) : null}
            <Pressable onPress={() => setQrOpen(false)} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>Đóng</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value ?? '-'}</Text>
    </View>
  );
}

function LineItemRow({ name, right, sub }) {
  return (
    <View style={styles.lineItem}>
      <View style={{ flex: 1 }}>
        <Text style={styles.lineName}>{name}</Text>
        {!!sub && <Text style={styles.lineSub}>{sub}</Text>}
      </View>
      <Text style={styles.lineRight}>{right}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },

  header: {
    paddingTop: 16, paddingHorizontal: 16, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor, backgroundColor: '#fff',
  },
  backBtn: { padding: 6, marginRight: 2, borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.text },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: THEME.text },

  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor,
  },
  rowLabel: { flex: 1, color: zincColors[600], fontWeight: '700' },
  rowValue: { flex: 1.2, textAlign: 'right', color: THEME.text, fontWeight: '800' },

  totalCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: StyleSheet.hairlineWidth, borderColor: borderColor, marginBottom: 14,
  },
  totalLabel: { color: zincColors[600], fontWeight: '700', fontSize: 14 },
  totalValue: { marginTop: 6, fontSize: 22, fontWeight: '900', color: THEME.text },

  input: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', color: THEME.text,
  },
  smallLabel: { fontSize: 12, fontWeight: '700', color: zincColors[700], marginBottom: 6 },

  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  methodText: { flex: 1, color: THEME.text, fontWeight: '700' },

  lineItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingVertical: 10 },
  lineName: { fontWeight: '700', color: THEME.text },
  lineSub: { marginTop: 2, color: zincColors[500], fontSize: 12 },
  lineRight: { fontWeight: '800', color: THEME.text },

  changeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },

  actionBar: {
    padding: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB', backgroundColor: '#fff',
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: appleGreen, paddingVertical: 14, borderRadius: 12,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // QR modal
  qrBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: appleBlue, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
  },
  modalWrap: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  modalCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: THEME.text, textAlign: 'center', marginBottom: 12 },
  closeBtn: {
    marginTop: 16, alignSelf: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: borderColor,
  },
  closeTxt: { fontWeight: '800', color: THEME.text },
});
