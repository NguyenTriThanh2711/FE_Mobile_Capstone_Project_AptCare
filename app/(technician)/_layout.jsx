import { Stack } from "expo-router";

export default function TechnicianStackLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="appointment/[id]"
        options={{
          presentation: "modal",          
          gestureEnabled: true,
          fullScreenGestureEnabled: false, // có thể bật true nếu muốn swipe toàn màn
          animation: "slide_from_bottom",  // Android: mượt hơn
          headerShown: false,
        }}
      />
    </Stack>
  );
}
