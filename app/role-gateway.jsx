// app/role-gateway.jsx
import { Redirect } from "expo-router";

import { roleToEntry } from "@/src/navigation/roleConfig";
import { useAppSelector } from "@/src/store/hooks";


export default function RoleGateway() {
    // const role = useAppSelector(selectUserRole);
    console.log("RoleGateway: role =", role);
    const user = useAppSelector((s) => s.auth.user); 
    const role = user?.role ?? null;
    if (!role) return <Redirect href="/(auth)/login" />;
    const entry = roleToEntry[role] || roleToEntry.resident;
    return <Redirect href={entry} />;
}