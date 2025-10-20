import React from "react";
import { View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/** Chấm nhảy đơn lẻ */
function Dot({ delay = 0, size = 12, jump = 10, duration = 600, color = "white" }) {
  const t = useSharedValue(0);

  React.useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }),
        -1, // vô hạn
        true // auto-reverse
      )
    );
  }, [delay, duration, t]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(t.value, [0, 0.5, 1], [0, -jump, 0]) }],
    opacity: interpolate(t.value, [0, 0.5, 1], [0.6, 1, 0.6]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          marginHorizontal: 5,
        },
        style,
      ]}
    />
  );
}

/** Loader 3 chấm nhảy */
export default function BouncingDots({
  size = 14,
  jump = 12,
  color = "white",
  accessibilityLabel = "Đang tải",
}) {
  return (
    <View
      style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "center" }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
    >
      <Dot size={size} jump={jump} color={color} delay={0} />
      <Dot size={size} jump={jump} color={color} delay={120} />
      <Dot size={size} jump={jump} color={color} delay={240} />
    </View>
  );
}
