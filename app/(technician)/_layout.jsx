import { Stack } from 'expo-router';

export default function TechnicianStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="appointment/[id]"
        options={{
          presentation: 'modal',
          gestureEnabled: true,
          fullScreenGestureEnabled: false, // có thể bật true nếu muốn swipe toàn màn
          animation: 'slide_from_bottom', // Android: mượt hơn
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="inspectReport-create"
        options={{
          title: 'Tạo báo cáo khảo sát',
          // presentation: "modal", // hoặc "card"
          headerShown: false, // vì bạn đã tự render header trong file
        }}
      />
      <Stack.Screen
        name="inspectionReport/[id]"
        options={{
          title: 'Chi tiết báo cáo',
          headerShown: false, // vì bạn đã tự render header trong file
        }}
      />
      <Stack.Screen
        name="invoice-create"
        options={{
          title: 'Tạo hóa đơn',
          headerShown: false, // vì bạn đã tự render header trong file
        }}
      />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
