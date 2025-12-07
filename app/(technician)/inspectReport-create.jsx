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
import {
  generateInspectionReport,
  generateInspectionMaintenanceReport,
} from '@/src/features/inspectionReport/inspectionRPSlice';
import { useAppDispatch, useAppSelector } from '@/src/store';
import http from '@/src/services/http';
import { dotnetArr } from '@/src/helper/dotnetArr';
import {
  createInternalInvoice,
  createExternalInvoice,
} from '@/src/features/invoices/invoiceSlice';
import { fetchAppointmentById } from '@/src/features/appointments/appointmentsSlice';
import { pretty } from '@/src/helper/prettyLog';
import {
  fetchRepairRequestTasksByRepairRequest,
  selectTasksByRepairRequestId,
  selectTasksLoadingByRepairRequestId,
  selectTasksErrorByRepairRequestId,
  updateRepairRequestTasksBatch,
} from '@/src/features/repairRequestTasks/repairRequestTasksSlice';

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };
const ACCESSORY_LIST_ENDPOINT = '/api/accessorys/list';

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
    .min(3, ({ min }) => `Phương án xử lý tối thiểu ${min} ký tự`)
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

  const [accessoriesMaster, setAccessoriesMaster] = useState([]);
  const [accLoading, setAccLoading] = useState(true);
  const [accError, setAccError] = useState(null);
  const [accSearch, setAccSearch] = useState('');
  const [purchaseAccSearch, setPurchaseAccSearch] = useState('');

  const [includeInternalInvoice, setIncludeInternalInvoice] = useState(false);

  const maintenanceTasksFromStore = useAppSelector((s) =>
    rrIdNum ? selectTasksByRepairRequestId(s, rrIdNum) : []
  );
  const maintenanceTasksLoading = useAppSelector((s) =>
    rrIdNum ? selectTasksLoadingByRepairRequestId(s, rrIdNum) : false
  );
  const maintenanceTasksError = useAppSelector((s) =>
    rrIdNum ? selectTasksErrorByRepairRequestId(s, rrIdNum) : null
  );
  const isMaintenance =
    Array.isArray(maintenanceTasksFromStore) &&
    maintenanceTasksFromStore.length > 0;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setAccLoading(true);
        const res = await http.get(ACCESSORY_LIST_ENDPOINT);
        const list = dotnetArr(res?.data);
        if (!mounted) return;
        setAccessoriesMaster(
          (list || []).filter((x) => x.status === 'Active' || !x.status)
        );
        setAccError(null);
      } catch (e) {
        if (!mounted) return;
        setAccError(
          e?.response?.data?.detail || e?.message || 'Lỗi tải nguyên vật liệu'
        );
      } finally {
        if (mounted) setAccLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!rrIdNum) return;
    dispatch(fetchRepairRequestTasksByRepairRequest(rrIdNum));
  }, [rrIdNum, dispatch]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      appointmentId: defaultAppointmentId,
      faultOwner: FaultOwner.BuildingFault,
      solutionType: SolutionType.Repair,
      description: '',
      solution: '',
      accessories: [],
      purchaseAccessories: [],
      services: [],
      extAccessories: [],
      extServices: [],
      maintenanceTasks: [],
    },
  });

  const solutionTypeWatch = watch('solutionType');
  const faultOwnerWatch = watch('faultOwner');
  const accessoriesWatch = watch('accessories') || [];
  const purchaseAccessoriesWatch = watch('purchaseAccessories') || [];
  const servicesWatch = watch('services') || [];
  const extAccessoriesWatch = watch('extAccessories') || [];
  const extServicesWatch = watch('extServices') || [];
  const maintenanceTasksWatch = watch('maintenanceTasks') || [];

  const isOutsource = solutionTypeWatch === SolutionType.Outsource;
  const isRepairOrReplace =
    solutionTypeWatch === SolutionType.Repair ||
    solutionTypeWatch === SolutionType.Replacement;
  const isChargeable = isMaintenance
    ? false
    : faultOwnerWatch === FaultOwner.ResidentFault;

  const canInternalInvoice = isRepairOrReplace && !!rrIdNum;
  const showInternalInvoice = isMaintenance
    ? canInternalInvoice && includeInternalInvoice
    : canInternalInvoice;
  const showExternalInvoice = isOutsource && isSecondOrLaterBool;

  const {
    fields: accFields,
    append: accAppend,
    remove: accRemove,
  } = useFieldArray({ control, name: 'accessories' });

  const {
    fields: purchaseAccFields,
    append: purchaseAccAppend,
    remove: purchaseAccRemove,
  } = useFieldArray({ control, name: 'purchaseAccessories' });

  const {
    fields: svcFields,
    append: svcAppend,
    remove: svcRemove,
  } = useFieldArray({ control, name: 'services' });

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

  const {
    fields: maintenanceTaskFields,
    replace: maintenanceTasksReplace,
  } = useFieldArray({ control, name: 'maintenanceTasks' });

  useEffect(() => {
    if (!maintenanceTasksFromStore || !maintenanceTasksFromStore.length) {
      maintenanceTasksReplace([]);
      return;
    }
    const mapped = maintenanceTasksFromStore.map((t) => ({
      repairRequestTaskId: t.repairRequestTaskId,
      taskName: t.taskName || '',
      taskDescription: t.taskDescription || '',
      status:
        t.status === 'Completed' || t.status === 'Failed'
          ? t.status
          : '',
      technicianNote: t.technicianNote || '',
      inspectionResult: t.inspectionResult || '',
    }));
    maintenanceTasksReplace(mapped);
  }, [maintenanceTasksFromStore, maintenanceTasksReplace]);

  const filteredAccessories = useMemo(() => {
    const keyword = accSearch.trim().toLowerCase();
    if (!keyword) return [];
    return accessoriesMaster.filter((a) =>
      String(a.name || '').toLowerCase().includes(keyword)
    );
  }, [accSearch, accessoriesMaster]);

  const filteredPurchaseAccessories = useMemo(() => {
    const keyword = purchaseAccSearch.trim().toLowerCase();
    if (!keyword) return [];
    return accessoriesMaster.filter((a) =>
      String(a.name || '').toLowerCase().includes(keyword)
    );
  }, [purchaseAccSearch, accessoriesMaster]);

  const servicesTotal = (servicesWatch || []).reduce(
    (sum, s) => sum + (Number(s?.price) || 0),
    0
  );

  const availableAccessoriesTotal = (accessoriesWatch || []).reduce(
    (sum, row) => {
      const currentId = row?.accessoryId;
      const found = accessoriesMaster.find(
        (a) => String(a.accessoryId) === String(currentId)
      );
      const price = Number(found?.price || 0);
      const qty = Number(row?.quantity || 0);
      return sum + price * qty;
    },
    0
  );

  const purchaseAccessoriesTotal = (purchaseAccessoriesWatch || []).reduce(
    (sum, row) => {
      const qty = Number(row?.quantity || 0);
      const price = Number(row?.purchasePrice || 0);
      return sum + qty * price;
    },
    0
  );

  const internalAccessoriesTotal =
    availableAccessoriesTotal + purchaseAccessoriesTotal;

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

  function validateQuantityList(rows, fieldPrefix, getQty) {
    clearErrors(fieldPrefix);
    let hasError = false;
    for (let i = 0; i < (rows || []).length; i += 1) {
      const qty = Number(getQty(rows[i]));
      if (!Number.isFinite(qty) || qty < 1) {
        setError(`${fieldPrefix}.${i}.quantity`, {
          type: 'manual',
          message: 'Số lượng phải lớn hơn hoặc bằng 1',
        });
        hasError = true;
      }
    }
    return !hasError;
  }

  function validateRowFields(rows, fieldPrefix, fieldDefs) {
    clearErrors(fieldPrefix);
    let hasError = false;
    for (let i = 0; i < (rows || []).length; i += 1) {
      const row = rows[i] || {};
      for (const f of fieldDefs) {
        const raw = row?.[f.key];
        const value =
          typeof raw === 'string'
            ? raw.trim()
            : raw;
        const isEmpty = value === undefined || value === null || value === '';
        if (isEmpty) {
          setError(`${fieldPrefix}.${i}.${f.key}`, {
            type: 'manual',
            message: f.requiredMessage || 'Không được để trống',
          });
          hasError = true;
          continue;
        }
        if (f.min != null) {
          const num = Number(value);
          if (!Number.isFinite(num) || num < f.min) {
            setError(`${fieldPrefix}.${i}.${f.key}`, {
              type: 'manual',
              message: f.minMessage || `Giá trị phải lớn hơn hoặc bằng ${f.min}`,
            });
            hasError = true;
          }
        }
      }
    }
    return !hasError;
  }

  const onSubmit = async (values) => {
    try {
      if (isMaintenance && rrIdNum) {
        if (!maintenanceTasksWatch.length) {
          setError('maintenanceTasks', {
            type: 'manual',
            message: 'Không tìm thấy nhiệm vụ bảo trì nào để cập nhật.',
          });
          return;
        } else {
          clearErrors('maintenanceTasks');
        }

        let hasStatusError = false;
        let hasInspectionError = false;

        maintenanceTasksWatch.forEach((t, idx) => {
          if (!t.status) {
            setError(`maintenanceTasks.${idx}.status`, {
              type: 'manual',
              message: 'Bắt buộc chọn trạng thái',
            });
            hasStatusError = true;
          }
          if (!String(t.inspectionResult || '').trim()) {
            setError(`maintenanceTasks.${idx}.inspectionResult`, {
              type: 'manual',
              message: 'Nhập kết quả kiểm tra',
            });
            hasInspectionError = true;
          }
        });

        if (hasStatusError || hasInspectionError) {
          return;
        }

        const batchItems = maintenanceTasksWatch.map((t) => ({
          repairRequestTaskId: Number(t.repairRequestTaskId),
          status: t.status,
          technicianNote: String(t.technicianNote || '').trim(),
          inspectionResult: String(t.inspectionResult || '').trim(),
        }));

        await dispatch(
          updateRepairRequestTasksBatch({
            repairRequestId: rrIdNum,
            items: batchItems,
          })
        ).unwrap();
      }

      const shouldCreateInternalInvoice =
        (!isMaintenance && canInternalInvoice) ||
        (isMaintenance && canInternalInvoice && includeInternalInvoice);

      if (shouldCreateInternalInvoice) {
        const okAccQty = validateQuantityList(
          accessoriesWatch,
          'accessories',
          (r) => r?.quantity
        );
        if (!okAccQty) return;

        const okPurchaseAccQty = validateQuantityList(
          purchaseAccessoriesWatch,
          'purchaseAccessories',
          (r) => r?.quantity
        );
        if (!okPurchaseAccQty) return;

        const hasAcc =
          Array.isArray(accessoriesWatch) && accessoriesWatch.length > 0;
        const hasPurchaseAcc =
          Array.isArray(purchaseAccessoriesWatch) &&
          purchaseAccessoriesWatch.length > 0;
        const hasSvc =
          Array.isArray(servicesWatch) && servicesWatch.length > 0;

        if (isChargeable && !hasAcc && !hasPurchaseAcc && !hasSvc) {
          setError('internalInvoice', {
            type: 'manual',
            message:
              'Với trường hợp sửa chữa / thay thế, cần ít nhất 1 dòng nguyên vật liệu hoặc công việc khi cư dân chịu phí.',
          });
          return;
        } else {
          clearErrors('internalInvoice');
        }

        if (hasPurchaseAcc) {
          const okPurchase = validateRowFields(
            purchaseAccessoriesWatch,
            'purchaseAccessories',
            [
              {
                key: 'name',
                requiredMessage: 'Nhập tên nguyên vật liệu',
              },
              {
                key: 'purchasePrice',
                min: 0,
                minMessage: 'Giá mua phải lớn hơn hoặc bằng 0',
              },
            ]
          );
          if (!okPurchase) return;
        }

        if (hasSvc) {
          const okSvc = validateRowFields(
            servicesWatch,
            'services',
            [
              {
                key: 'name',
                requiredMessage: 'Nhập tên công việc',
              },
              {
                key: 'price',
                min: 0,
                minMessage: 'Giá phải lớn hơn hoặc bằng 0',
              },
            ]
          );
          if (!okSvc) return;
        }

        const availableAccessories = (accessoriesWatch || []).map((a) => ({
          accessoryId: Number(a.accessoryId),
          quantity: Number(a.quantity),
        }));

        const accessoriesToPurchase = (purchaseAccessoriesWatch || []).map(
          (a) => ({
            accessoryId: Number(a.accessoryId) || 0,
            name: String(a.name || '').trim(),
            quantity: Number(a.quantity) || 0,
            purchasePrice: Number(a.purchasePrice) || 0,
          })
        );

        const internalInvoicePayload = {
          repairRequestId: rrIdNum,
          isChargeable: !!isChargeable,
          availableAccessories,
          accessoriesToPurchase,
          services: (servicesWatch || []).map((s) => ({
            name: String(s.name || '').trim(),
            price: Number(s.price),
          })),
        };

        await dispatch(createInternalInvoice(internalInvoicePayload)).unwrap();
      }

      if (showExternalInvoice && rrIdNum) {
        const okExtAccQty = validateQuantityList(
          extAccessoriesWatch,
          'extAccessories',
          (r) => r?.quantity
        );
        if (!okExtAccQty) return;

        const hasExtAcc =
          Array.isArray(extAccessoriesWatch) && extAccessoriesWatch.length > 0;
        const hasExtSvc =
          Array.isArray(extServicesWatch) && extServicesWatch.length > 0;

        if (isChargeable && !hasExtAcc && !hasExtSvc) {
          setError('externalInvoice', {
            type: 'manual',
            message:
              'Khi cư dân chịu phí, cần ít nhất 1 dòng nguyên vật liệu hoặc công việc.',
          });
          return;
        } else {
          clearErrors('externalInvoice');
        }

        if (hasExtAcc) {
          const okExtAcc = validateRowFields(
            extAccessoriesWatch,
            'extAccessories',
            [
              {
                key: 'name',
                requiredMessage: 'Nhập tên nguyên vật liệu',
              },
              {
                key: 'quantity',
                min: 1,
                minMessage: 'Số lượng phải lớn hơn hoặc bằng 1',
              },
              {
                key: 'price',
                min: 0,
                minMessage: 'Đơn giá phải lớn hơn hoặc bằng 0',
              },
            ]
          );
          if (!okExtAcc) return;
        }

        if (hasExtSvc) {
          const okExtSvc = validateRowFields(
            extServicesWatch,
            'extServices',
            [
              {
                key: 'name',
                requiredMessage: 'Nhập tên công việc',
              },
              {
                key: 'price',
                min: 0,
                minMessage: 'Giá phải lớn hơn hoặc bằng 0',
              },
            ]
          );
          if (!okExtSvc) return;
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

        await dispatch(createExternalInvoice(externalInvoicePayload)).unwrap();
      }

      const filesCompressed = await compressMany(images, {
        maxWidth: 1280,
        quality: 0.7,
        format: 'jpeg',
      });

      const commonPayload = {
        appointmentId: Number(values.appointmentId),
        solutionType: String(values.solutionType),
        description: values.description?.trim() || '',
        solution: values.solution?.trim() || '',
        Files: filesCompressed,
      };

      if (isMaintenance) {
        await dispatch(
          generateInspectionMaintenanceReport(commonPayload)
        ).unwrap();
      } else {
        await dispatch(
          generateInspectionReport({
            ...commonPayload,
            faultOwner: String(values.faultOwner),
          })
        ).unwrap();
      }

      Toast.show({
        type: 'success',
        text1: isMaintenance
          ? 'Đã tạo báo cáo kiểm tra bảo trì'
          : 'Đã tạo báo cáo khảo sát',
      });
      dispatch(fetchAppointmentById(Number(appointmentId)));
      router.back();
    } catch (err) {
      console.log('[inspection + invoice error]', pretty(err));

      const msg =
        err?.response?.data?.detail ||
        err?.message?.title ||
        err?.message ||
        'Tạo báo cáo thất bại';
      Toast.show({
        type: 'error',
        text1: 'Lỗi gửi báo cáo',
        text2: msg,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Icon name="doc.text" size={20} color={appleBlue} />
        <Text style={styles.headerTitle}>
          {isMaintenance ? 'Báo cáo kiểm tra bảo trì' : 'Báo cáo khảo sát'}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
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

        {!isMaintenance && (
          <>
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
          </>
        )}

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

        {isMaintenance && (
          <View style={[styles.invoiceBlock, { marginTop: 12 }]}>
            <Text style={styles.invoiceTitle}>Checklist bảo trì khu vực chung</Text>
            <Text style={styles.invoiceSub}>
              Cập nhật trạng thái cho từng nhiệm vụ trước khi tạo báo cáo kiểm
              tra.
            </Text>

            {maintenanceTasksLoading ? (
              <Text style={{ color: zincColors[500], marginTop: 8 }}>
                Đang tải danh sách nhiệm vụ...
              </Text>
            ) : maintenanceTasksError ? (
              <Text style={{ color: '#B91C1C', marginTop: 8 }}>
                {String(maintenanceTasksError)}
              </Text>
            ) : maintenanceTaskFields.length === 0 ? (
              <Text style={{ color: zincColors[500], marginTop: 8 }}>
                Chưa có nhiệm vụ bảo trì nào cho yêu cầu này.
              </Text>
            ) : (
              maintenanceTaskFields.map((row, idx) => {
                const formRow = maintenanceTasksWatch[idx] || {};
                const rowErrors = errors.maintenanceTasks?.[idx] || {};
                return (
                  <View key={row.id} style={styles.maintenanceCard}>
                    <Text style={styles.maintenanceTaskTitle}>
                      {formRow.taskName || `Nhiệm vụ #${idx + 1}`}
                    </Text>
                    {!!formRow.taskDescription && (
                      <Text style={styles.maintenanceTaskDesc}>
                        {formRow.taskDescription}
                      </Text>
                    )}

                    <Text style={styles.smallLabel}>Trạng thái</Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 8,
                      }}
                    >
                      {['Completed', 'Failed'].map((st) => (
                        <Controller
                          key={st}
                          control={control}
                          name={`maintenanceTasks.${idx}.status`}
                          render={({ field: { value, onChange } }) => (
                            <Pressable
                              onPress={() => onChange(st)}
                              style={[
                                styles.statusChip,
                                value === st && styles.statusChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusChipText,
                                  value === st && styles.statusChipTextActive,
                                ]}
                              >
                                {st === 'Completed' ? 'Đạt' : 'Chưa đạt'}
                              </Text>
                            </Pressable>
                          )}
                        />
                      ))}
                    </View>
                    {!!rowErrors?.status?.message && (
                      <Text style={styles.errText}>
                        {rowErrors.status.message}
                      </Text>
                    )}

                    <Controller
                      control={control}
                      name={`maintenanceTasks.${idx}.technicianNote`}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <MUITextField
                          label="Ghi chú kỹ thuật viên"
                          placeholder="VD: Đã vệ sinh bể nước, không thấy rò rỉ."
                          multiline
                          numberOfLines={3}
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          error={rowErrors?.technicianNote?.message}
                          style={{ marginTop: 4 }}
                        />
                      )}
                    />

                    <Controller
                      control={control}
                      name={`maintenanceTasks.${idx}.inspectionResult`}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <MUITextField
                          label="Kết quả kiểm tra"
                          placeholder='VD: "OK", "Cần sửa chữa", "Cần thay thế"...'
                          multiline
                          numberOfLines={2}
                          value={value}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          error={rowErrors?.inspectionResult?.message}
                          style={{ marginTop: 8 }}
                        />
                      )}
                    />
                  </View>
                );
              })
            )}

            {!!errors.maintenanceTasks?.message && (
              <Text style={styles.errText}>
                {errors.maintenanceTasks.message}
              </Text>
            )}

            <Text style={styles.maintenanceNote}>
              Lưu ý: Tất cả nhiệm vụ cần được cập nhật (không để trống trạng
              thái) trước khi tạo báo cáo.
            </Text>
          </View>
        )}

        <ImagePickerStrip
          style={{ marginTop: 14 }}
          mode="update"
          value={images}
          onChange={setImages}
          maxCount={10}
          title="Ảnh khảo sát"
        />

        {isMaintenance && canInternalInvoice && (
          <Pressable
            style={[
              styles.invoiceToggle,
              includeInternalInvoice && styles.invoiceToggleActive,
            ]}
            onPress={() => setIncludeInternalInvoice((v) => !v)}
          >
            <Icon
              name="note-text-outline"
              size={18}
              color={includeInternalInvoice ? appleBlue : zincColors[500]}
            />
            <Text
              style={[
                styles.invoiceToggleText,
                includeInternalInvoice && { color: appleBlue },
              ]}
            >
              Kèm báo giá
            </Text>
          </Pressable>
        )}

        {showInternalInvoice && (
          <View style={styles.invoiceBlock}>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.invoiceTitle}>Báo giá nội bộ</Text>
            </View>
            {isMaintenance ? null : (
              <View style={styles.fieldRow}>
                <Text style={styles.label}>Đối tượng chịu phí</Text>
                <View style={styles.chargeableChip}>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isChargeable ? '#16A34A' : '#6B7280' },
                    ]}
                  />
                  <Text style={styles.chargeableText}>
                    {isChargeable
                      ? 'Cư dân chịu phí (Lỗi cư dân)'
                      : isMaintenance
                      ? 'Tòa nhà chịu phí (Bảo trì định kỳ)'
                      : 'Tòa nhà chịu phí (Lỗi tòa nhà)'}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="wrench" size={18} color={appleBlue} />
                <Text style={styles.cardTitle}>Thiết bị / vật tư trong kho</Text>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={styles.smallLabel}>Tìm nguyên vật liệu theo tên</Text>
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
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: zincColors[500] }}>
                    Chưa có dòng nguyên vật liệu nào.
                  </Text>
                </View>
              ) : null}

              {accFields.map((row, idx) => {
                const formRow = accessoriesWatch?.[idx];
                const currentAccessoryId = formRow?.accessoryId;
                const matchedAcc = accessoriesMaster.find(
                  (a) => String(a.accessoryId) === String(currentAccessoryId)
                );
                const fieldError =
                  errors.accessories?.[idx]?.quantity?.message;
                return (
                  <View key={row.id} style={styles.rowBlock}>
                    {matchedAcc && (
                      <View style={styles.accInfoLine}>
                        <Text style={styles.accName}>{matchedAcc.name}</Text>
                        <Text style={styles.accMeta}>
                          #{matchedAcc.accessoryId} ·{' '}
                          {Number(matchedAcc.price || 0).toLocaleString('vi-VN')} đ
                          · tồn {matchedAcc.quantity}
                        </Text>
                      </View>
                    )}
                    <Controller
                      control={control}
                      name={`accessories.${idx}.quantity`}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <View style={{ width: 70 }}>
                          <Text style={styles.smallLabel}>Số lượng</Text>
                          <TextInput
                            value={String(value ?? '')}
                            onBlur={onBlur}
                            onChangeText={(t) => onChange(t.replace(/\D+/g, ''))}
                            keyboardType="numeric"
                            placeholder="1"
                            style={styles.input}
                          />
                          {!!fieldError && (
                            <Text style={styles.errText}>{fieldError}</Text>
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

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="cart" size={18} color={appleBlue} />
                <Text style={styles.cardTitle}>Mua vật liệu</Text>
                <Pressable
                  onPress={() =>
                    purchaseAccAppend({
                      accessoryId: '',
                      name: '',
                      quantity: '',
                      purchasePrice: '',
                    })
                  }
                  style={styles.addBtn}
                >
                  <Icon name="plus.circle" size={18} color={appleBlue} />
                  <Text style={styles.addTxt}>Thêm dòng trống</Text>
                </Pressable>
              </View>

              <View style={{ marginBottom: 10 }}>
                <Text style={styles.smallLabel}>Tìm theo tên (hoặc tự nhập)</Text>
                <TextInput
                  value={purchaseAccSearch}
                  onChangeText={setPurchaseAccSearch}
                  placeholder="Nhập tên nguyên vật liệu..."
                  style={styles.input}
                />
                {purchaseAccSearch.length > 0 &&
                  filteredPurchaseAccessories.length > 0 && (
                    <View style={styles.suggestionBox}>
                      {filteredPurchaseAccessories.slice(0, 5).map((acc) => (
                        <Pressable
                          key={acc.accessoryId}
                          style={styles.suggestionItem}
                          onPress={() => {
                            purchaseAccAppend({
                              accessoryId: String(acc.accessoryId),
                              name: acc.name || '',
                              quantity: 1,
                              purchasePrice: acc.price || 0,
                            });
                            setPurchaseAccSearch('');
                          }}
                        >
                          <Text style={styles.suggestionName}>{acc.name}</Text>
                          <Text style={styles.suggestionMeta}>
                            #{acc.accessoryId} ·{' '}
                            {Number(acc.price || 0).toLocaleString('vi-VN')} đ
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
              </View>

              {purchaseAccFields.length === 0 ? (
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: zincColors[500] }}>
                    Chưa có dòng mua ngoài nào.
                  </Text>
                </View>
              ) : null}

              {purchaseAccFields.map((row, idx) => {
                const rowErrors = errors.purchaseAccessories?.[idx] || {};
                return (
                  <View key={row.id} style={styles.rowBlock}>
                    <View style={{ flex: 1.6 }}>
                      <Text style={styles.smallLabel}>Tên nguyên vật liệu</Text>
                      <Controller
                        control={control}
                        name={`purchaseAccessories.${idx}.name`}
                        render={({ field: { value, onChange, onBlur } }) => (
                          <>
                            <TextInput
                              value={value}
                              onBlur={onBlur}
                              onChangeText={onChange}
                              placeholder="VD: Ống nước PVC 27mm"
                              style={styles.input}
                            />
                            {!!rowErrors?.name?.message && (
                              <Text style={styles.errText}>
                                {rowErrors.name.message}
                              </Text>
                            )}
                          </>
                        )}
                      />
                    </View>

                    <View style={{ width: 60 }}>
                      <Text style={styles.smallLabel}>Số lượng</Text>
                      <Controller
                        control={control}
                        name={`purchaseAccessories.${idx}.quantity`}
                        render={({ field: { value, onChange, onBlur } }) => (
                          <>
                            <TextInput
                              value={String(value ?? '')}
                              onBlur={onBlur}
                              onChangeText={(t) => onChange(t.replace(/\D+/g, ''))}
                              keyboardType="numeric"
                              placeholder="1"
                              style={styles.input}
                            />
                            {!!rowErrors?.quantity?.message && (
                              <Text style={styles.errText}>
                                {rowErrors.quantity.message}
                              </Text>
                            )}
                          </>
                        )}
                      />
                    </View>

                    <View style={{ width: 100 }}>
                      <Text style={styles.smallLabel}>Giá mua</Text>
                      <Controller
                        control={control}
                        name={`purchaseAccessories.${idx}.purchasePrice`}
                        render={({ field: { value, onChange, onBlur } }) => (
                          <>
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
                            {!!rowErrors?.purchasePrice?.message && (
                              <Text style={styles.errText}>
                                {rowErrors.purchasePrice.message}
                              </Text>
                            )}
                          </>
                        )}
                      />
                    </View>

                    <Pressable
                      onPress={() => purchaseAccRemove(idx)}
                      style={styles.delBtn}
                    >
                      <Icon name="trash" size={18} color="#B91C1C" />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="hammer" size={18} color={appleBlue} />
                <Text style={styles.cardTitle}>Công việc</Text>
                <Pressable
                  onPress={() => svcAppend({ name: '', price: '' })}
                  style={styles.addBtn}
                >
                  <Icon name="plus.circle" size={18} color={appleBlue} />
                  <Text style={styles.addTxt}>Thêm dòng</Text>
                </Pressable>
              </View>

              {svcFields.length === 0 ? (
                <View style={{ alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ color: zincColors[500] }}>
                    Chưa có dòng công việc nào.
                  </Text>
                </View>
              ) : null}

              {svcFields.map((row, idx) => {
                const rowErrors = errors.services?.[idx] || {};
                return (
                  <View key={row.id} style={styles.rowBlock}>
                    <Controller
                      control={control}
                      name={`services.${idx}.name`}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <View style={{ flex: 1.2 }}>
                          <Text style={styles.smallLabel}>Tên công việc</Text>
                          <TextInput
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            placeholder="VD: Sửa khóa cửa"
                            style={styles.input}
                          />
                          {!!rowErrors?.name?.message && (
                            <Text style={styles.errText}>
                              {rowErrors.name.message}
                            </Text>
                          )}
                        </View>
                      )}
                    />

                    <Controller
                      control={control}
                      name={`services.${idx}.price`}
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
                          {!!rowErrors?.price?.message && (
                            <Text style={styles.errText}>
                              {rowErrors.price.message}
                            </Text>
                          )}
                        </View>
                      )}
                    />

                    <Pressable onPress={() => svcRemove(idx)} style={styles.delBtn}>
                      <Icon name="trash" size={18} color="#B91C1C" />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>
                Tổng tiền nguyên vật liệu (nháp)
              </Text>
              <Text style={styles.totalValue}>
                {internalAccessoriesTotal.toLocaleString('vi-VN')} đ
              </Text>

              <View style={{ height: 8 }} />

              <Text style={styles.totalLabel}>Tổng tiền công việc (nháp)</Text>
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
                  {(internalAccessoriesTotal + servicesTotal).toLocaleString(
                    'vi-VN'
                  )}{' '}
                  đ
                </Text>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text style={styles.smallLabel}>
                  {isChargeable
                    ? '(Cư dân thanh toán – lỗi cư dân)'
                    : isMaintenance
                    ? '(Tòa nhà thanh toán – bảo trì định kỳ)'
                    : '(Tòa nhà thanh toán – lỗi tòa nhà)'}
                </Text>
              </View>

              {!!errors.internalInvoice?.message && (
                <Text style={styles.errText}>
                  {errors.internalInvoice.message}
                </Text>
              )}
            </View>
          </View>
        )}

        {showExternalInvoice && (
          <View style={[styles.invoiceBlock, { marginTop: 24 }]}>
            <Text style={styles.invoiceTitle}>Hóa đơn bên thứ ba</Text>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>ID yêu cầu:</Text>
              <Text style={styles.value}>{rrIdNum || '-'}</Text>
            </View>

            <View style={styles.fieldRow}>
              <Text style={styles.label}>Đối tượng chịu phí</Text>
              <View style={styles.chargeableChip}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: isChargeable ? '#16A34A' : '#6B7280' },
                  ]}
                />
                <Text style={styles.chargeableText}>
                  {isChargeable
                    ? 'Cư dân chịu phí (Lỗi cư dân)'
                    : isMaintenance
                    ? 'Tòa nhà chịu phí (Bảo trì định kỳ)'
                    : 'Tòa nhà chịu phí (Lỗi tòa nhà)'}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="wrench" size={18} color={appleBlue} />
                <Text style={styles.cardTitle}>Nguyên vật liệu</Text>
                <Pressable
                  onPress={() =>
                    extAccAppend({ name: '', quantity: '', price: '' })
                  }
                  style={styles.addBtn}
                >
                  <Icon name="plus.circle" size={18} color={appleBlue} />
                  <Text style={styles.addTxt}>Thêm dòng</Text>
                </Pressable>
              </View>

              {extAccFields.length === 0 ? (
                <Text style={{ color: zincColors[500] }}>
                  Chưa có dòng nguyên vật liệu nào.
                </Text>
              ) : null}

              {extAccFields.map((row, idx) => {
                const rowErrors = errors.extAccessories?.[idx] || {};
                return (
                  <View key={row.id} style={styles.rowBlock}>
                    <Controller
                      control={control}
                      name={`extAccessories.${idx}.name`}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <View style={{ flex: 1.3 }}>
                          <Text style={styles.smallLabel}>Tên nguyên vật liệu</Text>
                          <TextInput
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            placeholder="VD: Sơn tường Dulux 5L"
                            style={styles.input}
                          />
                          {!!rowErrors?.name?.message && (
                            <Text style={styles.errText}>
                              {rowErrors.name.message}
                            </Text>
                          )}
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
                            onChangeText={(t) => onChange(t.replace(/\D+/g, ''))}
                            keyboardType="numeric"
                            placeholder="1"
                            style={styles.input}
                          />
                          {!!rowErrors?.quantity?.message && (
                            <Text style={styles.errText}>
                              {rowErrors.quantity.message}
                            </Text>
                          )}
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
                          {!!rowErrors?.price?.message && (
                            <Text style={styles.errText}>
                              {rowErrors.price.message}
                            </Text>
                          )}
                        </View>
                      )}
                    />

                    <Pressable
                      onPress={() => extAccRemove(idx)}
                      style={styles.delBtn}
                    >
                      <Icon name="trash" size={18} color="#B91C1C" />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="hammer" size={18} color={appleBlue} />
                <Text style={styles.cardTitle}>Công việc</Text>
                <Pressable
                  onPress={() => extSvcAppend({ name: '', price: '' })}
                  style={styles.addBtn}
                >
                  <Icon name="plus.circle" size={18} color={appleBlue} />
                  <Text style={styles.addTxt}>Thêm dòng</Text>
                </Pressable>
              </View>

              {extSvcFields.length === 0 ? (
                <Text style={{ color: zincColors[500] }}>
                  Chưa có dòng công việc nào.
                </Text>
              ) : null}

              {extSvcFields.map((row, idx) => {
                const rowErrors = errors.extServices?.[idx] || {};
                return (
                  <View key={row.id} style={styles.rowBlock}>
                    <Controller
                      control={control}
                      name={`extServices.${idx}.name`}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <View style={{ flex: 1.3 }}>
                          <Text style={styles.smallLabel}>Tên công việc</Text>
                          <TextInput
                            value={value}
                            onBlur={onBlur}
                            onChangeText={onChange}
                            placeholder="VD: Công thợ trét lại tường"
                            style={styles.input}
                          />
                          {!!rowErrors?.name?.message && (
                            <Text style={styles.errText}>
                              {rowErrors.name.message}
                            </Text>
                          )}
                        </View>
                      )}
                    />

                    <Controller
                      control={control}
                      name={`extServices.${idx}.price`}
                      render={({ field: { value, onChange, onBlur } }) => (
                        <View style={{ width: 70 }}>
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
                          {!!rowErrors?.price?.message && (
                            <Text style={styles.errText}>
                              {rowErrors.price.message}
                            </Text>
                          )}
                        </View>
                      )}
                    />

                    <Pressable
                      onPress={() => extSvcRemove(idx)}
                      style={styles.delBtn}
                    >
                      <Icon name="trash" size={18} color="#B91C1C" />
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>
                Tổng tiền nguyên vật liệu (nháp)
              </Text>
              <Text style={styles.totalValue}>
                {extAccessoriesTotal.toLocaleString('vi-VN')} đ
              </Text>

              <View style={{ height: 8 }} />

              <Text style={styles.totalLabel}>Tổng tiền công việc (nháp)</Text>
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
                <Text style={styles.totalLabel}>Tổng tiền tạm tính</Text>
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
                    ? '(Cư dân thanh toán – lỗi cư dân)'
                    : isMaintenance
                    ? '(Tòa nhà thanh toán – bảo trì định kỳ)'
                    : '(Tòa nhà thanh toán – lỗi tòa nhà)'}
                </Text>
              </View>

              {!!errors.externalInvoice?.message && (
                <Text style={styles.errText}>
                  {errors.externalInvoice.message}
                </Text>
              )}
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
    marginTop: 2,
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

  invoiceBlock: {
    marginTop: 20,
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
    color: zincColors[600],
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

  maintenanceCard: {
    marginTop: 10,
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
    backgroundColor: '#F9FAFB',
  },
  maintenanceTaskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 4,
  },
  maintenanceTaskDesc: {
    fontSize: 12,
    color: zincColors[600],
    marginBottom: 10,
  },
  maintenanceNote: {
    fontSize: 12,
    color: zincColors[500],
    marginTop: 4,
  },

  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: borderColor,
    backgroundColor: '#FFF',
  },
  statusChipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: appleBlue,
  },
  statusChipText: {
    fontSize: 12,
    color: zincColors[600],
    fontWeight: '600',
  },
  statusChipTextActive: {
    color: appleBlue,
  },

  invoiceToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
  },
  invoiceToggleActive: {},
  invoiceToggleText: {
    fontSize: 14,
    color: zincColors[700],
    fontWeight: '600',
  },
});
