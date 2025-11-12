import http from '@/src/services/http';

export async function apiGetAppointmentById(id) {
  const res = await http.get(`/api/appointments/${id}`);
  console.log('[apiGetAppointmentById]', res.data)
  return res.data;
}
