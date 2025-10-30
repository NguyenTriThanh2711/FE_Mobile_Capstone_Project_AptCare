import { View, Text } from 'react-native';

const map = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }) {
  const klass = map[status] || 'bg-gray-100 text-gray-800';
  return (
    <View className={`rounded-full px-3 py-1 ${klass}`}>
      <Text className="text-xs font-semibold capitalize">{status?.replace('_', ' ')}</Text>
    </View>
  );
}
