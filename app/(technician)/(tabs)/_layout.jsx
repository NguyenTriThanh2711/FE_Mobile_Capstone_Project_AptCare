import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
import { selectHasAnyUnread } from '@/src/features/chat/chatSlice';
import { selectNotificationsUnreadCount } from '@/src/features/notifications/notificationsSlice';
export default function TechnicianTabs() {
  const hasUnreadChat = useAppSelector(selectHasAnyUnread);
  const unreadNoti = useAppSelector(selectNotificationsUnreadCount);
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { height: 56, paddingBottom: 6 } }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Hôm nay',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="speedometer" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Lịch làm',
            tabBarIcon: ({ color, size }) => <Ionicons name="hammer" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Tin nhắn',
            tabBarIcon: ({ color, size }) => (
              <Icon name="chat" color={color} size={size} />
            ),
            tabBarBadge: hasUnreadChat ? ' ' : undefined,
            tabBarBadgeStyle: { backgroundColor: '#FF3B30' },
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Thông báo',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications" color={color} size={size} />
            ),
            tabBarBadge: unreadNoti > 0 ? unreadNoti : undefined,
            tabBarBadgeStyle: { backgroundColor: '#FF3B30' },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Hồ sơ',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}