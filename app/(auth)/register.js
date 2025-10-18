import { useForm, Controller } from "react-hook-form";
import { View, Text, TextInput, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { router } from "expo-router";
import { useDispatch } from "react-redux";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, interpolateColor } from "react-native-reanimated";
import AuthTabsHeader from "@/src/components/AuthTabsHeader";
import React from "react";
import MUITextField from "@/src/components/common/MUITextField";
import { register as authRegister } from "@/src/features/auth/authSlice";

const schema = yup.object({
  email: yup.string().trim().email("Email không hợp lệ").required("Vui lòng nhập email"),
  password: yup.string().min(6, "Tối thiểu 6 ký tự").required("Vui lòng nhập mật khẩu"),
});

export default function Register() {
  const dispatch = useDispatch();

  const { control, handleSubmit, formState: { errors, isSubmitting },getValues } = useForm({
    defaultValues: {  email: "", password: "" },
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  // progress cho nền card: 1 vì đang ở Register
  const progress = useSharedValue(1);
  React.useEffect(() => { progress.value = withTiming(1, { duration: 280 }); }, []);
  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ["rgba(255,255,255,0.92)", "rgba(230,249,255,0.95)"]),
  }));

  const onSubmit = async (values) => {
    const payload = {  email: values.email, password: values.password };
    try {
      console.log('press register')
      const res = await dispatch(authRegister(payload)).unwrap();
      console.log('registerPage: res authRegister =', res);
      if (res?.otpSent) {
        const email = encodeURIComponent(getValues("email"));
        const accountId = encodeURIComponent(String(res.accountId ?? ""));
        router.replace(`/(auth)/verify-otp?email=${email}&accountId=${accountId}`);
      } else {
        // fallback: quay về login nếu không có otp (ít gặp)
        router.replace("/(auth)/login");
      }
    } catch (e) {
      console.log('registerPage: error =', e);
      Alert.alert(e || e?.message || "Vui lòng kiểm tra lại thông tin.");
      return;
    }
  };

  const Field = ({
    name,
    label,
    placeholder,
    secure = false,
    keyboardType,
    startIcon,           // "email-outline", "phone-outline", ...
    endIcon,
    variant = "outlined", // "outlined" | "filled"
    size = "medium",      // "small" | "medium"
    style,
  }) => (
    <View className="mb-3">
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <MUITextField
            label={label}
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={secure}
            keyboardType={keyboardType}
            startIcon={startIcon}
            endIcon={endIcon}
            variant={variant}
            size={size}
            autoCapitalize={name === "email" ? "none" : "words"}
            error={!!errors[name]}
            helperText={errors[name]?.message}
            style={style}
          />
        )}
      />
    </View>
  );

  return (
    <ImageBackground source={require("@/assets/building.jpg")} resizeMode="cover" className="flex-1">
      <View className="absolute inset-0 bg-black/30" />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 pt-10">
          <View className="mt-6">
            <Text className="text-white/90 text-2xl font-bold">AptCare</Text>
            <Text className="text-white/80 mt-1">Tạo tài khoản</Text>
          </View>

          <View className="flex-1 justify-center">
            <AuthTabsHeader
              active="register"
              onLogin={() => router.replace("/(auth)/login")}
              onRegister={() => {/* stay */}}
            />
              <Animated.View style={cardStyle} className="rounded-b-3xl p-6 shadow-lg">
                <Field name="email" label="Email" placeholder="you@domain.com" keyboardType="email-address" />
                <Field name="password" label="Mật khẩu" placeholder="••••••••" secure />
                <Field name="confirmPassword" label="Nhập lại mật khẩu" placeholder="••••••••" secure />

                <TouchableOpacity disabled={isSubmitting} onPress={handleSubmit(onSubmit)} className={`rounded-2xl bg-blue-700 py-4 mt-2 ${isSubmitting ? "bg-gray-300" : "bg-primary"}`}>
                  <Text className="text-white text-center font-semibold text-base">
                    {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
          </View>

          <View className="items-center mb-6">
            <Text className="text-white/80 text-xs">© {new Date().getFullYear()} AptCare</Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
