import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '@/src/components/Icon.native'; // đảm bảo đúng path
import { LinearGradient } from 'expo-linear-gradient';
import ResidentHome from './home';
import ResidentRequests from './requests';
import ResidentProfile from './profile';
import ResidentDevices from './devices';
import ResidentChat from './chat';
// import ResidentPayments from "./payments";
// import ResidentChat from "./chat";

const Tab = createBottomTabNavigator();

export default function ResidentTabsLayout() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === 'home') {
            iconName = focused ? 'home.fill' : 'home';
          } else if (route.name === 'requests') {
            iconName = focused ? 'requests.fill' : 'requests';
          } else if (route.name === 'payments') {
            iconName = focused ? 'payments.fill' : 'payments';
            // } else if (route.name === "devices") {
            //   iconName = focused ? "flashlight.off.fill" : "flashlight.off";
          } else if (route.name === 'chat') {
            iconName = focused ? 'chat.fill' : 'chat';
          } else if (route.name === 'profile') {
            iconName = focused ? 'profile.fill' : 'profile';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500', marginTop: 4 },
        headerStyle: { height: 100 },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerBackground: () => {
          const map = {
            home: ['#7C3AED', '#3B82F6'],
            requests: ['#8B5CF6', '#06B6D4'],
            payments: ['#EC4899', '#8B5CF6'],
            chat: ['#22C55E', '#3B82F6'],
            profile: ['#F59E0B', '#EF4444'],
          };
          const colors = map[route.name] ?? ['#7C3AED', '#3B82F6'];
          return (
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          );
        }, // headerBackground// có thể để sau này vuốt qua vuốt lại header cũng đổi màu theo tab
      })}>
      <Tab.Screen
        name="home"
        component={ResidentHome}
        options={{ title: 'Trang chủ', headerTitle: 'AptCare' }}
      />
      <Tab.Screen
        name="requests"
        component={ResidentRequests}
        options={{ title: 'Yêu cầu', headerTitle: 'AptCare - Tower' }}
      />
      {/*<Tab.Screen name="devices" component={ResidentDevices} options={{ title: "Thiết bị", headerTitle: "AptCare - Thiết bị" }} />
       <Tab.Screen name="payments" component={ResidentPayments} options={{ title: "Payments", headerTitle: "Payments" }} />*/}
      <Tab.Screen
        name="chat"
        component={ResidentChat}
        options={{ title: 'Tin nhắn', headerTitle: 'Messages' }}
      />
      <Tab.Screen
        name="profile"
        component={ResidentProfile}
        options={{ title: 'Hồ sơ', headerTitle: 'Hồ sơ của tôi' }}
      />
    </Tab.Navigator>
  );
}
