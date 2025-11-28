import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import { Colors, zincColors, appleBlue, borderColor } from '@/src/utils/colors';
import { timeDayDate } from '@/src/utils/date';
import {
  dotnetWrapIfObject,
} from '@/src/helper/dotnetArr';
import { pretty } from '@/src/helper/prettyLog';
import Badge from '@/src/components/Badge';
import Toast from 'react-native-toast-message';
import http from '@/src/services/http';
import { fetchInvoicesByRepairRequestId } from '@/src/features/invoices/invoiceSlice';
import GradientButton from '@/src/components/common/GradientButton';

const THEME = Colors.light ?? { text: '#0F172A', background: '#fff' };

const INVOICE_STATUS_LABEL = {
  Unpaid: 'Chưa thanh toán',
  UNPAID: 'Chưa thanh toán',
  AwaitingPayment: 'Chờ thanh toán',
  AWAITINGPAYMENT: 'Chờ thanh toán',
  PartiallyPaid: 'Thanh toán một phần',
  PARTIALLYPAID: 'Thanh toán một phần',
  Paid: 'Đã thanh toán',
  PAID: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  CANCELED: 'Đã hủy',
};

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const invoiceId = Number(id);
  const dispatch = useAppDispatch();

  const data = dotnetWrapIfObject(
    useAppSelector((s) => s.invoices?.byId?.[invoiceId])
  );
  const invoice = data[0];

  console.log('[invoice]', pretty(invoice));

  const invoiceStatusUpper = String(invoice?.status || '').toUpperCase();
  const invoiceStatusLabel =
    INVOICE_STATUS_LABEL[invoice?.status] ||
    INVOICE_STATUS_LABEL[invoiceStatusUpper] ||
    invoice?.status ||
    '-';

  // unwrap accessories & services an toàn
  const accessories = useMemo(() => {
    const raw = invoice?.accessories;
    const arr = raw?.$values ?? raw ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [invoice]);

  const services = useMemo(() => {
    const raw = invoice?.services;
    const arr = raw?.$values ?? raw ?? [];
    return Array.isArray(arr) ? arr : [];
  }, [invoice]);

  const [creatingPayLink, setCreatingPayLink] = useState(false);
  const [payLink, setPayLink] = useState('');
  const [cashModalVisible, setCashModalVisible] = useState(false);
  const [cashNote, setCashNote] = useState('');
  const [cashSubmitting, setCashSubmitting] = useState(false);

  const canPay =
    !!invoice &&
    !!invoice?.isChargeable &&
    !['PAID', 'CANCELLED', 'CANCELED'].includes(invoiceStatusUpper);

  async function handleCreatePayLink() {
    if (!invoiceId || !canPay) return;
    try {
      setCreatingPayLink(true);
      // POST /api/transactions/income/payment-link/{invoiceId}
      const { data } = await http.post(
        `/api/transactions/income/payment-link/${invoiceId}`
      );
      console.log('[response payment link]', data.checkoutUrl);
      const url =
        typeof data === 'string' ? data : data?.checkoutUrl || '';

      if (!url) {
        throw new Error('Không nhận được link thanh toán');
      }

      setPayLink(url);
      Toast.show({
        type: 'success',
        text1: 'Tạo link thanh toán thành công',
      });

      if (invoice?.repairRequestId) {
        dispatch(fetchInvoicesByRepairRequestId(invoice.repairRequestId));
      }
      openPayLinkInBrowser();
    } catch (e) {
      console.log('PayOS link error', e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        'Vui lòng thử lại.';
      Toast.show({
        type: 'error',
        text1: 'Không tạo được link thanh toán',
        text2: msg,
      });
    } finally {
      setCreatingPayLink(false);
    }
  }

  function openPayLinkInBrowser() {
    if (!payLink) return;
    router.push({
      pathname: '/(technician)/payos-webview',
      params: { url: encodeURIComponent(payLink) },
    });
  }

  function openCashModal() {
    if (!canPay) return;
    setCashModalVisible(true);
  }

  function closeCashModal() {
    if (cashSubmitting) return;
    setCashModalVisible(false);
    setCashNote('');
  }

  async function handleSubmitCash() {
    if (!invoiceId || !canPay) return;
    try {
      setCashSubmitting(true);

      const form = new FormData();
      form.append('InvoiceId', String(invoiceId));
      if (cashNote?.trim()) {
        form.append('Note', cashNote.trim());
      }
      // Nếu sau này cần upload biên lai:
      // form.append('ReceiptFile', { uri, name, type });

      // POST /api/transactions/cash-income
      const { data } = await http.post(
        '/api/transactions/cash-income',
        form,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      console.log('cash-income ->', data);

      Toast.show({
        type: 'success',
        text1: 'Ghi nhận thu tiền mặt thành công',
      });

      // reload lại invoice list (cập nhật trạng thái, số tiền)
      if (invoice?.repairRequestId) {
        dispatch(fetchInvoicesByRepairRequestId(invoice.repairRequestId));
      }

      closeCashModal();
    } catch (e) {
      console.log('Cash-income error', e);
      const msg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.message ||
        'Vui lòng thử lại.';
      Toast.show({
        type: 'error',
        text1: 'Thu tiền mặt thất bại',
        text2: msg,
      });
    } finally {
      setCashSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Icon name="doc.text" size={20} color={appleBlue} />
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
          {invoice?.type ? (
            <Badge status={invoice.type} style={{ marginLeft: 6 }} />
          ) : null}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {invoice?.isChargeable === false && (<Text style={{ color: 'red', marginBottom: 8,alignSelf: 'center' }}>
          Hóa đơn này tòa nhà chi trả nên cư dân không cần thanh toán.
        </Text>)}
        {!invoice ? (
          <Text style={{ color: zincColors[600] }}>
            Không tìm thấy dữ liệu hóa đơn. Vui lòng mở từ màn danh sách.
          </Text>
        ) : (
          <>
            {/* Thông tin chung */}
            <View style={styles.card}>
              <Text style={styles.title}>
                Mã hóa đơn: {invoice.invoiceId}
              </Text>
              <Text style={styles.meta}>
                Yêu cầu sửa chữa: {invoice.repairRequestId ?? '-'}
              </Text>
              <Text style={styles.meta}>
                Ngày tạo:{' '}
                {invoice.createdAt ? timeDayDate(invoice.createdAt) : '-'}
              </Text>
              <Text style={styles.meta}>
                Trạng thái: {invoiceStatusLabel}
              </Text>
              <Text style={styles.meta}>
                Tính phí:{' '}
                {invoice?.isChargeable ? 'Có tính phí' : 'Không tính phí'}
              </Text>
              <Text style={styles.total}>
                Tổng tiền:{' '}
                {(invoice.totalAmount ?? 0).toLocaleString('vi-VN')} đ
              </Text>
              {!canPay && (
                <Text style={styles.noteText}>
                  Chỉ có thể tạo giao dịch khi hóa đơn còn nợ và chưa bị hủy /
                  chưa thanh toán đủ.
                </Text>
              )}
            </View>

            {/* QR PayOS nếu đã tạo link */}
            {payLink ? (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Link thanh toán PayOS</Text>
                <View
                  style={{
                    alignItems: 'center',
                    marginVertical: 12,
                  }}
                >
                
                </View>
                <Text style={styles.meta} numberOfLines={2}>
                  {payLink}
                </Text>
                <Pressable
                  style={[styles.secondaryBtn, { marginTop: 12 }]}
                  onPress={openPayLinkInBrowser}
                >
                  <Icon name="safari" size={18} color={appleBlue} />
                  <Text style={styles.secondaryBtnText}>
                    Mở 
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Accessories */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Nguyên vật liệu</Text>
              {accessories.length === 0 ? (
                <Text style={styles.emptyText}>Không có nguyên vật liệu.</Text>
              ) : (
                accessories.map((a) => (
                  <View
                    key={a.invoiceAccessoryId ?? `${a.accessoryId}-${a.name}`}
                    style={styles.row}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{a.name}</Text>
                      <Text style={styles.rowMeta}>
                        Mã nguyên vật liệu: {a.accessoryId} • SL:{' '}
                        {a.quantity ?? 1}
                      </Text>
                    </View>
                    <Text style={styles.rowAmount}>
                      {(a.price ?? 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Services */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Dịch vụ</Text>
              {services.length === 0 ? (
                <Text style={styles.emptyText}>Không có dịch vụ.</Text>
              ) : (
                services.map((s) => (
                  <View
                    key={s.invoiceServiceId ?? `${s.serviceId}-${s.name}`}
                    style={styles.row}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{s.name}</Text>
                    </View>
                    <Text style={styles.rowAmount}>
                      {(s.price ?? 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Action Bar: tạo link PayOS + Thu tiền mặt */}
      {invoice && (
        <View style={styles.actionBar}>
          <GradientButton
            title={
              creatingPayLink ? 'Đang tạo QR...' : 'Tạo QR thanh toán'
            }
            onPress={handleCreatePayLink}
            disabled={!canPay || creatingPayLink}
            loading={creatingPayLink}
            size="medium"
            scheme="primary"
            style={{ flex: 1.1 }}
          />

          <Pressable
            style={[
              styles.secondaryBtn,
              { flex: 1 },
              (!canPay || cashSubmitting) && { opacity: 0.5 },
            ]}
            disabled={!canPay || cashSubmitting}
            onPress={openCashModal}
          >
            <Icon
              name="banknote"
              size={18}
              color={canPay ? appleBlue : zincColors[400]}
            />
            <Text style={styles.secondaryBtnText}>Thu tiền mặt</Text>
          </Pressable>
        </View>
      )}

      {/* Modal thu tiền mặt */}
      <Modal
        visible={cashModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeCashModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Thu tiền mặt</Text>
            <Text style={styles.meta}>
              Hóa đơn #{invoiceId} – Tổng{' '}
              {(invoice?.totalAmount ?? 0).toLocaleString('vi-VN')} đ
            </Text>

            <Text style={[styles.meta, { marginTop: 12, marginBottom: 4 }]}>
              Ghi chú (tuỳ chọn)
            </Text>
            <TextInput
              style={styles.noteInput}
              value={cashNote}
              onChangeText={setCashNote}
              placeholder="Ví dụ: cư dân trả trực tiếp tại căn hộ..."
              multiline
              textAlignVertical="top"
            />

            <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
              <Pressable
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={closeCashModal}
                disabled={cashSubmitting}
              >
                <Text style={styles.secondaryBtnText}>Huỷ</Text>
              </Pressable>

              <GradientButton
                title={cashSubmitting ? 'Đang lưu...' : 'Xác nhận'}
                onPress={handleSubmitCash}
                disabled={cashSubmitting}
                loading={cashSubmitting}
                size="medium"
                scheme="primary"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, paddingTop: 30 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  backBtn: { padding: 6, borderRadius: 999 },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.text },

  content: { padding: 16, paddingBottom: 24, gap: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '800', color: THEME.text, marginBottom: 8 },
  meta: { fontSize: 13, color: zincColors[600], marginTop: 2 },
  total: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: appleBlue,
  },
  noteText: {
    marginTop: 6,
    fontSize: 12,
    color: zincColors[500],
    fontStyle: 'italic',
  },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.text, marginBottom: 8 },
  emptyText: { fontSize: 13, color: zincColors[500] },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: THEME.text },
  rowMeta: { fontSize: 12, color: zincColors[600], marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '700', color: appleBlue, marginLeft: 8 },

  actionBar: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: borderColor,
    backgroundColor: THEME.background,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: borderColor,
    gap: 8,
  },
  secondaryBtnText: { color: appleBlue, fontSize: 15, fontWeight: '700' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: borderColor,
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    fontSize: 14,
    color: THEME.text,
  },
});
