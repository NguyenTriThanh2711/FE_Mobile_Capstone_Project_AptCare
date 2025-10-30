import { Stack } from 'expo-router';

export default function ResidentStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Màn ngoài-tab: request-create */}
      <Stack.Screen
        name="request-create"
        options={{
          title: 'Tạo yêu cầu',
          // presentation: "modal", // hoặc "card"
          headerShown: false, // vì bạn đã tự render header trong file
        }}
      />
      {/* <Stack.Screen name="device/[id]" options={{ headerShown: false }} /> */}
      <Stack.Screen name="request/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
