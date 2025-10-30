export const roleToEntry = {
  Resident: '/(resident)/(tabs)/home',
  Technician: '/(technician)/(tabs)/dashboard',
  // manager: "/(resident)/home",
  // lead: "/(technician)/dashboard"
};
export const isResident = (role) => role === 'Resident';
export const isTechnician = (role) => role === 'Technician';
