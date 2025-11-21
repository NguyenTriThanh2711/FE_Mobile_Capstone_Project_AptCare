import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import {
  fetchInspectionReportById,
  selectReportById,
  selectReportLoadingById,
} from '@/src/features/inspectionReport/inspectionRPSlice';
import { Colors, zincColors, appleBlue, borderColor } from '@/src/utils/colors';
import ImagePickerStrip from '@/src/components/ImagePickerStrip';
import { timeDayDate } from '@/src/utils/date';
import { dotnetArr } from '@/src/helper/dotnetArr';
import { pretty } from '@/src/helper/prettyLog';

const THEME = Colors.light;

const OWNER_LABEL = {
  BuildingFault: 'Lỗi tòa nhà',
  ResidentFault: 'Lỗi cư dân',
  1: 'Lỗi tòa nhà',
  2: 'Lỗi cư dân',
};

const SOLUTION_LABEL = {
  Repair: 'Sửa chữa',
  Replacement: 'Thay thế',
  Outsource: 'Thuê ngoài',
  1: 'Sửa chữa',
  2: 'Thay thế',
  3: 'Thuê ngoài',
};

export default function InspectReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const reportId = Number(id);
  const dispatch = useAppDispatch();

  const loading = useAppSelector((s) => selectReportLoadingById(s, reportId));
  const report = useAppSelector((s) => selectReportById(s, reportId));
  console.log('[data => report]', pretty(report))
  useEffect(() => {
    if (reportId) dispatch(fetchInspectionReportById(reportId));
  }, [reportId, dispatch]);

  const dt = report?.createdAt ? timeDayDate(report.createdAt) : '-';
  const medias = useMemo(() => dotnetArr(report?.medias), [report]);
  return (
    <View style={{ flex: 1, backgroundColor: THEME.background, paddingTop: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Icon name="chevron.left" size={22} color={appleBlue} />
        </Pressable>
        <Icon name="doc.text" size={20} color={appleBlue} />
        <Text style={styles.headerTitle}>Chi tiết báo cáo</Text>
      </View>

      {loading && !report ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 8, color: zincColors[500] }}>Đang tải…</Text>
        </View>
      ) : !report ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: zincColors[600] }}>Không tìm thấy báo cáo.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <View style={styles.card}>
            <Row label="Mã báo cáo" value={report.inspectionReportId} />
            <Row label="Mã cuộc hẹn" value={report.appointmentId} />
            <Row label="Thời gian tạo" value={dt} />
            <Row label="Khu vực" value={report.areaName || '-'} />
            <Row
              label="Người chịu lỗi"
              value={OWNER_LABEL[report.faultOwner] || String(report.faultOwner)}
            />
            <Row
              label="Giải pháp"
              value={SOLUTION_LABEL[report.solutionType] || String(report.solutionType)}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Mô tả hiện trạng</Text>
            <Text style={styles.paragraph}>{report.description || '-'}</Text>

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Phương án xử lý</Text>
            <Text style={styles.paragraph}>{report.solution || '-'}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Kỹ thuật viên</Text>
            <Text style={styles.paragraph}>
              {report?.technican
                ? `KTV. ${report.technican?.firstName || ''} ${report.technican?.lastName || ''} (${report.technican?.phoneNumber || '-'})`
                : '-'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Hình ảnh đính kèm</Text>
            {medias.length === 0 ? (
              <Text style={{ color: zincColors[500] }}>Không có hình ảnh.</Text>
            ) : (
              <ImagePickerStrip
                mode="view"
                title=""
                items={medias}
                mapUri={(m) => m.filePath}
                mapKey={(m, i) => String(m.mediaId ?? i)}
              />
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value ?? '-'}
      </Text>
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

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: borderColor,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: THEME.text, marginBottom: 8 },
  paragraph: { fontSize: 14, color: THEME.text, lineHeight: 20 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: borderColor,
  },
  rowLabel: { flex: 1, color: zincColors[600], fontWeight: '600' },
  rowValue: { flex: 1.2, textAlign: 'right', color: THEME.text, fontWeight: '700' },
});
