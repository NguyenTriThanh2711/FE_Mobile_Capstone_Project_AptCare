import { pretty } from '@/src/helper/prettyLog';
import http from '@/src/services/http';

export async function apiGetAppointmentById(id) {
  const res = await http.get(`/api/appointments/${id}`);
  console.log('[apiGetAppointmentById]', pretty(res.data));
  return res.data;
}
