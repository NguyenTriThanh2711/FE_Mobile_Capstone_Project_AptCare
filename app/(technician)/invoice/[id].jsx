import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import { Colors, zincColors, appleBlue, borderColor } from '@/src/utils/colors';
import { timeDayDate } from '@/src/utils/date';

const THEME = Colors.light ?? { text: '#0F172A', background: '#fff' };

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const invoiceId = Number(id);

  const invoice = useAppSelector((s) => s.invoices?.byId?.[invoiceId]);

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
        <Text style={styles.headerTitle}>Chi tiết hóa đơn</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {!invoice ? (
          <Text style={{ color: zincColors[600] }}>
            Không tìm thấy dữ liệu hóa đơn. Vui lòng mở từ màn danh sách.
          </Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.title}>Hóa đơn #{invoice.invoiceId}</Text>
              <Text style={styles.meta}>
                Yêu cầu sửa chữa: {invoice.repairRequestId}
              </Text>
              <Text style={styles.meta}>
                Ngày tạo: {invoice.createdAt ? timeDayDate(invoice.createdAt) : '-'}
              </Text>
              <Text style={styles.meta}>
                Loại: {invoice.type || '-'}
              </Text>
              <Text style={styles.meta}>
                Tính phí: {invoice.isChargeable ? 'Có tính phí' : 'Không tính phí'}
              </Text>
              <Text style={styles.total}>
                Tổng tiền: {(invoice.totalAmount ?? 0).toLocaleString('vi-VN')} đ
              </Text>
            </View>

            {/* Accessories */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Phụ kiện</Text>
              {(!invoice.accessories || invoice.accessories.length === 0) ? (
                <Text style={styles.emptyText}>Không có phụ kiện.</Text>
              ) : (
                invoice.accessories.map((a) => (
                  <View key={a.invoiceAccessoryId} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{a.name}</Text>
                      <Text style={styles.rowMeta}>
                        Mã phụ kiện: {a.accessoryId} • SL: {a.quantity}
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
              {(!invoice.services || invoice.services.length === 0) ? (
                <Text style={styles.emptyText}>Không có dịch vụ.</Text>
              ) : (
                invoice.services.map((s) => (
                  <View key={s.invoiceServiceId} style={styles.row}>
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.text },
  content: { padding: 16, paddingBottom: 24, gap: 16 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
  },
  title: { fontSize: 18, fontWeight: '800', color: THEME.text, marginBottom: 8 },
  meta: { fontSize: 13, color: zincColors[600], marginTop: 2 },
  total: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: appleBlue,
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
});
