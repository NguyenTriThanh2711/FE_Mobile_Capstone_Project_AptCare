import { View, Text } from 'react-native';
export default function Dashboard() {
  return (
    <View className="flex-1 p-4 gap-3">
      <Text className="text-2xl font-bold">Lịch hôm nay</Text>
      <Text className="text-gray-600">Tổng job, job đang làm, job trễ hạn…</Text>
    </View>
  );
}
