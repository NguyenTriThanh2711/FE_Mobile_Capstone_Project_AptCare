import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '@/src/components/Icon.native';
import Badge from './Badge';
import { dotnetArr } from '../helper/dotnetArr';
import { timeDayDate } from '../utils/date';
import { capitalizeFirst } from '../helper/capitalizeFirst';
import { router } from 'expo-router';

const C = {
  text: '#0F172A',
  sub: '#64748B',
  card: '#FFFFFF',
  line: '#E5E7EB',
  blue: '#0B5ED7',
};

export default function RequestPreviewCard({
  item,
  title = 'Yêu cầu gốc',
  onPress, // optional
}) {
  const firstMedia = useMemo(() => dotnetArr(item?.medias)?.[0] || null, [item]);
  const thumbUrl = firstMedia?.filePath || null;

  const latestTracking = useMemo(() => dotnetArr(item?.requestTrackings)?.[0] || null, [item]);
  const startAppointment = useMemo(() => dotnetArr(item?.appointments)?.[0]?.startTime, [item]);

  const floorLabel = item?.apartment?.floor != null ? String(item?.apartment?.floorId) : '-';
  const roomLabel = item?.apartment?.room || '-';

  const isEmergency = item?.isEmergency == true || item?.issue?.[0]?.isEmergency == true;

  const handlePress = () => {
    if (onPress) return onPress();
    if (item?.repairRequestId) {
      router.push({
        pathname: '/(resident)/request/[id]',
        params: { id: String(item.repairRequestId) },
      });
    }
  };

  return (
    <Pressable onPress={handlePress} style={s.wrap}>
      <View style={s.headerRow}>
        <Icon name="note-text-outline" size={14} color={C.sub} />
        <Text style={s.headerTxt}>{title}</Text>
      </View>

      <View style={s.card}>
        <View style={s.rowTop}>
          <View style={s.leftThumb}>
            {thumbUrl ? (
              <Image source={{ uri: thumbUrl }} style={s.thumb} contentFit="cover" transition={80} />
            ) : (
              <View style={[s.thumb, s.thumbFallback]}>
                <Icon name="photo" size={16} color="#94A3B8" />
              </View>
            )}
          </View>

          <View style={s.titleWrap}>
            <Text style={s.title} numberOfLines={1}>
              {capitalizeFirst(item?.object) || '-'}
            </Text>
            {!!item?.description && (
              <Text style={s.desc} numberOfLines={2}>
                {capitalizeFirst(item?.description) || '-'}
              </Text>
            )}
          </View>

          <Badge status={isEmergency ? 'Emergency' : 'Normal'} />
        </View>

        {!!item?.issue?.name && (
          <View style={s.issueRow}>
            <Icon name="wrench.and.screwdriver" size={14} color={C.sub} />
            <Text style={s.issueTxt} numberOfLines={1}>
              Vấn đề: {item.issue.name}
            </Text>
          </View>
        )}

        <View style={s.divider} />

        <View style={s.metaRow}>
          <Badge status={item?.status || latestTracking?.status} />
          <View style={s.metaItem}>
            <Icon name="calendar" size={14} color={C.sub} />
            <Text style={s.metaTxt}>Đã tạo: {timeDayDate(item?.createdAt)}</Text>
          </View>

          <View style={s.metaItem}>
            <Icon name="building.2" size={14} color={C.blue} />
            <Text style={[s.metaTxt, s.metaStrong]}>
              Tầng {floorLabel} • Phòng.{roomLabel}
            </Text>
          </View>
        </View>

        {startAppointment && (
          <View style={[s.metaRow, { marginTop: 6 }]}>
            <View style={s.metaItem}>
              <Icon name="calendar" size={14} color={C.blue} />
              <Text style={[s.metaTxt, s.arrivalTxt]}>
                Kỹ thuật viên tới: {timeDayDate(startAppointment)}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginTop: 8, marginBottom: 8 },
  headerTxt: { fontSize: 12, color: C.sub, fontWeight: '700' },

  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  leftThumb: { width: 40, height: 40 },
  thumb: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#E5E7EB' },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.line,
  },

  titleWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '800', color: C.text },
  desc: { marginTop: 2, fontSize: 13, color: C.sub, lineHeight: 18 },

  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  issueTxt: { fontSize: 13, color: C.sub, fontWeight: '600' },

  divider: { height: 1, backgroundColor: C.line, marginVertical: 10, opacity: 0.8 },

  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 12, color: C.sub },
  metaStrong: { color: C.text, fontWeight: '700' },
  arrivalTxt: { color: C.text, fontWeight: '700' },
});
