export const roleToEntry = {
    resident: "/(resident)/(tabs)/home",
    technician: "/(technician)/(tabs)/dashboard",
    // manager: "/(resident)/home", 
    // lead: "/(technician)/dashboard"
};
export const isResident = (role) => role === 'resident';
export const isTechnician = (role) => role === 'technician';