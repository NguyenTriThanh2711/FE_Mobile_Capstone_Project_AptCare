import { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import http from '@/src/services/http';

import { useState } from 'react';
export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  useEffect(() => {
    (async () => {
      const { data } = await http.get('/tech/jobs/assigned');
      setJobs(data);
    })();
  }, []);

  return (
    <View className="flex-1 p-4">
      <FlatList
        data={jobs}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mb-3 rounded-2xl bg-white p-4 shadow"
            onPress={() => router.push(`/(technician)/jobs/${item.id}`)}>
            <Text className="font-semibold">{item.title}</Text>
            <Text className="text-gray-600">{item.location}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
