import { dotnetArr } from '@/src/helper/dotnetArr';

export function transformAppointment(api) {
  if (!api) return null;
  const appt = {
    appointmentId: api.appointmentId,
    startTime: api.startTime,
    endTime: api.endTime,
    note: api.note || '',
    status: api.status,
    createdAt: api.createdAt,

    technicians: dotnetArr(api.technicians).map((t) => ({
      userId: t.userId,
      firstName: t.firstName,
      lastName: t.lastName,
      phoneNumber: t.phoneNumber,
      email: t.email,
    })),

    repairRequest: api.repairRequest
      ? {
          repairRequestId: api.repairRequest.repairRequestId,
          object: api.repairRequest.object,
          description: api.repairRequest.description,
          isEmergency: api.repairRequest.isEmergency,
          createdAt: api.repairRequest.createdAt,
          apartment: api.repairRequest.apartment
            ? {
                apartmentId: api.repairRequest.apartment.apartmentId,
                floorId: api.repairRequest.apartment.floorId,
                roomNumber:
                  api.repairRequest.apartment.room || api.repairRequest.apartment.roomNumber || '-',
                description: api.repairRequest.apartment.description,
                status: api.repairRequest.apartment.status,
              }
            : null,
        }
      : null,
  };
  return appt;
}
