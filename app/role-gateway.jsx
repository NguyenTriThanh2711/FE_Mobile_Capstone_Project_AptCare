// app/role-gateway.jsx
import { Redirect } from "expo-router";

import { roleToEntry } from "@/src/navigation/roleConfig";
import { useAppSelector } from "@/src/store/hooks";


export default function RoleGateway() {
    //const role = useAppSelector(selectUserRole);
    const role = 'resident'; // tạm hardcode để test giao diện
    if (!role) return <Redirect href="/(auth)/login" />;
    const entry = roleToEntry[role] || roleToEntry.resident;
    return <Redirect href={entry} />;
}