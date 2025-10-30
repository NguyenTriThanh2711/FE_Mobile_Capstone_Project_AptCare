export function getOrderTypeLabel(order) {
  const raw = (order?.type || order?.kind || order?.orderType || '').toString().toLowerCase();

  if (raw === 'repair') return 'Sửa chữa';
  if (raw === 'inspection') return 'Khảo sát';
  if (raw === 'maintenance') return 'Bảo trì';
  return 'Cuộc hẹn';
}
