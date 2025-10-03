export const roleToEntry = {
    resident: "/(resident)/home",
    technician: "/(technician)/dashboard",
    // manager: "/(resident)/home", 
    // lead: "/(technician)/dashboard"
};
export const isResident = (role) => role === 'resident';
export const isTechnician = (role) => role === 'technician';