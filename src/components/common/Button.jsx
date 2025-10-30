import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useColorScheme } from 'react-native';
import PropTypes from 'prop-types';
import { appleBlue, zincColors } from '@/src/utils/colors';

function Button({
  onPress,
  variant = 'filled',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  style,
  textStyle,
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const sizeStyles = {
    sm: { height: 36, fontSize: 14, padding: 12 },
    md: { height: 44, fontSize: 16, padding: 16 },
    lg: { height: 55, fontSize: 18, padding: 20 },
  };

  const getVariantStyle = () => {
    const baseStyle = {
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: isDark ? zincColors[50] : zincColors[900],
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDark ? zincColors[700] : zincColors[300],
        };
      case 'ghost':
      default:
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return isDark ? zincColors[500] : zincColors[400];

    switch (variant) {
      case 'filled':
        return isDark ? zincColors[900] : zincColors[50];
      case 'outline':
      case 'ghost':
      default:
        return appleBlue;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        getVariantStyle(),
        {
          height: sizeStyles[size].height,
          paddingHorizontal: sizeStyles[size].padding,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text
          style={StyleSheet.flatten([
            {
              fontSize: sizeStyles[size].fontSize,
              color: getTextColor(),
              textAlign: 'center',
              marginBottom: 0,
              fontWeight: '700',
            },
            textStyle,
          ])}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}

Button.propTypes = {
  onPress: PropTypes.func,
  variant: PropTypes.oneOf(['filled', 'outline', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired,
  style: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  textStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default Button;
