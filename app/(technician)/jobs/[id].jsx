import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import http from '@/src/services/http';

export default function JobDetail() {
  const { id } = useLocalSearchParams();
  const [job, setJob] = useState(null);
  const [progressNote, setProgressNote] = useState('');
  const [inspection, setInspection] = useState('');
  const [completion, setCompletion] = useState('');
  const [orderNote, setOrderNote] = useState('');

  const load = async () => {
    const { data } = await http.get(`/tech/jobs/${id}`);
    setJob(data);
  };

  useEffect(() => { load(); }, [id]);

  if (!job) return null;

  return (
    <View className="flex-1 p-4 gap-3">
      <Text className="text-xl font-bold">{job.title}</Text>
      <Text className="text-gray-600">{job.description}</Text>

      {/* FE-03 Update progress */}
      <Text className="mt-3 font-semibold">Cập nhật tiến độ</Text>
      <TextInput className="border rounded-xl p-3" value={progressNote} onChangeText={setProgressNote} />
      <TouchableOpacity
        className="bg-primary rounded-xl p-3"
        onPress={async () => { await http.post(`/tech/jobs/${id}/progress`, { note: progressNote }); Alert.alert('Đã cập nhật'); load(); }}
      >
        <Text className="text-white text-center">Lưu tiến độ</Text>
      </TouchableOpacity>

      {/* FE-04 Inspections */}
      <Text className="mt-3 font-semibold">Biên bản kiểm tra</Text>
      <TextInput className="border rounded-xl p-3" value={inspection} onChangeText={setInspection} />
      <View className="flex-row gap-2">
        <TouchableOpacity className="bg-secondary rounded-xl p-3 flex-1" onPress={async () => { await http.post(`/tech/jobs/${id}/inspection`, { text: inspection }); Alert.alert('Đã tạo'); load(); }}>
          <Text className="text-white text-center">Tạo/Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-danger rounded-xl p-3 flex-1" onPress={async () => { await http.delete(`/tech/jobs/${id}/inspection`); Alert.alert('Đã xoá'); load(); }}>
          <Text className="text-white text-center">Xóa</Text>
        </TouchableOpacity>
      </View>

      {/* FE-05 Completion report */}
      <Text className="mt-3 font-semibold">Biên bản hoàn thành</Text>
      <TextInput className="border rounded-xl p-3" value={completion} onChangeText={setCompletion} />
      <View className="flex-row gap-2">
        <TouchableOpacity className="bg-success rounded-xl p-3 flex-1" onPress={async () => { await http.post(`/tech/jobs/${id}/completion`, { text: completion }); Alert.alert('Đã lưu'); load(); }}>
          <Text className="text-white text-center">Tạo/Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity className="bg-danger rounded-xl p-3 flex-1" onPress={async () => { await http.delete(`/tech/jobs/${id}/completion`); Alert.alert('Đã xoá'); load(); }}>
          <Text className="text-white text-center">Xóa</Text>
        </TouchableOpacity>
      </View>

      {/* FE-06 Orders */}
      <Text className="mt-3 font-semibold">Đơn hàng / Vật tư</Text>
      <TextInput className="border rounded-xl p-3" value={orderNote} onChangeText={setOrderNote} placeholder="Thêm vật tư, chi phí..." />
      <TouchableOpacity className="bg-secondary rounded-xl p-3" onPress={async () => { await http.post(`/tech/jobs/${id}/orders`, { note: orderNote }); Alert.alert('Đã cập nhật đơn hàng'); load(); }}>
        <Text className="text-white text-center">Lưu đơn hàng</Text>
      </TouchableOpacity>
    </View>
  );
}
