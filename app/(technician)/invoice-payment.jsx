// app/(technician)/invoice-payment.jsx (CreateInvoiceScreen)
import React, { useMemo, useEffect, useState } from 'react';
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
import { dotnetArr } from '@/src/helper/dotnetArr';

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };

const INVOICE_ENDPOINT = '/api/invoices/internal';
const ACCESSORY_LIST_ENDPOINT = '/api/accessorys/list';

const toNumber = () =>
  yup
    .number()
    .transform((value, originalValue) => {
      if (typeof originalValue === 'string') {
        const v = originalValue.replace(/[^\d.-]/g, '');
        return v === '' || isNaN(Number(v)) ? undefined : Number(v);
      }
      return isNaN(value) ? undefined : value;
    });

const intPos = () =>
  toNumber().integer('Phải là số nguyên').positive('Phải > 0');

const schema = yup
  .object({
    repairRequestId: intPos()
      .typeError('Id yêu cầu phải là số')
      .required('Thiếu repairRequestId'),

    isChargeable: yup
      .boolean()
      .required('Thiếu thông tin có tính phí hay không'),

    accessories: yup
      .array()
      .of(
        yup.object({
          accessoryId: intPos()
            .typeError('accessoryId phải là số')
            .required('Nhập accessoryId'),
          quantity: intPos()
            .min(1, 'Tối thiểu 1')
            .typeError('quantity phải là số')
            .required('Nhập quantity'),
        })
      )
      .default([]),

    services: yup
      .array()
      .of(
        yup.object({
          name: yup.string().trim().required('Nhập tên dịch vụ'),
          price: toNumber()
            .typeError('price phải là số')
            .min(0, 'Không âm'),
        })
      )
      .default([]),
  })
  .test(
    'chargeable-has-something',
    'Khi tính phí, cần thêm ít nhất 1 dòng nguyên vật liệu hoặc dịch vụ',
    (values) => {
      if (!values) return false;
      if (!values.isChargeable) return true; // không tính phí thì không bắt buộc

      const hasAcc =
        Array.isArray(values.accessories) && values.accessories.length > 0;
      const hasSvc =
        Array.isArray(values.services) && values.services.length > 0;
      return hasAcc || hasSvc;
    }
  );

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
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      repairRequestId: defaultRRId,
      isChargeable: true, // mặc định có tính phí, KTV có thể tắt nếu toà nhà chịu
      accessories: [],
      services: [],
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
    criteriaMode: 'firstError',
  });

  const services = watch('services');
  const accessoriesForm = watch('accessories');
  const isChargeable = watch('isChargeable');

  // ====== STATE: danh sách phụ kiện từ API ======
  const [accessoriesMaster, setAccessoriesMaster] = useState([]);
  const [accLoading, setAccLoading] = useState(true);
  const [accError, setAccError] = useState(null);

  const [accSearch, setAccSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setAccLoading(true);
        const res = await http.get(ACCESSORY_LIST_ENDPOINT);
        const list = dotnetArr(res?.data); // unwrap $values
        if (!mounted) return;
        setAccessoriesMaster(
          (list || []).filter((x) => x.status === 'Active' || !x.status)
        );
        setAccError(null);
      } catch (e) {
        if (!mounted) return;
        setAccError(
          e?.response?.data?.detail || e?.message || 'Lỗi tải phụ kiện'
        );
      } finally {
        if (mounted) setAccLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const onInvalid = (formErrors) => {
    const formLevelError = formErrors?.['']?.message || formErrors?.root?.message;
    const first =
      formLevelError ||
      formErrors?.repairRequestId?.message ||
      formErrors?.isChargeable?.message ||
      formErrors?.accessories?.[0]?.accessoryId?.message ||
      formErrors?.accessories?.[0]?.quantity?.message ||
      formErrors?.services?.[0]?.name?.message ||
      formErrors?.services?.[0]?.price?.message ||
      'Vui lòng kiểm tra lại các trường bắt buộc';

    Toast.show({ type: 'error', text1: first });
  };

  const filteredAccessories = useMemo(() => {
    const keyword = accSearch.trim().toLowerCase();
    if (!keyword) return [];
    return accessoriesMaster.filter((a) =>
      String(a.name || '').toLowerCase().includes(keyword)
    );
  }, [accSearch, accessoriesMaster]);

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

  // Tổng dịch vụ
  const servicesTotal = (services || []).reduce(
    (sum, s) => sum + (Number(s?.price) || 0),
    0
  );

  // Tổng phụ kiện (dựa vào price trong accessoriesMaster * quantity)
  const accessoriesTotal = (accessoriesForm || []).reduce((sum, row) => {
    const currentId = row?.accessoryId;
    const found = accessoriesMaster.find(
      (a) => String(a.accessoryId) === String(currentId)
    );
    const price = Number(found?.price || 0);
    const qty = Number(row?.quantity || 0);
    return sum + price * qty;
  }, 0);

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
        <View style={styles.field}>
          <Text style={styles.label}>ID yêu cầu :</Text>
          <Text style={styles.value}>{repairRequestId}</Text>
        </View>

        {/* isChargeable */}
        <View style={[styles.card, { marginBottom: 14 }]}>
          <View style={styles.chargeRow}>
            <Text style={styles.chargeLabel}>Tính phí cho cư dân</Text>
            <Controller
              control={control}
              name="isChargeable"
              render={({ field: { value, onChange } }) => (
                <Switch
                  value={!!value}
                  onValueChange={onChange}
                />
              )}
            />
          </View>
          <Text style={styles.chargeHint}>
            • Bật ON nếu cư dân chịu chi phí.{'\n'}
            • Tắt OFF nếu toà nhà chịu chi phí (cư dân không bị tính tiền).
          </Text>
        </View>

        {/* Accessories Section */}
        <View style={styles.card}>
          <View className="cardHeader" style={styles.cardHeader}>
            <Icon name="wrench" size={18} color={appleBlue} />
            <Text style={styles.cardTitle}>Nguyên vật liệu</Text>
          </View>

          {/* Tìm kiếm nguyên vật liệu */}
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.smallLabel}>Tìm nguyên vật liệu theo tên</Text>
            <TextInput
              value={accSearch}
              onChangeText={setAccSearch}
              placeholder="Nhập tên nguyên vật liệu..."
              style={styles.input}
            />
            {accLoading && (
              <Text style={{ fontSize: 12, color: zincColors[500], marginTop: 4 }}>
                Đang tải danh sách nguyên vật liệu...
              </Text>
            )}
            {accError && (
              <Text style={{ fontSize: 12, color: '#B91C1C', marginTop: 4 }}>
                {String(accError)}
              </Text>
            )}

            {accSearch.length > 0 && filteredAccessories.length > 0 && (
              <View style={styles.suggestionBox}>
                {filteredAccessories.slice(0, 5).map((acc) => (
                  <Pressable
                    key={acc.accessoryId}
                    style={styles.suggestionItem}
                    onPress={() => {
                      accAppend({
                        accessoryId: String(acc.accessoryId),
                        quantity: 1,
                      });
                      setAccSearch('');
                    }}
                  >
                    <Text style={styles.suggestionName}>{acc.name}</Text>
                    <Text style={styles.suggestionMeta}>
                      #{acc.accessoryId} ·{' '}
                      {Number(acc.price || 0).toLocaleString('vi-VN')} đ · tồn{' '}
                      {acc.quantity}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {accFields.length === 0 ? (
            <Text style={{ color: zincColors[500] }}>
              Chưa có dòng nguyên vật liệu nào.
            </Text>
          ) : null}

          {accFields.map((row, idx) => {
            const formRow = accessoriesForm?.[idx];
            const currentAccessoryId = formRow?.accessoryId;
            const matchedAcc = accessoriesMaster.find(
              (a) => String(a.accessoryId) === String(currentAccessoryId)
            );

            return (
              <View key={row.id} style={[styles.rowBlock]}>
                {matchedAcc && (
                  <View style={styles.accInfoLine}>
                    <Text style={styles.accName}>{matchedAcc.name}</Text>
                    <Text style={styles.accMeta}>
                      #{matchedAcc.accessoryId} ·{' '}
                      {Number(matchedAcc.price || 0).toLocaleString('vi-VN')} đ · tồn{' '}
                      {matchedAcc.quantity}
                    </Text>
                  </View>
                )}

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
                        <Text style={styles.err}>
                          {errors.accessories[idx].quantity.message}
                        </Text>
                      )}
                    </View>
                  )}
                />

                <Pressable onPress={() => accRemove(idx)} style={styles.delBtn}>
                  <Icon name="trash" size={18} color="#B91C1C" />
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Services Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="hammer" size={18} color={appleBlue} />
            <Text style={styles.cardTitle}>Dịch vụ</Text>
            <Pressable
              onPress={() => svcAppend({ name: '', price: '' })}
              style={styles.addBtn}
            >
              <Icon name="plus.circle" size={18} color={appleBlue} />
              <Text style={styles.addTxt}>Thêm dòng</Text>
            </Pressable>
          </View>

          {svcFields.length === 0 ? (
            <Text style={{ color: zincColors[500] }}>
              Chưa có dòng dịch vụ nào.
            </Text>
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
                      <Text style={styles.err}>
                        {errors.services[idx].name.message}
                      </Text>
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
                      onChangeText={(t) =>
                        onChange(t.replace(/[^\d.]/g, ''))
                      }
                      keyboardType="decimal-pad"
                      placeholder="0"
                      style={styles.input}
                    />
                    {!!errors?.services?.[idx]?.price?.message && (
                      <Text style={styles.err}>
                        {errors.services[idx].price.message}
                      </Text>
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

        {/* Tổng tiền */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Tổng tiền nguyên vật liệu (nháp)</Text>
          <Text style={styles.totalValue}>
            {accessoriesTotal.toLocaleString('vi-VN')} đ
          </Text>

          <View style={{ height: 8 }} />

          <Text style={styles.totalLabel}>Tổng tiền dịch vụ (nháp)</Text>
          <Text style={styles.totalValue}>
            {servicesTotal.toLocaleString('vi-VN')} đ
          </Text>

          <View
            style={{
              marginTop: 10,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: borderColor,
              paddingTop: 8,
            }}
          >
            <Text style={styles.totalLabel}>Tổng tiền tạm tính</Text>
            <Text style={styles.totalValue}>
              {(accessoriesTotal + servicesTotal).toLocaleString('vi-VN')} đ
            </Text>
          </View>

          <View style={{ marginTop: 8 }}>
            <Text style={styles.smallLabel}>
              Ghi chú: Cư dân tính phí = {isChargeable ? 'Đúng (cư dân trả)' : 'Sai (toà nhà trả)'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Pressable
          onPress={handleSubmit(onSubmit, onInvalid)}
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

  field: { marginBottom: 14, marginLeft: 8, flexDirection: 'row', gap: 8 },
  label: { fontSize: 14, fontWeight: '700', color: THEME.text, marginBottom: 6 },
  value: { fontSize: 14, color: THEME.text, fontWeight: '600' },

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

  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  chargeLabel: { fontSize: 14, color: THEME.text, fontWeight: '600' },
  chargeHint: { fontSize: 12, color: zincColors[600], marginTop: 8 },

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

  accInfoLine: { marginBottom: 4, flex: 1 },
  accName: { fontSize: 13, fontWeight: '700', color: THEME.text },
  accMeta: { fontSize: 11, color: zincColors[600] },

  suggestionBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFF',
    maxHeight: 200,
  },
  suggestionItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  suggestionName: { fontSize: 13, fontWeight: '700', color: THEME.text },
  suggestionMeta: { fontSize: 11, color: zincColors[600], marginTop: 2 },

  totalCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
  },
  totalLabel: { color: zincColors[600], fontWeight: '700', fontSize: 14 },
  totalValue: { marginTop: 4, fontSize: 18, fontWeight: '800', color: THEME.text },

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
