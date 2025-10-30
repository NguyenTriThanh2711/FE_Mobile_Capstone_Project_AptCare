import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  withTiming,
  withRepeat,
  withDelay,
  useAnimatedStyle,
  interpolate,
  Easing,
} from 'react-native-reanimated';

/* ---------- Loader 3 chấm ---------- */
function Dot({ delay = 0, size = 12, jump = 10, duration = 600, color = 'white' }) {
  const t = useSharedValue(0);
  React.useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.quad) }), -1, true)
    );
  }, [delay, duration]);

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

function BouncingDots({ size = 14, jump = 12, color = 'white' }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center' }}>
      <Dot size={size} jump={jump} color={color} delay={0} />
      <Dot size={size} jump={jump} color={color} delay={120} />
      <Dot size={size} jump={jump} color={color} delay={240} />
    </View>
  );
}

/* ---------- Bảng màu tiện dụng (TW-like) ---------- */
const PALETTE = {
  red: '#ef4444',
  orange: '#f59e0b',
  amber: '#f59e0b',
  yellow: '#eab308',
  green: '#22c55e',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#7c3aed',
  purple: '#8b5cf6',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
};

function resolveColor(c) {
  if (!c) return null;
  const key = String(c).toLowerCase();
  return PALETTE[key] || c; // hỗ trợ cả tên trong map và mã hex
}

/* ---------- Nút gradient ---------- */
export default function GradientButton({
  title,
  onPress,
  disabled,
  loading,
  colors, // VD: ['#FF0000', '#0000FF'] — ƯU TIÊN nếu có
  from, // VD: 'red'
  to, // VD: 'blue'
  disabledColors = ['#cfd8e3', '#cbd5e1'],
  textColor = '#fff',
  className, // nếu bạn đang dùng tailwind-rn/NativeWind
  style, // style thường
}) {
  const gradientColors =
    colors && colors.length === 2
      ? colors
      : [resolveColor(from) || '#7C3AED', resolveColor(to) || '#3B82F6'];

  const finalColors = disabled ? disabledColors : gradientColors;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      className={`mt-2 rounded-2xl ${className ?? ''}`}
      style={[{ overflow: 'hidden' }, style]}>
      <LinearGradient
        colors={finalColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingVertical: 16, paddingHorizontal: 18, alignItems: 'center' }}>
        {loading ? (
          <BouncingDots size={14} jump={12} color={textColor} />
        ) : (
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
