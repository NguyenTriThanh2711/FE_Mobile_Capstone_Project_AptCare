import React, { memo } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Icon } from '@/src/components/Icon.native';
import { capitalizeFirst } from '../helper/capitalizeFirst';
import Badge from './Badge';

const colors = {
  primary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  text: '#111827',
  textSecondary: '#6B7280',
  white: '#FFFFFF',
  border: '#E5E7EB',
};


function fmtHM(iso) {
  if (!iso) return '-';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

function Pill({ icon, children }) {
  return (
    <View style={sx.pill}>
      {icon ? <Icon name={icon} size={14} color={colors.primary} /> : null}
      <Text style={sx.pillTxt} numberOfLines={1}>
        {children}
      </Text>
    </View>
  );
}

/**
 * AppointmentCard (flat)
 * - KHÔNG vẽ box bên trong
 * - Để parent bọc box (mỗi appointment 1 box riêng)
 */
function AppointmentCard({ appt, onPress }) {
  const status = appt?.status || 'New';
  const emergency = appt?.repairRequest?.isEmergency ? 'Emergency' : 'Normal';
  const room = appt?.repairRequest?.apartment?.room || '-';
  const floor = appt?.repairRequest?.apartment?.floor ?? '-';
  const resident = appt?.repairRequest?.apartment?.users || {};
  const residentName =
    resident?.firstName || resident?.lastName
      ? `${resident?.firstName || ''} ${resident?.lastName || ''}`.trim()
      : '-';
  const residentPhone = appt?.repairRequest?.apartment?.users?.phoneNumber || '-';
  const timeLabel = `${fmtHM(appt?.startTime)}${appt?.endTime ? ` - ${fmtHM(appt.endTime)}` : ''}`;
  const title =  appt?.repairRequest?.object || appt?.object || 'Cuộc hẹn';
  const openDetail = () => {
    if (onPress) return onPress();
    const id = appt?.repairRequestId ?? appt?.appointmentId;
    if (id) router.push(`/appointment/${id}`);
  };

  return (
    <Pressable
      onPress={openDetail}
      style={({ pressed }) => [sx.wrap, pressed && { opacity: 0.95 }]}>
      {/* Top: Time + Status */}
      <View style={sx.topRow}>
        <View style={sx.timePill}>
          <Icon name="clock" size={14} color={colors.primary} />
          <Text style={sx.timeTxt}>{timeLabel}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Badge status={emergency} />
          <Badge status={status} style={[sx.statusChip]} />
        </View>
      </View>

      {/* Title */}
      <View style={sx.titleRow}>
        <View style={sx.thumb}>
          <Icon name="wrench.and.screwdriver" size={18} color="#fff" />
        </View>
        <Text style={sx.title} numberOfLines={1}>
          {capitalizeFirst(title)}
        </Text>
      </View>

      {/* Meta row */}
      <View style={sx.metaRow}>
        <Pill icon="building.2">Căn hộ {room}</Pill>
        {floor !== undefined && floor !== null ? (
          <Pill icon="list.number">Tầng {String(floor)}</Pill>
        ) : null}
        {!!appt?.appointmentId && <Pill icon="number">{`IdCH: ${appt.appointmentId}`}</Pill>}
      </View>

      {/* Resident */}
      {(residentName || residentPhone) && (
        <View style={sx.residentBlock}>
          
          {residentName ? (
            <>
              <Text style={sx.residentName} numberOfLines={1}>
                <Icon name="person" size={14} color={colors.textSecondary} /> {' '+residentName}
              </Text>
            </>
          ) : null}
          {residentPhone ? (
            <View style={sx.phoneRow}>
              <Icon name="phone" size={14} color={colors.textSecondary} />
              <Text style={sx.phoneTxt}>{' '+residentPhone}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* Note */}
      {!!appt?.note && (
        <View style={sx.noteRow}>
          <Icon name="doc.text" size={14} color={colors.textSecondary} />
          <Text style={sx.noteTxt} numberOfLines={2}>
            {appt.note}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const sx = StyleSheet.create({
  wrap: {
    /* flat, parent lo box */
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EAF2FF',
    borderWidth: 1,
    borderColor: '#D6E5FF',
  },
  timeTxt: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  statusTxt: { fontSize: 12, fontWeight: '800' },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  thumb: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },

  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFF',
  },
  pillTxt: { fontSize: 12, fontWeight: '700', color: colors.primary },

  residentBlock: { marginTop: 8 },
  residentName: { fontSize: 13, fontWeight: '700', color: colors.text },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  phoneTxt: { fontSize: 12, color: colors.textSecondary },

  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8 },
  noteTxt: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
});

export default memo(AppointmentCard);
