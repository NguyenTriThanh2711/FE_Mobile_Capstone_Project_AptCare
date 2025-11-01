import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';
import { Icon } from '@/src/components/Icon.native';
import { Colors, zincColors, appleBlue, borderColor } from '@/src/utils/colors';
import http from '@/src/services/http';

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };

const INVOICE_ENDPOINT = '/api/invoices';

const schema = yup.object({
  repairRequestId: yup
    .number()
    .typeError('Id yêu cầu phải là số')
    .required('Thiếu repairRequestId'),
  isChargeable: yup.boolean().required(),
  accessories: yup
    .array()
    .of(
      yup.object({
        accessoryId: yup
          .number()
          .typeError('accessoryId phải là số')
          .required('Nhập accessoryId'),
        quantity: yup
          .number()
          .typeError('quantity phải là số')
          .min(1, 'Tối thiểu 1')
          .required('Nhập quantity'),
      })
    )
    .default([]),
  services: yup
    .array()
    .of(
      yup.object({
        name: yup.string().trim().required('Nhập tên dịch vụ'),
        price: yup
          .number()
          .typeError('price phải là số')
          .min(0, 'Không âm')
          .required('Nhập giá'),
      })
    )
    .default([]),
});

export default function CreateInvoiceScreen() {
  const { repairRequestId } = useLocalSearchParams();

  const defaultRRId = useMemo(() => {
    const n = Number(repairRequestId);
    return Number.isFinite(n) ? n : '';
  }, [repairRequestId]);
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      repairRequestId: defaultRRId,
      isChargeable: true,
      accessories: [],
      services: [],
    },
  });
  const isChargeable = watch('isChargeable');

  const onToggleChargeable = (val) => {
    setValue('isChargeable', val, { shouldValidate: true, shouldDirty: true });
    if (!val) {
      // tuỳ ý: clear hoặc giữ lại
      setValue('accessories', []);
      setValue('services', []);
    }
  };
  const {
    fields: accFields,
    append: accAppend,
    remove: accRemove,
  } = useFieldArray({ control, name: 'accessories' });

  const {
    fields: svcFields,
    append: svcAppend,
    remove: svcRemove,
  } = useFieldArray({ control, name: 'services' });

  const services = watch('services');
  // Tổng nháp: chỉ cộng dịch vụ (nếu chưa có unit price của accessories)
  const servicesTotal = (services || []).reduce((sum, s) => sum + (Number(s?.price) || 0), 0);

  const onSubmit = async (values) => {
    try {
      const payload = {
        repairRequestId: Number(values.repairRequestId),
        isChargeable: !!values.isChargeable,
        accessories: (values.accessories || []).map((a) => ({
          accessoryId: Number(a.accessoryId),
          quantity: Number(a.quantity),
        })),
        services: (values.services || []).map((s) => ({
          name: String(s.name).trim(),
          price: Number(s.price),
        })),
      };

      // call API
      await http.post(INVOICE_ENDPOINT, payload);

      Toast.show({ type: 'success', text1: 'Đã tạo hóa đơn' });
      router.back();
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Tạo hóa đơn thất bại';
      Toast.show({ type: 'error', text1: msg });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: THEME.background, paddingTop: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Icon name="creditcard" size={20} color={appleBlue} />
        <Text style={styles.headerTitle}>Tạo hóa đơn</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        {/* repairRequestId */}
        <Controller
          control={control}
          name="repairRequestId"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>ID yêu cầu</Text>
              <TextInput
                value={String(repairRequestId ?? repairRequestId)}
                onBlur={onBlur}
                disabled={true}
                onChangeText={(t) => onChange(t.replace(/\D+/g, ''))}
                keyboardType="numeric"
                placeholder="Nhập repairRequestId"
                style={styles.input}
              />
              {!!errors.repairRequestId?.message && (
                <Text style={styles.err}>{errors.repairRequestId.message}</Text>
              )}
            </View>
          )}
        />

        {/* isChargeable */}
        <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <Text style={{ fontWeight:'700', fontSize:16 }}>Tính phí (isChargeable)</Text>
          <Controller
            control={control}
            name="isChargeable"
            render={({ field: { value }}) => (
            <Switch value={!!value} onValueChange={onToggleChargeable} />
            )}
          />
        </View>

        {/* Accessories Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="wrench" size={18} color={appleBlue} />
            <Text style={styles.cardTitle}>Phụ kiện (Accessories)</Text>
            <Pressable
              onPress={() => accAppend({ accessoryId: '', quantity: 1 })}
              style={styles.addBtn}
            >
              <Icon name="plus.circle" size={18} color={appleBlue} />
              <Text style={styles.addTxt}>Thêm dòng</Text>
            </Pressable>
          </View>

          {accFields.length === 0 ? (
            <Text style={{ color: zincColors[500] }}>Chưa có dòng nào.</Text>
          ) : null}

          {accFields.map((row, idx) => (
            <View key={row.id} style={[styles.rowBlock]}>
              {/* accessoryId */}
              <Controller
                control={control}
                disabled={isSubmitting && isChargeable}
                name={`accessories.${idx}.accessoryId`}
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>Accessory ID</Text>
                    <TextInput
                      value={String(value ?? '')}
                      onBlur={onBlur}
                      onChangeText={(t) => onChange(t.replace(/\D+/g, ''))}
                      keyboardType="numeric"
                      placeholder="ID"
                      style={styles.input}
                    />
                    {!!errors?.accessories?.[idx]?.accessoryId?.message && (
                      <Text style={styles.err}>{errors.accessories[idx].accessoryId.message}</Text>
                    )}
                  </View>
                )}
              />

              {/* quantity */}
              <Controller
                control={control}
                name={`accessories.${idx}.quantity`}
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={{ width: 110 }}>
                    <Text style={styles.smallLabel}>Số lượng</Text>
                    <TextInput
                      value={String(value ?? '')}
                      onBlur={onBlur}
                      onChangeText={(t) => onChange(t.replace(/\D+/g, ''))}
                      keyboardType="numeric"
                      placeholder="1"
                      style={styles.input}
                    />
                    {!!errors?.accessories?.[idx]?.quantity?.message && (
                      <Text style={styles.err}>{errors.accessories[idx].quantity.message}</Text>
                    )}
                  </View>
                )}
              />

              <Pressable onPress={() => accRemove(idx)} style={styles.delBtn}>
                <Icon name="trash" size={18} color="#B91C1C" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Services Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="hammer" size={18} color={appleBlue} />
            <Text style={styles.cardTitle}>Dịch vụ (Services)</Text>
            <Pressable
              onPress={() => svcAppend({ name: '', price: '' })}
              style={styles.addBtn}
            >
              <Icon name="plus.circle" size={18} color={appleBlue} />
              <Text style={styles.addTxt}>Thêm dòng</Text>
            </Pressable>
          </View>

          {svcFields.length === 0 ? (
            <Text style={{ color: zincColors[500] }}>Chưa có dòng nào.</Text>
          ) : null}

          {svcFields.map((row, idx) => (
            <View key={row.id} style={[styles.rowBlock]}>
              {/* name */}
              <Controller
                control={control}
                name={`services.${idx}.name`}
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={{ flex: 1.2 }}>
                    <Text style={styles.smallLabel}>Tên dịch vụ</Text>
                    <TextInput
                      value={value}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      placeholder="VD: Sửa khóa cửa"
                      style={styles.input}
                    />
                    {!!errors?.services?.[idx]?.name?.message && (
                      <Text style={styles.err}>{errors.services[idx].name.message}</Text>
                    )}
                  </View>
                )}
              />

              {/* price */}
              <Controller
                control={control}
                name={`services.${idx}.price`}
                render={({ field: { value, onChange, onBlur } }) => (
                  <View style={{ width: 140 }}>
                    <Text style={styles.smallLabel}>Giá</Text>
                    <TextInput
                      value={String(value ?? '')}
                      onBlur={onBlur}
                      onChangeText={(t) => onChange(t.replace(/[^\d.]/g, ''))}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      style={styles.input}
                    />
                    {!!errors?.services?.[idx]?.price?.message && (
                      <Text style={styles.err}>{errors.services[idx].price.message}</Text>
                    )}
                  </View>
                )}
              />

              <Pressable onPress={() => svcRemove(idx)} style={styles.delBtn}>
                <Icon name="trash" size={18} color="#B91C1C" />
              </Pressable>
            </View>
          ))}
        </View>

        {/* Tổng nháp */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Tổng dịch vụ (nháp)</Text>
          <Text style={styles.totalValue}>
            {servicesTotal.toLocaleString('vi-VN')} đ
          </Text>
        </View>
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Pressable
          onPress={handleSubmit(onSubmit)}
          style={[styles.primaryBtn, isSubmitting && { opacity: 0.6 }]}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="checkmark.circle" size={18} color="#fff" />
              <Text style={styles.primaryText}>Tạo hóa đơn</Text>
            </>
          )}
        </Pressable>
      </View>
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

  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '700', color: THEME.text, marginBottom: 6 },
  smallLabel: { fontSize: 12, fontWeight: '700', color: zincColors[700], marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: THEME.text,
  },
  err: { color: '#B91C1C', fontSize: 12, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, flex: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appleBlue,
  },
  addTxt: { color: appleBlue, fontWeight: '700' },

  rowBlock: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 10 },
  delBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F87171',
    backgroundColor: '#FEF2F2',
  },

  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
  },
  totalLabel: { color: zincColors[600], fontWeight: '700', fontSize: 14 },
  totalValue: { marginTop: 6, fontSize: 18, fontWeight: '800', color: THEME.text },

  actionBar: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0A66C2',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.2 },
});
