import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';

import { Icon } from '@/src/components/Icon.native';
import MUITextField from '@/src/components/common/MUITextField';
import ChipRadioGroup from '@/src/components/ChipRadioGroup';
import { Colors, zincColors, appleBlue, borderColor } from '@/src/utils/colors';
import { compressMany } from '@/src/utils/imageCompression';
import ImagePickerStrip from '@/src/components/ImagePickerStrip';
import { generateInspectionReport } from '@/src/features/inspectionReport/inspectionRPSlice';
import { useAppDispatch } from '@/src/store';
import http from '@/src/services/http';
import { dotnetArr } from '@/src/helper/dotnetArr';
import {
  createInternalInvoice,
  createExternalInvoice,
} from '@/src/features/invoices/invoiceSlice';
import { fetchAppointmentById } from '@/src/features/appointments/appointmentsSlice';

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };

const INVOICE_ENDPOINT = '/api/invoices/internal';
const ACCESSORY_LIST_ENDPOINT = '/api/accessorys/list';

// ===== Enums  =====
const FaultOwner = {
  BuildingFault: 'BuildingFault',
  ResidentFault: 'ResidentFault',
};
const SolutionType = {
  Repair: 'Repair',
  Replacement: 'Replacement',
  Outsource: 'Outsource',
};

const FAULT_OWNER_OPTIONS = [
  { label: 'Lỗi tòa nhà', value: FaultOwner.BuildingFault },
  { label: 'Lỗi cư dân', value: FaultOwner.ResidentFault },
];
const SOLUTION_TYPE_OPTIONS = [
  { label: 'Sửa chữa', value: SolutionType.Repair },
  { label: 'Thay thế', value: SolutionType.Replacement },
  { label: 'Thuê ngoài', value: SolutionType.Outsource },
];

const schema = yup.object({
  appointmentId: yup
    .number()
    .typeError('AppointmentId phải là số')
    .required('Bắt buộc'),
  faultOwner: yup
    .string()
    .oneOf(Object.values(FaultOwner), 'Chọn người chịu lỗi')
    .required('Bắt buộc'),
  solutionType: yup
    .string()
    .oneOf(Object.values(SolutionType), 'Chọn giải pháp')
    .required('Bắt buộc'),
  description: yup
    .string()
    .trim()
    .required('Vui lòng nhập mô tả hiện trạng')
    .max(2000, 'Tối đa 2000 ký tự')
    .default(''),
  solution: yup
    .string()
    .trim()
    .required('Vui lòng nhập phương án xử lý')
    .min(10, ({ min }) => `Phương án xử lý tối thiểu ${min} ký tự`)
    .max(2000, 'Tối đa 2000 ký tự')
    .default(''),
});

export default function CreateInspectionReportScreen() {
  const dispatch = useAppDispatch();
  const [images, setImages] = useState([]);
  const { appointmentId, repairRequestId, isSecondOrLater } =
    useLocalSearchParams();

  const defaultAppointmentId = useMemo(() => {
    const n = Number(appointmentId);
    return Number.isFinite(n) ? n : '';
  }, [appointmentId]);

  const rrIdNum = useMemo(() => {
    const n = Number(repairRequestId);
    return Number.isFinite(n) ? n : 0;
  }, [repairRequestId]);

  const isSecondOrLaterBool = useMemo(
    () => String(isSecondOrLater) === 'true',
    [isSecondOrLater]
  );

  const [withInvoice, setWithInvoice] = useState(false);
  const [isChargeable, setIsChargeable] = useState(true);

  // master accessories cho invoice internal
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
        const list = dotnetArr(res?.data);
        if (!mounted) return;
        setAccessoriesMaster(
          (list || []).filter(
            (x) => x.status === 'Active' || !x.status
          )
        );
        setAccError(null);
      } catch (e) {
        if (!mounted) return;
        setAccError(
          e?.response?.data?.detail ||
            e?.message ||
            'Lỗi tải nguyên vật liệu'
        );
      } finally {
        if (mounted) setAccLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      appointmentId: defaultAppointmentId,
      faultOwner: FaultOwner.BuildingFault,
      solutionType: SolutionType.Repair,
      description: '',
      solution: '',
      accessories: [],
      services: [],
      extAccessories: [],
      extServices: [],
    },
  });

  const solutionTypeWatch = watch('solutionType');
  const accessoriesWatch = watch('accessories') || [];
  const servicesWatch = watch('services') || [];
  const extAccessoriesWatch = watch('extAccessories') || [];
  const extServicesWatch = watch('extServices') || [];

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

  // field array cho invoice external
  const {
    fields: extAccFields,
    append: extAccAppend,
    remove: extAccRemove,
  } = useFieldArray({ control, name: 'extAccessories' });

  const {
    fields: extSvcFields,
    append: extSvcAppend,
    remove: extSvcRemove,
  } = useFieldArray({ control, name: 'extServices' });

  const isOutsource = solutionTypeWatch === SolutionType.Outsource;
  const isRepairOrReplace =
    solutionTypeWatch === SolutionType.Repair ||
    solutionTypeWatch === SolutionType.Replacement;

  // External invoice chỉ hiện khi: buổi 2 trở lên + Outsource
  const showExternalInvoice = isOutsource && isSecondOrLaterBool;

  // Nếu chọn Outsource thì tắt toggle internal invoice
  useEffect(() => {
    if (isOutsource) {
      setWithInvoice(false);
    }
  }, [isOutsource]);

  const filteredAccessories = useMemo(() => {
    const keyword = accSearch.trim().toLowerCase();
    if (!keyword) return [];
    return accessoriesMaster.filter((a) =>
      String(a.name || '').toLowerCase().includes(keyword)
    );
  }, [accSearch, accessoriesMaster]);

  const servicesTotal = (servicesWatch || []).reduce(
    (sum, s) => sum + (Number(s?.price) || 0),
    0
  );
  const accessoriesTotal = (accessoriesWatch || []).reduce((sum, row) => {
    const currentId = row?.accessoryId;
    const found = accessoriesMaster.find(
      (a) => String(a.accessoryId) === String(currentId)
    );
    const price = Number(found?.price || 0);
    const qty = Number(row?.quantity || 0);
    return sum + price * qty;
  }, 0);

  // Tổng cho invoice external
  const extAccessoriesTotal = (extAccessoriesWatch || []).reduce(
    (sum, row) =>
      sum +
      (Number(row?.quantity || 0) || 0) * (Number(row?.price || 0) || 0),
    0
  );
  const extServicesTotal = (extServicesWatch || []).reduce(
    (sum, row) => sum + (Number(row?.price || 0) || 0),
    0
  );

  const handleToggleInvoice = () => {
    if (isOutsource) return;
    setWithInvoice((prev) => !prev);
  };

  const onSubmit = async (values) => {
    try {
      // ===== 1) Validate & tạo INVOICE INTERNAL cho Repair / Replacement =====
      if (isRepairOrReplace && !withInvoice) {
        Toast.show({
          type: 'error',
          text1: 'Báo giá bắt buộc',
          text2:
            'Với trường hợp sửa chữa / thay thế, hãy bật "Chọn kèm báo giá".',
        });
        return;
      }

      if (withInvoice && !isOutsource && rrIdNum) {
        const hasAcc =
          Array.isArray(accessoriesWatch) &&
          accessoriesWatch.length > 0;
        const hasSvc =
          Array.isArray(servicesWatch) && servicesWatch.length > 0;

        if (isChargeable && !hasAcc && !hasSvc) {
          Toast.show({
            type: 'error',
            text1: 'Thiếu dữ liệu báo giá',
            text2:
              'Khi tính phí cư dân, cần ít nhất 1 dòng nguyên vật liệu hoặc dịch vụ.',
          });
          return;
        }

        const invoicePayload = {
          repairRequestId: rrIdNum,
          isChargeable: !!isChargeable,
          accessories: (accessoriesWatch || []).map((a) => ({
            accessoryId: Number(a.accessoryId),
            quantity: Number(a.quantity),
          })),
          services: (servicesWatch || []).map((s) => ({
            name: String(s.name || '').trim(),
            price: Number(s.price),
          })),
        };

        await dispatch(createInternalInvoice(invoicePayload)).unwrap();
      }

      // ===== 2) Validate & tạo INVOICE EXTERNAL cho Outsource + buổi 2 trở lên =====
      if (showExternalInvoice && rrIdNum) {
        const hasExtAcc =
          Array.isArray(extAccessoriesWatch) &&
          extAccessoriesWatch.length > 0;
        const hasExtSvc =
          Array.isArray(extServicesWatch) &&
          extServicesWatch.length > 0;

        if (isChargeable && !hasExtAcc && !hasExtSvc) {
          Toast.show({
            type: 'error',
            text1: 'Thiếu dữ liệu hóa đơn bên thứ ba',
            text2:
              'Khi tính phí cư dân, cần ít nhất 1 dòng nguyên vật liệu hoặc dịch vụ.',
          });
          return;
        }

        const externalInvoicePayload = {
          repairRequestId: rrIdNum,
          isChargeable: !!isChargeable,
          accessories: (extAccessoriesWatch || []).map((a) => ({
            name: String(a.name || '').trim(),
            quantity: Number(a.quantity) || 0,
            price: Number(a.price) || 0,
          })),
          services: (extServicesWatch || []).map((s) => ({
            name: String(s.name || '').trim(),
            price: Number(s.price) || 0,
          })),
        };

        await dispatch(
          createExternalInvoice(externalInvoicePayload)
        ).unwrap();
      }

      // ===== 3) Tạo inspection report như cũ =====
      const filesCompressed = await compressMany(images, {
        maxWidth: 1280,
        quality: 0.7,
        format: 'jpeg',
      });

      const reportPayload = {
        appointmentId: Number(values.appointmentId),
        faultOwner: String(values.faultOwner),
        solutionType: String(values.solutionType),
        description: values.description?.trim() || '',
        solution: values.solution?.trim() || '',
        Files: filesCompressed,
      };

      await dispatch(generateInspectionReport(reportPayload)).unwrap();

      let extraText;
      if (withInvoice && !isOutsource) {
        extraText = 'Báo giá nội bộ kèm cũng đã được tạo.';
      } else if (showExternalInvoice) {
        extraText = 'Hóa đơn bên thứ ba đã được tạo.';
      }

      Toast.show({
        type: 'success',
        text1: 'Đã tạo báo cáo khảo sát',
        text2: extraText,
      });
      dispatch(fetchAppointmentById(Number(appointmentId)));
      router.back();
    } catch (err) {
      console.log('[inspection + invoice error]', err);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Tạo báo cáo thất bại';
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: msg,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Icon name="doc.text" size={20} color={appleBlue} />
        <Text style={styles.headerTitle}>Báo cáo khảo sát</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Appointment Id */}
        <Controller
          control={control}
          name="appointmentId"
          render={({ field: { value, onChange, onBlur } }) => (
            <MUITextField
              label="ID Cuộc hẹn"
              placeholder="Nhập mã cuộc hẹn"
              keyboardType="numeric"
              disabled={true}
              size="small"
              value={String(value ?? '')}
              onBlur={onBlur}
              onChangeText={(txt) => onChange(txt.replace(/\D+/g, ''))}
              error={errors.appointmentId?.message}
            />
          )}
        />

        {/* Fault Owner */}
        <Controller
          control={control}
          name="faultOwner"
          render={({ field: { value, onChange } }) => (
            <ChipRadioGroup
              label="Người chịu lỗi"
              value={value}
              onChange={onChange}
              options={FAULT_OWNER_OPTIONS}
            />
          )}
        />
        {!!errors.faultOwner?.message && (
          <Text style={styles.errText}>{errors.faultOwner.message}</Text>
        )}

        {/* Solution Type */}
        <Controller
          control={control}
          name="solutionType"
          render={({ field: { value, onChange } }) => (
            <ChipRadioGroup
              label="Giải pháp đề xuất"
              value={value}
              onChange={onChange}
              options={SOLUTION_TYPE_OPTIONS}
            />
          )}
        />
        {!!errors.solutionType?.message && (
          <Text style={styles.errText}>{errors.solutionType.message}</Text>
        )}

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <MUITextField
              label="Mô tả hiện trạng"
              placeholder="Mô tả chi tiết tình trạng, vị trí, ghi chú thêm…"
              multiline
              numberOfLines={4}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.description?.message}
            />
          )}
        />
        {!!errors.description?.message && (
          <Text style={styles.errText}>{errors.description.message}</Text>
        )}

        {/* Solution */}
        <Controller
          control={control}
          name="solution"
          render={({ field: { value, onChange, onBlur } }) => (
            <MUITextField
              label="Phương án xử lý"
              placeholder="Mô tả cách xử lý/thiết bị thay thế/vật tư dự kiến…"
              multiline
              numberOfLines={4}
              value={value}
              size="large"
              style={{ marginTop: 14 }}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.solution?.message}
            />
          )}
        />
        {!!errors.solution?.message && (
          <Text style={styles.errText}>{errors.solution.message}</Text>
        )}

        <ImagePickerStrip
          style={{ marginTop: 14 }}
          mode="update"
          value={images}
          onChange={setImages}
          maxCount={10}
          title="Ảnh khảo sát"
        />

        {/* ===== BLOCK INVOICE INTERNAL – chỉ dùng cho Repair/Replacement ===== */}
        {!isOutsource && (
          <>
            <View style={styles.invoiceToggleRow}>
              <Pressable
                onPress={handleToggleInvoice}
                style={styles.invoiceToggleBtn}
              >
                <Icon
                  name={withInvoice ? 'xmark.circle' : 'plus.circle'}
                  size={18}
                  color={appleBlue}
                />
                <Text style={styles.invoiceToggleText}>
                  {withInvoice ? 'Không kèm báo giá' : 'Chọn kèm báo giá'}
                </Text>
              </Pressable>
            </View>

            {withInvoice && (
              <View style={styles.invoiceBlock}>
                <Text style={styles.invoiceTitle}>Báo giá nội bộ</Text>
                <Text style={styles.invoiceSub}>
                  Hóa đơn nội bộ sẽ được tạo trước, sau đó tạo báo cáo
                  khảo sát.
                </Text>

                <View style={styles.fieldRow}>
                  <Text style={styles.label}>ID yêu cầu:</Text>
                  <Text style={styles.value}>{rrIdNum || '-'}</Text>
                </View>

                <View style={styles.fieldRow}>
                  <Text style={styles.label}>Tính phí cho cư dân</Text>
                  <Pressable
                    onPress={() => setIsChargeable((v) => !v)}
                    style={styles.chargeableChip}
                  >
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: isChargeable
                            ? '#16A34A'
                            : '#6B7280',
                        },
                      ]}
                    />
                    <Text style={styles.chargeableText}>
                      {isChargeable
                        ? 'Có – cư dân chịu phí'
                        : 'Không – tòa nhà chịu phí'}
                    </Text>
                  </Pressable>
                </View>

                {/* Nguyên vật liệu internal */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Icon name="wrench" size={18} color={appleBlue} />
                    <Text style={styles.cardTitle}>Nguyên vật liệu</Text>
                  </View>

                  <View style={{ marginBottom: 10 }}>
                    <Text style={styles.smallLabel}>
                      Tìm nguyên vật liệu theo tên
                    </Text>
                    <TextInput
                      value={accSearch}
                      onChangeText={setAccSearch}
                      placeholder="Nhập tên nguyên vật liệu..."
                      style={styles.input}
                    />
                    {accLoading && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: zincColors[500],
                          marginTop: 4,
                        }}
                      >
                        Đang tải danh sách nguyên vật liệu...
                      </Text>
                    )}
                    {accError && (
                      <Text
                        style={{
                          fontSize: 12,
                          color: '#B91C1C',
                          marginTop: 4,
                        }}
                      >
                        {String(accError)}
                      </Text>
                    )}

                    {accSearch.length > 0 &&
                      filteredAccessories.length > 0 && (
                        <View style={styles.suggestionBox}>
                          {filteredAccessories
                            .slice(0, 5)
                            .map((acc) => (
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
                                <Text
                                  style={styles.suggestionName}
                                >
                                  {acc.name}
                                </Text>
                                <Text style={styles.suggestionMeta}>
                                  #{acc.accessoryId} ·{' '}
                                  {Number(
                                    acc.price || 0
                                  ).toLocaleString('vi-VN')}{' '}
                                  đ · tồn {acc.quantity}
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
                    const formRow = accessoriesWatch?.[idx];
                    const currentAccessoryId = formRow?.accessoryId;
                    const matchedAcc = accessoriesMaster.find(
                      (a) =>
                        String(a.accessoryId) ===
                        String(currentAccessoryId)
                    );

                    return (
                      <View key={row.id} style={styles.rowBlock}>
                        {matchedAcc && (
                          <View style={styles.accInfoLine}>
                            <Text style={styles.accName}>
                              {matchedAcc.name}
                            </Text>
                            <Text style={styles.accMeta}>
                              #{matchedAcc.accessoryId} ·{' '}
                              {Number(
                                matchedAcc.price || 0
                              ).toLocaleString('vi-VN')}{' '}
                              đ · tồn {matchedAcc.quantity}
                            </Text>
                          </View>
                        )}
                        <Controller
                          control={control}
                          name={`accessories.${idx}.quantity`}
                          render={({
                            field: { value, onChange, onBlur },
                          }) => (
                            <View style={{ width: 110 }}>
                              <Text style={styles.smallLabel}>
                                Số lượng
                              </Text>
                              <TextInput
                                value={String(value ?? '')}
                                onBlur={onBlur}
                                onChangeText={(t) =>
                                  onChange(t.replace(/\D+/g, ''))
                                }
                                keyboardType="numeric"
                                placeholder="1"
                                style={styles.input}
                              />
                            </View>
                          )}
                        />

                        <Pressable
                          onPress={() => accRemove(idx)}
                          style={styles.delBtn}
                        >
                          <Icon
                            name="trash"
                            size={18}
                            color="#B91C1C"
                          />
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                {/* Dịch vụ internal */}
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Icon
                      name="hammer"
                      size={18}
                      color={appleBlue}
                    />
                    <Text style={styles.cardTitle}>Dịch vụ</Text>
                    <Pressable
                      onPress={() =>
                        svcAppend({ name: '', price: '' })
                      }
                      style={styles.addBtn}
                    >
                      <Icon
                        name="plus.circle"
                        size={18}
                        color={appleBlue}
                      />
                      <Text style={styles.addTxt}>Thêm dòng</Text>
                    </Pressable>
                  </View>

                  {svcFields.length === 0 ? (
                    <Text style={{ color: zincColors[500] }}>
                      Chưa có dòng dịch vụ nào.
                    </Text>
                  ) : null}

                  {svcFields.map((row, idx) => (
                    <View key={row.id} style={styles.rowBlock}>
                      <Controller
                        control={control}
                        name={`services.${idx}.name`}
                        render={({
                          field: { value, onChange, onBlur },
                        }) => (
                          <View style={{ flex: 1.2 }}>
                            <Text style={styles.smallLabel}>
                              Tên dịch vụ
                            </Text>
                            <TextInput
                              value={value}
                              onBlur={onBlur}
                              onChangeText={onChange}
                              placeholder="VD: Sửa khóa cửa"
                              style={styles.input}
                            />
                          </View>
                        )}
                      />

                      <Controller
                        control={control}
                        name={`services.${idx}.price`}
                        render={({
                          field: { value, onChange, onBlur },
                        }) => (
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
                          </View>
                        )}
                      />

                      <Pressable
                        onPress={() => svcRemove(idx)}
                        style={styles.delBtn}
                      >
                        <Icon
                          name="trash"
                          size={18}
                          color="#B91C1C"
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>

                {/* Tổng nháp – internal */}
                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>
                    Tổng tiền nguyên vật liệu (nháp)
                  </Text>
                  <Text style={styles.totalValue}>
                    {accessoriesTotal.toLocaleString('vi-VN')} đ
                  </Text>

                  <View style={{ height: 8 }} />

                  <Text style={styles.totalLabel}>
                    Tổng tiền dịch vụ (nháp)
                  </Text>
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
                    <Text style={styles.totalLabel}>
                      Tổng tiền tạm tính
                    </Text>
                    <Text style={styles.totalValue}>
                      {(accessoriesTotal + servicesTotal).toLocaleString(
                        'vi-VN'
                      )}{' '}
                      đ
                    </Text>
                  </View>

                  <View style={{ marginTop: 8 }}>
                    <Text style={styles.smallLabel}>
                      {isChargeable
                        ? '(Cư dân thanh toán)'
                        : '(Tòa nhà thanh toán)'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}

        {showExternalInvoice && (
          <View style={[styles.invoiceBlock, { marginTop: 24 }]}>
            <Text style={styles.invoiceTitle}>Hóa đơn bên thứ ba</Text>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>ID yêu cầu:</Text>
              <Text style={styles.value}>{rrIdNum || '-'}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Tính phí cho cư dân</Text>
              <Pressable
                onPress={() => setIsChargeable((v) => !v)}
                style={styles.chargeableChip}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: isChargeable
                        ? '#16A34A'
                        : '#6B7280',
                    },
                  ]}
                />
                <Text style={styles.chargeableText}>
                  {isChargeable
                    ? 'Có – cư dân chịu phí'
                    : 'Không – tòa nhà chịu phí'}
                </Text>
              </Pressable>
            </View>

            {/* Nguyên vật liệu EXTERNAL – tự nhập, không gợi ý */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="wrench" size={18} color={appleBlue} />
                <Text style={styles.cardTitle}>
                  Nguyên vật liệu 
                </Text>
                <Pressable
                  onPress={() =>
                    extAccAppend({ name: '', quantity: '', price: '' })
                  }
                  style={styles.addBtn}
                >
                  <Icon
                    name="plus.circle"
                    size={18}
                    color={appleBlue}
                  />
                  <Text style={styles.addTxt}>Thêm dòng</Text>
                </Pressable>
              </View>

              {extAccFields.length === 0 ? (
                <Text style={{ color: zincColors[500] }}>
                  Chưa có dòng nguyên vật liệu nào.
                </Text>
              ) : null}

              {extAccFields.map((row, idx) => (
                <View key={row.id} style={styles.rowBlock}>
                  <Controller
                    control={control}
                    name={`extAccessories.${idx}.name`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View style={{ flex: 1.3 }}>
                        <Text style={styles.smallLabel}>
                          Tên nguyên vật liệu
                        </Text>
                        <TextInput
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="VD: Sơn tường Dulux 5L"
                          style={styles.input}
                        />
                      </View>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`extAccessories.${idx}.quantity`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View style={{ width: 45 }}>
                        <Text style={styles.smallLabel}>SL</Text>
                        <TextInput
                          value={String(value ?? '')}
                          onBlur={onBlur}
                          onChangeText={(t) =>
                            onChange(t.replace(/\D+/g, ''))
                          }
                          keyboardType="numeric"
                          placeholder="1"
                          style={styles.input}
                        />
                      </View>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`extAccessories.${idx}.price`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View style={{ width: 100 }}>
                        <Text style={styles.smallLabel}>Đơn giá</Text>
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
                      </View>
                    )}
                  />

                  <Pressable
                    onPress={() => extAccRemove(idx)}
                    style={styles.delBtn}
                  >
                    <Icon
                      name="trash"
                      size={18}
                      color="#B91C1C"
                    />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Dịch vụ EXTERNAL – tự nhập */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon
                  name="hammer"
                  size={18}
                  color={appleBlue}
                />
              <Text style={styles.cardTitle}>
                  Dịch vụ
                </Text>
                <Pressable
                  onPress={() =>
                    extSvcAppend({ name: '', price: '' })
                  }
                  style={styles.addBtn}
                >
                  <Icon
                    name="plus.circle"
                    size={18}
                    color={appleBlue}
                  />
                  <Text style={styles.addTxt}>Thêm dòng</Text>
                </Pressable>
              </View>

              {extSvcFields.length === 0 ? (
                <Text style={{ color: zincColors[500] }}>
                  Chưa có dòng dịch vụ nào.
                </Text>
              ) : null}

              {extSvcFields.map((row, idx) => (
                <View key={row.id} style={styles.rowBlock}>
                  <Controller
                    control={control}
                    name={`extServices.${idx}.name`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View style={{ flex: 1.3 }}>
                        <Text style={styles.smallLabel}>Tên dịch vụ</Text>
                        <TextInput
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          placeholder="VD: Công thợ trét lại tường"
                          style={styles.input}
                        />
                      </View>
                    )}
                  />

                  <Controller
                    control={control}
                    name={`extServices.${idx}.price`}
                    render={({ field: { value, onChange, onBlur } }) => (
                      <View style={{ width: 100 }}>
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
                      </View>
                    )}
                  />

                  <Pressable
                    onPress={() => extSvcRemove(idx)}
                    style={styles.delBtn}
                  >
                    <Icon
                      name="trash"
                      size={18}
                      color="#B91C1C"
                    />
                  </Pressable>
                </View>
              ))}
            </View>

            {/* Tổng nháp – external */}
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>
                Tổng tiền nguyên vật liệu (nháp)
              </Text>
              <Text style={styles.totalValue}>
                {extAccessoriesTotal.toLocaleString('vi-VN')} đ
              </Text>

              <View style={{ height: 8 }} />

              <Text style={styles.totalLabel}>
                Tổng tiền dịch vụ (nháp)
              </Text>
              <Text style={styles.totalValue}>
                {extServicesTotal.toLocaleString('vi-VN')} đ
              </Text>

              <View
                style={{
                  marginTop: 10,
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: borderColor,
                  paddingTop: 8,
                }}
              >
                <Text style={styles.totalLabel}>
                  Tổng tiền tạm tính
                </Text>
                <Text style={styles.totalValue}>
                  {(extAccessoriesTotal + extServicesTotal).toLocaleString(
                    'vi-VN'
                  )}{' '}
                  đ
                </Text>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.smallLabel}>
                  {isChargeable
                    ? '(Cư dân thanh toán)'
                    : '(Tòa nhà thanh toán)'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

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
              <Text style={styles.primaryText}>Tạo báo cáo</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, paddingTop: 40 },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 6, marginRight: 2, borderRadius: 999 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: THEME.text },

  content: { flex: 1, padding: 16 },

  errText: {
    color: '#B91C1C',
    fontSize: 12,
    marginTop: 0,
    marginBottom: 0,
    marginLeft: 4,
  },

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
  primaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.2,
  },

  invoiceToggleRow: {
    marginTop: 20,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  invoiceToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appleBlue,
    backgroundColor: '#EFF6FF',
    alignSelf: 'center',
  },
  invoiceToggleText: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',

    color: appleBlue,
    fontWeight: '700',
    fontSize: 13,
  },

  invoiceBlock: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: borderColor,
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
  },
  invoiceSub: {
    fontSize: 12,
    color: zincColors[600],
    marginTop: 2,
    marginBottom: 10,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
  },
  value: { fontSize: 14, color: THEME.text, fontWeight: '600' },

  chargeableChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: borderColor,
    backgroundColor: '#F9FAFB',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  chargeableText: {
    fontSize: 12,
    color: THEME.text,
    fontWeight: '600',
  },

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
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.text,
    flex: 1,
  },
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

  smallLabel: {
    paddingLeft: 7,
    fontSize: 12,
    fontWeight: '700',
    color: zincColors[700],
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: THEME.text,
  },

  rowBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 10,
  },
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

  totalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
  },
  totalLabel: { color: zincColors[600], fontWeight: '700', fontSize: 14 },
  totalValue: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: THEME.text,
  },
});
