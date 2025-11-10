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

//tạo thêm scheme màu sẵn cho button khẩn cấp đồ 
const SCHEMES = {
  normal: ['#6366f1', '#3b82f6'],     
  emergency: ['#ef4444', '#f59e0b'],   
  primary: ['#7c3aed', '#3b82f6'],     
};
// thêm định nghĩa kích thước button
const SIZE_MAP = {
  small: { padV: 10, padH: 14, radius: 12, font: 14, dot: 10, jump: 9 },
  medium: { padV: 14, padH: 18, radius: 14, font: 16, dot: 14, jump: 12 },
  large: { padV: 16, padH: 20, radius: 16, font: 18, dot: 16, jump: 14 },
};
function resolveColor(c) {
  if (!c) return null;
  const key = String(c).toLowerCase();
  return PALETTE[key] || c; // hỗ trợ cả tên trong map và mã hex
}

export default function GradientButton({
  title,
  onPress,
  disabled,
  loading,
  size = 'medium',   
  scheme = 'primary', 
  colors, // VD: ['#FF0000', '#0000FF'] — ƯU TIÊN nếu có
  from, // VD: 'red'
  to, // VD: 'blue'
  disabledColors = ['#cfd8e3', '#cbd5e1'],
  textColor = '#fff',
  className, 
  style, 
}) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.medium;
  //chọn màu theo ưu tiên: colors > from/to > scheme mặc định
  const gradientColors =
    (colors && colors.length === 2 && colors) ||
    ([resolveColor(from), resolveColor(to)].every(Boolean) ? [resolveColor(from), resolveColor(to)] : null) ||
    SCHEMES[scheme] ||
    SCHEMES.primary;

  const finalColors = disabled ? disabledColors : gradientColors;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      className={className ?? ''}
      style={[{ overflow: 'hidden', borderRadius: sizeConfig.radius, alignSelf: 'stretch' }, style]}>
      <LinearGradient
        colors={finalColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ paddingVertical: sizeConfig.padV, paddingHorizontal: sizeConfig.padH, alignItems: 'center' }}>
        {loading ? (
          <BouncingDots size={sizeConfig.dot} jump={sizeConfig.jump} color={textColor} />
        ) : (
          <Text style={{ color: textColor, fontWeight: '700', fontSize: sizeConfig.font }}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
