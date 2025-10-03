import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
} from "react-native-reanimated";

export default function AuthTabsHeader({
  active = "login",      // 'login' | 'register'
  onLogin = () => {},
  onRegister = () => {},
  radius = 20,
}) {
  const target = active === "login" ? 0 : 1; // 0 = login, 1 = register
  const progress = useSharedValue(target);

  useEffect(() => {
    progress.value = withTiming(target, { duration: 260 });
  }, [target]);

  const leftBg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(230,249,255,0.95)", "rgba(255,255,255,0.65)"] 
    ),
  }));
  const rightBg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(255,255,255,0.65)", "rgba(230,249,255,0.95)"] 
    ),
  }));

  const loginText = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], ["#0EA5E9", "#6B7280"]),
    fontWeight: progress.value < 0.5 ? "700" : "500",
  }));
  const registerText = useAnimatedStyle(() => ({
    color: interpolateColor(progress.value, [0, 1], ["#6B7280", "#0EA5E9"]),
    fontWeight: progress.value > 0.5 ? "700" : "500",
  }));

  return (
    <View
      style={{
        width: "100%",
        borderTopLeftRadius: radius,
        borderTopRightRadius: radius,
        borderBottomLeftRadius: 0,          
        borderBottomRightRadius: 0,
        overflow: "hidden",
        backgroundColor: "rgba(255,255,255,0.2)",
        
        borderBottomWidth: 0,                
        borderColor: "rgba(255,255,255,0.35)",
      }}
    >
      {/* lớp nền chia đôi – nằm dưới (zIndex: 0) */}
      <View className="absolute inset-0 flex-row" style={{ zIndex: 0 }}>
        <Animated.View style={[leftBg, { flex: 1 }]} />
        <Animated.View style={[rightBg, { flex: 1 }]} />
      </View>

      {/* nút – nằm trên (zIndex: 1) */}
      <View className="flex-row" style={{ zIndex: 1 }}>
        <Pressable onPress={onLogin} className="flex-1 py-3 items-center justify-center">
          <Animated.Text style={loginText} className="text-base">
            Đăng nhập
          </Animated.Text>
        </Pressable>
        <Pressable onPress={onRegister} className="flex-1 py-3 items-center justify-center">
          <Animated.Text style={registerText} className="text-base">
            Đăng ký
          </Animated.Text>
        </Pressable>
      </View>
    </View>
  );
}
