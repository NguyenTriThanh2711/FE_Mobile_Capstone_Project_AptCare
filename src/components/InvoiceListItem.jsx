import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Icon } from '@/src/components/Icon.native';
import { Colors, zincColors, appleBlue } from '@/src/utils/colors';
import { timeDayDate } from '@/src/utils/date';
import Badge from './Badge';

const THEME = Colors.light ?? { text: '#0F172A', background: '#fff' };

export default function InvoiceListItem({ index, invoice, onPress }) {
  if (!invoice) return null;

  const amount = invoice.totalAmount ?? 0;
  const createdAt = invoice.createdAt ? timeDayDate(invoice.createdAt) : '-';
  const typeLabel = invoice.type || '-';
  const chargeLabel = invoice.isChargeable ? 'Có tính phí' : 'Không tính phí';

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Icon name="doc.text" size={18} color={appleBlue} />
          <Text style={styles.title}>Hóa đơn {index}</Text>
          {invoice.status && (
            <Badge style={styles.statusText} status={invoice.status} />
          )}
        </View>

        <Text style={styles.meta}>
          Mã: <Text style={styles.metaStrong}>#{invoice.invoiceId}</Text>
        </Text>
        <Text style={styles.meta}>
          Ngày tạo: <Text style={styles.metaStrong}>{createdAt}</Text>
        </Text>
        <Text style={styles.meta}>
          Loại hóa đơn: <Text style={styles.metaStrong}>{(typeLabel==='ExternalContractor') ? 'Bên thứ ba' : (typeLabel ==='InternalRepair') ? 'Sửa chữa nội bộ' : typeLabel === 'AccessoryPurchase' ? 'Mua vật liệu' : typeLabel}</Text> • {chargeLabel}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{amount.toLocaleString('vi-VN')} đ</Text>
        {/* <Icon name="chevron.right" size={18} color={appleBlue} /> */}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: zincColors[100],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  left: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  title: { fontSize: 15, fontWeight: '700', color: THEME.text },
  statusText: { fontSize: 11, fontWeight: '600', color: appleBlue },
  meta: { fontSize: 12, color: zincColors[600], marginTop: 1 },
  metaStrong: { fontWeight: '700', color: THEME.text },
  right: { alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  amount: { fontSize: 16, fontWeight: '800', color: appleBlue },
});
