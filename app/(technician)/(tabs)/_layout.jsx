import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '@/src/store';
import { Icon } from '@/src/components/Icon.native';
export default function TechnicianTabs() {
  // const hasUnread = useAppSelector(selectHasAnyUnread);
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { height: 56, paddingBottom: 6 } }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="speedometer" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, size }) => <Ionicons name="hammer" color={color} size={size} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Tin nhắn',
            tabBarIcon: ({ color, size }) => <Icon name="chat" color={color} size={size} />,
            // tabBarBadge: hasUnread ? ' ' : undefined,
            tabBarBadgeStyle: { backgroundColor: '#FF3B30' },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}