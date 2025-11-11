// src/components/RequestListItem.jsx
import React, { useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { Icon } from '@/src/components/Icon.native';
import { router } from 'expo-router';
import { useAppDispatch } from '@/src/store';
import { setCurrentRequest } from '../features/requests/requestsSlice';
import { dotnetArr } from '../helper/dotnetArr';
import { timeDayDate } from '../utils/date';
import Badge from './Badge';
import { capitalizeFirst } from '../helper/capitalizeFirst';
import { pretty } from '../helper/prettyLog';

const C = {
  text: '#0F172A', // slate-900
  sub: '#64748B', // slate-500
  card: '#FFFFFF',
  line: '#E5E7EB',
  blue: '#0B5ED7',

  // badge emergency/normal
  emBg: '#FEE2E2',
  emFg: '#B91C1C',
  nmBg: '#E6F0FF',
  nmFg: '#0C4A6E',

  // status chips
  pdBg: '#F4F6F8',
  pdFg: '#475569',
  pdBd: '#E5E7EB',
  asBg: '#EEF7FF',
  asFg: '#0A66C2',
  asBd: '#BBD7FF',
  wkBg: '#FFF7ED',
  wkFg: '#C2410C',
  wkBd: '#FED7AA',
  cmBg: '#EAFBE7',
  cmFg: '#2E7D32',
  cmBd: '#B7E4B0',
  ccBg: '#FEF2F2',
  ccFg: '#B91C1C',
  ccBd: '#FECACA',
};

function pillColors(isEmergency) {
  return {
    bg: isEmergency ? C.emBg : C.nmBg,
    fg: isEmergency ? C.emFg : C.nmFg,
    text: isEmergency ? 'Khẩn cấp' : 'Bình thường',
  };
}

function statusTone(statusRaw) {
  const s = String(statusRaw || '').toLowerCase();
  if (['completed', 'done', 'resolved'].includes(s)) {
    return { bg: C.cmBg, fg: C.cmFg, bd: C.cmBd, label: 'Hoàn tất', icon: 'checkmark.circle' };
  }
  if (['assigned'].includes(s)) {
    return { bg: C.asBg, fg: C.asFg, bd: C.asBd, label: 'Đã phân công', icon: 'checkmark.seal' };
  }
  if (['working', 'in_progress', 'inprogress'].includes(s)) {
    return { bg: C.wkBg, fg: C.wkFg, bd: C.wkBd, label: 'Đang xử lý', icon: 'play.circle' };
  }
  if (['cancelled', 'rejected'].includes(s)) {
    return { bg: C.ccBg, fg: C.ccFg, bd: C.ccBd, label: 'Huỷ', icon: 'xmark.circle' };
  }
  return { bg: C.pdBg, fg: C.pdFg, bd: C.pdBd, label: 'Chờ xử lý', icon: 'clock.fill' };
}

export default function RequestListItem({ item }) {
  const swipeRef = useRef(null);
  const dispatch = useAppDispatch();

  // media đầu tiên
  const firstMedia = dotnetArr(item?.medias)?.[0] || null;
  const thumbUrl = firstMedia?.filePath || null;

  // tracking mới nhất
  const latestTracking = dotnetArr(item?.requestTrackings)?.[0] || null;
  //const tone = statusTone(latestTracking?.status);

  // tầng/phòng
  const floorLabel = item?.apartment?.floor != null ? String(item.apartment.floorId) : '-';
  const roomLabel = item?.apartment?.room || '-';

  // appointment sớm nhất
  const startAppointment = dotnetArr(item?.appointments)?.[0]?.startTime;

  const goToDetail = () => {
    dispatch(setCurrentRequest(item));
    router.push({
      pathname: '/(resident)/request/[id]',
      params: { id: String(item?.repairRequestId) },
    });
    swipeRef.current?.close?.();
  };

  const RightActions = ({ progress, dragX }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const trans = interpolate(dragX.value, [-100, 0], [0, 20], Extrapolation.CLAMP);
      return { transform: [{ translateX: trans }] };
    });
    return (
      <View style={s.actionsWrap}>
        <Animated.View style={[s.actionBtn, animatedStyle]}>
          <Pressable style={s.detailBtn} onPress={goToDetail}>
            <Icon name="info.circle.fill" size={18} color="#fff" />
            <Text style={s.detailBtnText}>Chi tiết</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      friction={2}
      rightThreshold={24}
      overshootRight={false}
      renderRightActions={(progress, dragX) => <RightActions progress={progress} dragX={dragX} />}>
      <Pressable onPress={goToDetail} style={s.card}>
        <View style={s.rowTop}>
          <View style={s.leftThumb}>
            {thumbUrl ? (
              <Image
                source={{ uri: thumbUrl }}
                style={s.thumb}
                contentFit="cover"
                transition={80}
              />
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
          <Badge status={(item?.isEmergency == true || item?.issue?.[0]?.isEmergency == true) ? 'Emergency' : 'Normal'} />
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
          {/* <Badge status={latestTracking?.status} /> */}
          <Badge status={item?.status || latestTracking?.status}/>
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
                K/Thuật viên tới: {timeDayDate(startAppointment)}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </Swipeable>
  );
}

const s = StyleSheet.create({
  actionsWrap: { width: 96, justifyContent: 'center', alignItems: 'flex-end' },
  actionBtn: { width: 88, marginRight: 8, borderRadius: 12, overflow: 'hidden' },
  detailBtn: {
    backgroundColor: '#2563EB',
    height: 72,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detailBtnText: { color: '#fff', fontWeight: '800', letterSpacing: 0.2 },

  // card
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.line,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },

  // row top
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

  pillWrap: { marginLeft: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  pillTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.2 },

  issueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  issueTxt: { fontSize: 13, color: C.sub, fontWeight: '600' },

  divider: { height: 1, backgroundColor: C.line, marginVertical: 10, opacity: 0.8 },

  // meta
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusTxt: { fontSize: 12, fontWeight: '800', letterSpacing: 0.2 },

  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaTxt: { fontSize: 12, color: C.sub },
  metaStrong: { color: C.text, fontWeight: '700' },
  arrivalTxt: { color: C.blue, fontWeight: '700' },
});
