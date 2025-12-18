import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PALETTE = {
  muted:   { bg: '#F3F4F6', fg: '#374151' }, // zinc-100 / zinc-700
  assigned:    { bg: '#007AFF', fg: '#FFFFFF' }, // xanh dương nhạt
  success: { bg: '#EAFBE7', fg: '#0B6B2E' }, // xanh lá nhạt
  warning: { bg: '#FFF7ED', fg: '#B45309' }, // cam nhạt
  danger:  { bg: '#FEF2F2', fg: '#B91C1C' }, // đỏ nhạt
  normal:  { bg: '#007AFF', fg: '#FFFFFF' }, // xanh lá
  emergency: { bg: '#FF3B30', fg: '#FFFFFF' }, // đỏ
  pending: { bg: '#FF9500', fg: '#FFFFFF' }, // cam
  pedingTaskList: { bg: '#FF9500', fg: '#FFFFFF' }, // cam
  notStarted: { bg: '#8E8E93', fg: '#FFFFFF' }, // xám
  inProgress: { bg: '#007AFF', fg: '#FFFFFF' }, // xanh dương
  inVisit : { bg: '#17a100', fg: '#FFFFFF' }, // vô hình
  working : { bg: '#34C759', fg: '#FFFFFF' }, // xám
  inRepair: { bg: '#ffcc00', fg: '#FFFFF' }, // vàng
  confirmed: { bg: '#0A84FF', fg: '#FFFFFF' }, // xanh dương đậm
  awaitingIRApproval: { bg: '#ffcc00', fg: '#FFFFF' }, // cam đậm
  draft: { bg: '#D1D5DB', fg: '#374151' }, // xám nhạt
  internalRepair: { bg: '#ffcc00', fg: '#FFFFF' }, // vàng nhạt
  awaitingPayment: { bg: '#ffcc00', fg: '#FFFFF' }, // vàng nhạt
  scheduling: { bg: '#ffcc00', fg: '#FFFFF' }, // vàng nhạt
  acceptancePendingVerify: { bg: '#ffcc00', fg: '#FFFFF' }, // vàng nhạt
  paid: { bg: '#34C759', fg: '#FFFFFF' }, // xanh lá
  externalContractor: { bg: '#800080', fg: '#FFFFFF' }, // tím
  accessoryPurchase: { bg: '#c7d2fe', fg: '#FFFFF' }, // vàng nhạt
  maintenance: { bg: '#FF69B4', fg: '#FFFFFF' }, // hồng
};

const STATUS_LABEL = {
  Assigned:    'Đã phân công',
  InProgress:  'Đang xử lý',
  Completed:   'Đã hoàn tất',
  CompletedTaskList:   'Đạt',
  Pending:     'Chờ xử lý',
  PedingTaskList: 'Chờ đánh giá',
  Cancelled:   'Đã hủy',
  Failed:      'Không đạt',
  Rejected:    'Từ chối',
  Approved:    'Đã được duyệt',
  New:         'Mới',
  Normal:      'Thường',
  Emergency:   'Khẩn cấp',
  NotStarted:    'Chưa bắt đầu',
  InVisit:     'Đang xem xét',
  InternalRepair: 'Sửa chữa nội bộ',
  InRepair:   'Đang sửa chữa',
  Working:     'Đang trong ca',
  Confirmed:   'Đã xác nhận',
  AwaitingIRApproval: 'Chờ duyệt báo cáo',
  AccessoryPurchase: 'Mua vật liệu',
  Draft : 'Bản nháp',
  AwaitingPayment: 'Chờ thanh toán',
  Scheduling : 'Đang lên lịch',
  AcceptancePendingVerify : 'Chờ nghiệm thu',
  Paid : 'Đã thanh toán',
  ExternalContractor: 'Bên thứ ba',
  Maintenance: 'Bảo trì',
};

function mapStatusToTone(status) {
  switch ((status || '').toString()) {
    case 'Normal':
      return 'normal';
    case 'InVisit':
      return 'inVisit';
    case 'AwaitingIRApproval':
      return 'awaitingIRApproval';
    case 'Working':
      return 'working';
    case 'Confirmed':
      return 'confirmed';
    case 'InRepair':
      return 'inRepair';
    case 'Emergency':
      return 'emergency';
    case 'AwaitingPayment':
      return 'awaitingPayment';
    case 'Scheduling':
      return 'scheduling';
    case 'AcceptancePendingVerify':
      return 'acceptancePendingVerify';
    case 'NotStarted':
      return 'notStarted';
    case 'Completed':
      return 'success';
    case 'CompletedTaskList':
      return 'success';
    case 'Approved':
      return 'success';
    case 'InProgress':
      return 'inProgress';
    case 'Assigned':
      return 'assigned';
    case 'Pending':
      return 'pending';
    case 'PedingTaskList':
      return 'pedingTaskList';
    case 'InternalRepair':
      return 'internalRepair';
    case 'New':
      return 'muted';
    case 'Cancelled':
      return 'cancelled'
    case 'Rejected':
      return 'warning';
    case 'Failed':
      return 'danger';
    case 'Draft':
      return 'draft';
    case 'Paid':
      return 'paid';
    case 'ExternalContractor':
      return 'externalContractor';
    case 'AccessoryPurchase':
      return 'accessoryPurchase';
    case 'Maintenance':
      return 'maintenance';
    default:
      return 'muted';
  }
}

export default function Badge({
  status,
  text = '',
  tone = undefined,       
  uppercase = false,
  style,
  textStyle,
  minWidth = 0,
  maxWidth = 'auto',
}) {
  const rawText =
    (text && text.toString()) ||
    STATUS_LABEL[status] ||
    (status ? status.toString() : 'Status');

  const resolvedTone = tone || mapStatusToTone(status);
  const palette = PALETTE[resolvedTone] || PALETTE.muted;

  const display = uppercase ? rawText.toUpperCase() : rawText;

  return (
    <View style={[styles.badge, { backgroundColor: palette.bg, minWidth, maxWidth }, style]}>
      <Text numberOfLines={1} style={[styles.badgeText, { color: palette.fg }, textStyle]}>
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
