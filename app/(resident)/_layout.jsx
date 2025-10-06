import { Stack } from "expo-router";

export default function ResidentStackLayout() {
  return (
    <Stack>
      {/* Toàn bộ tab nằm trong group (tabs) */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      {/* Màn ngoài-tab: request-create */}
      <Stack.Screen
        name="request-create"
        options={{
          title: "Tạo yêu cầu",
          presentation: "modal", // hoặc "card"
          headerShown: false,     // vì bạn đã tự render header trong file
        }}
      />

      {/* Nếu có các màn khác ngoài tab, add tương tự */}
      <Stack.Screen name="request" options={{ headerShown: false }} />
    </Stack>
  );
}
