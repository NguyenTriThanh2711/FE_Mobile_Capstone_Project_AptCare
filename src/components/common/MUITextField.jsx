import * as React from "react";
import { View } from "react-native";
import {
  TextInput as PaperInput,
  HelperText,
  useTheme,
} from "react-native-paper";

export default function MUITextField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  variant = "outlined",   // "outlined" | "filled"
  size = "medium",        // "small" | "medium"
  error,
  helperText,
  disabled,
  keyboardType,
  secureTextEntry,
  startIcon,
  endIcon,
  rightOnPress,
  maxLength,
  multiline,
  numberOfLines,
  style,
}) {
  const theme = useTheme();
  const [showPwd, setShowPwd] = React.useState(false);
  const isPassword = !!secureTextEntry;

  const height = size === "small" ? 44 : 52;
  const contentStyle = { minHeight: height, height };

  const left = startIcon ? <PaperInput.Icon icon={startIcon} /> : undefined;

  const right = isPassword ? (
    <PaperInput.Icon
      icon={showPwd ? "eye-off-outline" : "eye-outline"}
      onPress={() => setShowPwd((v) => !v)}
    />
  ) : endIcon ? (
    <PaperInput.Icon icon={endIcon} onPress={rightOnPress} />
  ) : undefined;

  return (
    <View style={style}>
      <PaperInput
        mode={variant === "filled" ? "flat" : "outlined"}
        label={label}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        error={!!error}
        disabled={disabled}
        keyboardType={keyboardType}
        secureTextEntry={isPassword && !showPwd}
        left={left}
        right={right}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={numberOfLines}
        contentStyle={contentStyle}
        outlineStyle={variant === "outlined" ? { borderRadius: 8 } : undefined}
        style={{
          backgroundColor:
            variant === "filled"
              ? (theme.colors?.backdrop || "#000") + "11"
              : undefined,
        }}
      />
      {!!helperText && (
        <HelperText type={error ? "error" : "info"} visible>
          {helperText}
        </HelperText>
      )}
    </View>
  );
}
