import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/src/components/Icon.native';
import { useAppSelector } from '@/src/store';
import { selectNotificationsUnreadCount } from '@/src/features/notifications/notificationsSlice';

import ResidentHome from './home';
import ResidentRequests from './requests';
import ResidentProfile from './profile';
import ResidentChat from './chat';
import ResidentScheduleScreen from './appointment';
import ResidentNotificationsScreen from './notifications';
import { selectTotalUnreadMessages } from '@/src/features/chat/chatSlice';

const Tab = createBottomTabNavigator();

export default function ResidentTabsLayout() {
  const unreadNoti = useAppSelector(selectNotificationsUnreadCount);
  const unreadChat = useAppSelector(selectTotalUnreadMessages);
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
          } else if (route.name === 'chat') {
            iconName = focused ? 'chat.fill' : 'chat';
          } else if (route.name === 'profile') {
            iconName = focused ? 'profile.fill' : 'profile';
          } else if (route.name === 'schedule') {
            iconName = 'calendar';
          } else if (route.name === 'notifications') {
            iconName = focused ? 'bell.fill' : 'bell';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarBadge:
          route.name === 'notifications' && unreadNoti > 0
            ? unreadNoti
            : route.name === 'chat' && unreadChat > 0
            ? unreadChat
            : undefined,

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
            schedule: ['#6366F1', '#0EA5E9'],
            notifications: ['#F97316', '#EF4444'], 
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
        },
      })}
    >
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
      <Tab.Screen
        name="schedule"
        component={ResidentScheduleScreen}
        options={{ title: 'Lịch', headerTitle: 'Lịch của tôi' }}
      />
      <Tab.Screen
        name="chat"
        component={ResidentChat}
        options={{ title: 'Tin nhắn', headerTitle: 'Messages' }}
      />
      <Tab.Screen
        name="notifications"
        component={ResidentNotificationsScreen}
        options={{ title: 'Thông báo', headerTitle: 'Thông báo' }}
      />
      <Tab.Screen
        name="profile"
        component={ResidentProfile}
        options={{ title: 'Hồ sơ', headerTitle: 'Hồ sơ của tôi' }}
      />
    </Tab.Navigator>
  );
}
