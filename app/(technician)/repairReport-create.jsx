import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Toast from 'react-native-toast-message';

import { Icon } from '@/src/components/Icon.native';
import MUITextField from '@/src/components/common/MUITextField';
import ImagePickerStrip from '@/src/components/ImagePickerStrip';
import { Colors } from '@/src/utils/colors';
import http from '@/src/services/http';
import { compressMany } from '@/src/utils/imageCompression';
import { createRepairReport, fetchRepairReportByAppointment } from '@/src/features/repairReport/repairReportSlice';
import { useAppDispatch } from '@/src/store';

const THEME = Colors?.light ?? { background: '#fff', text: '#0F172A' };


const schema = yup.object({
  appointmentId: yup
    .number()
    .typeError('AppointmentId phải là số')
    .required('Bắt buộc'),
  workDescription: yup
    .string()
    .trim()
    .required('Vui lòng mô tả công việc đã thực hiện'),
  note: yup.string().max(2000).nullable(),
});

export default function CreateRepairReportScreen() {
  const { appointmentId } = useLocalSearchParams();
  const [images, setImages] = useState([]);
  const dispatch = useAppDispatch();
  const defaultAppointmentId = useMemo(() => {
    const n = Number(appointmentId);
    return Number.isFinite(n) ? n : '';
  }, [appointmentId]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      appointmentId: defaultAppointmentId,
      workDescription: '',
      note: '',
    },
  });

  const onSubmit = async (values) => {
    try {
      const filesCompressed = await compressMany(images, {
        maxWidth: 1280,
        quality: 0.7,
        format: 'jpeg',
      });

      const fd = new FormData();
      fd.append('AppointmentId', String(values.appointmentId));
      fd.append('WorkDescription', values.workDescription.trim());
      if (values.note?.trim()) {
        fd.append('Note', values.note.trim());
      }
      filesCompressed.forEach((f, idx) => {
        fd.append('Files', {
          uri: f.uri,
          name: f.name ?? `repair-${idx}.jpg`,
          type: f.type ?? 'image/jpeg',
        });
      });

      await dispatch(createRepairReport(fd)).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Đã tạo báo cáo sửa chữa',
      });
      await dispatch(fetchRepairReportByAppointment({ appointmentId: values.appointmentId }));
      router.back();
    } catch (err) {
      console.log('[repair report err] =>', err);
      const msg =err?.message ||
        'Tạo báo cáo sửa chữa thất bại';
      Toast.show({
        type: 'error',
        text1: 'Lỗi không tạo được báo cáo',
        text2: msg,
      });
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
        <Text style={styles.headerTitle}>Báo cáo sửa chữa</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Appointment Id (locked) */}
        {/* <Controller
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
        /> */}

        {/* WorkDescription */}
        <Controller
          control={control}
          name="workDescription"
          render={({ field: { value, onChange, onBlur } }) => (
            <MUITextField
              label="Công việc đã thực hiện *"
              placeholder="Ví dụ: tháo bồn cầu, vệ sinh, thay phao, lắp lại và test, bàn giao..."
              multiline
              numberOfLines={4}
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.workDescription?.message}
              style={{ marginTop: 14 }}
            />
          )}
        />
        {!!errors.workDescription?.message && (
          <Text style={styles.errText}>{errors.workDescription.message}</Text>
        )}
        {/* Note (optional) */}
        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange, onBlur } }) => (
            <MUITextField
              label="Ghi chú thêm"
              placeholder="Ghi chú vật tư, khuyến nghị bảo dưỡng, tình trạng hiện tại..."
              multiline
              numberOfLines={3}
              size="large"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              style={{ marginTop: 14, marginBottom: 14 }}
            />
          )}
        />

        {/* Images */}
        <ImagePickerStrip
          mode="update"
          value={images}
          onChange={setImages}
          maxCount={10}
          title="Ảnh sau khi sửa"
        />
      </ScrollView>

      {/* Footer */}
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
  errText: { color: '#B91C1C', fontSize: 12, marginTop: 0, marginBottom: 0, marginLeft: 5 },
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
