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
      <Stack.Screen
        name="report-create"
        options={{
          title: 'Tạo báo cáo',
          headerShown: false, 
        }}
      />
      <Stack.Screen
        name="select-common-area"
        options={{
          title: 'Chọn khu vực chung',
          headerShown: false, 
        }}
      />
      <Stack.Screen
        name="my-reports"
        options={{
          title: 'Báo cáo của tôi',
          headerShown: false, 
        }}
      />
      {/* <Stack.Screen name="device/[id]" options={{ headerShown: false }} /> */}
      <Stack.Screen name="request/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="report/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="repairReport/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen
        name="support/index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="support/policies"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
