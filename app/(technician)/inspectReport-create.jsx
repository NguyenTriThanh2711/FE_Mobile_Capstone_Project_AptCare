// app/(technician)/inspectReport-create.jsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';
import { Icon } from '@/src/components/Icon.native';
import MUITextField from '@/src/components/common/MUITextField';
import ChipRadioGroup from '@/src/components/ChipRadioGroup';
import { Colors } from '@/src/utils/colors';
import { http } from '@/src/services/http';

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };

// ===== Enums (theo BE) =====
const FaultOwner = {
  BuildingFault: 1,
  ResidentFault: 2,
};
const SolutionType = {
  Repair: 1,
  Replacement: 2,
  Outsource: 3,
};

// ===== Options hiển thị =====
const FAULT_OWNER_OPTIONS = [
  { label: 'Lỗi tòa nhà', value: FaultOwner.BuildingFault },
  { label: 'Lỗi cư dân', value: FaultOwner.ResidentFault },
];
const SOLUTION_TYPE_OPTIONS = [
  { label: 'Sửa chữa', value: SolutionType.Repair },
  { label: 'Thay thế', value: SolutionType.Replacement },
  { label: 'Thuê ngoài', value: SolutionType.Outsource },
];

// ===== Yup schema =====
const schema = yup.object({
  appointmentId: yup.number().typeError('AppointmentId phải là số').required('Bắt buộc'),
  faultOwner: yup.number().oneOf([1, 2], 'Chọn người chịu lỗi').required('Bắt buộc'),
  solutionType: yup.number().oneOf([1, 2, 3], 'Chọn giải pháp').required('Bắt buộc'),
  description: yup.string().max(2000, 'Tối đa 2000 ký tự').default(''),
  solution: yup.string().max(2000, 'Tối đa 2000 ký tự').default(''),
});

export default function CreateInspectionReportScreen() {
  const { appointmentId } = useLocalSearchParams();
  const defaultAppointmentId = useMemo(() => {
    const n = Number(appointmentId);
    return Number.isFinite(n) ? n : '';
  }, [appointmentId]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      appointmentId: defaultAppointmentId,
      faultOwner: FaultOwner.BuildingFault,
      solutionType: SolutionType.Repair,
      description: '',
      solution: '',
    },
  });

  // ===== Submit API =====
  const onSubmit = async (values) => {
    try {
      // Endpoint bạn map theo BE — đặt theo chuẩn REST:
      // BE method: GenerateInspectionReportAsync(CreateInspectionReporDto dto)
      // Gợi ý endpoint: "/api/inspections/reports/generate"
      const { data } = await http.post('/api/inspections/reports/generate', {
        appointmentId: Number(values.appointmentId),
        faultOwner: Number(values.faultOwner),
        solutionType: Number(values.solutionType),
        description: values.description?.trim() || '',
        solution: values.solution?.trim() || '',
      });

      Toast.show({ type: 'success', text1: 'Đã tạo báo cáo khảo sát' });
      router.back();
    } catch (err) {
      const msg =
        err?.response?.data?.detail || err?.response?.data?.message || 'Tạo báo cáo thất bại';
      Toast.show({ type: 'error', text1: msg });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Icon name="chevron.left" size={22} color="#0A66C2" />
        </Pressable>
        <Icon name="doc.text" size={20} color="#0A66C2" />
        <Text style={styles.headerTitle}>Báo cáo khảo sát</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Appointment Id */}
        <Controller
          control={control}
          name="appointmentId"
          render={({ field: { value, onChange, onBlur } }) => (
            <MUITextField
              label="Appointment ID"
              placeholder="Nhập mã cuộc hẹn"
              keyboardType="numeric"
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
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.solution?.message}
            />
          )}
        />
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Pressable
          onPress={handleSubmit(onSubmit)}
          style={[styles.primaryBtn, isSubmitting && { opacity: 0.6 }]}
          disabled={isSubmitting}>
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
  container: { flex: 1, backgroundColor: THEME.background },
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

  errText: { color: '#B91C1C', fontSize: 12, marginTop: -6, marginBottom: 8 },

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
