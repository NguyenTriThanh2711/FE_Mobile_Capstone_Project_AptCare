import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon } from "@/src/components/Icon.native"; // đảm bảo đúng path
import ResidentHome from "./home";
// import ResidentRequests from "./requests";
// import ResidentPayments from "./payments";
// import ResidentChat from "./chat";
// import ResidentProfile from "./profile";

const Tab = createBottomTabNavigator();

export default function ResidentLayout() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = "home";
          if (route.name === "home") {
            iconName = focused ? "home.fill" : "home";
          } else if (route.name === "requests") {
            iconName = focused ? "requests.fill" : "requests";
          } else if (route.name === "payments") {
            iconName = focused ? "payments.fill" : "payments";
          } else if (route.name === "chat") {
            iconName = focused ? "chat.fill" : "chat";
          } else if (route.name === "profile") {
            iconName = focused ? "profile.fill" : "profile";
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#007AFF",
        tabBarInactiveTintColor: "#8E8E93",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopWidth: 1,
          borderTopColor: "#e5e5e5",
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "500", marginTop: 4 },
        headerStyle: { backgroundColor: "#007AFF" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      })}
    >
      <Tab.Screen name="home" component={ResidentHome} options={{ title: "Home", headerTitle: "AptCare" }} />
      {/* <Tab.Screen name="requests" component={ResidentRequests} options={{ title: "Requests", headerTitle: "My Requests" }} />
      <Tab.Screen name="payments" component={ResidentPayments} options={{ title: "Payments", headerTitle: "Payments" }} />
      <Tab.Screen name="chat" component={ResidentChat} options={{ title: "Chat", headerTitle: "Messages" }} />
      <Tab.Screen name="profile" component={ResidentProfile} options={{ title: "Profile", headerTitle: "My Profile" }} /> */}
    </Tab.Navigator>
  );
}
