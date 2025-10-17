// app/role-gateway.jsx
import { Redirect } from "expo-router";

import { roleToEntry } from "@/src/navigation/roleConfig";
import { useAppSelector } from "@/src/store/hooks";
import {  useSelector } from "react-redux";
import { fetchProfile } from "@/src/features/auth/authSlice";


export default function RoleGateway() {
    // const role = useAppSelector(selectUserRole);
   
    const user = useSelector((s) => s.auth.user);
    console.log("RoleGateway: user =", user);
    if (!user) return <Redirect href="/(auth)/login" />;
    const entry = roleToEntry[user.role] || roleToEntry.Resident;
    return <Redirect href={entry} />;
}