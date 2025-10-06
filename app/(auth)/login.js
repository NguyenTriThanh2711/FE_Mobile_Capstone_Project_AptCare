import { useForm, Controller } from "react-hook-form";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { useDispatch } from "react-redux";
import { router, Link } from "expo-router";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, interpolateColor } from "react-native-reanimated";
import AuthTabsHeader from "@/src/components/AuthTabsHeader";
import React from "react";
import { login as authLogin } from "@/src/features/auth/authSlice";
import MUITextField from "@/src/components/common/MUITextField";

export default function Login() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });
  // Animation
  // const progress = useSharedValue(0);
  // const cardStyle = useAnimatedStyle(() => ({
  //   backgroundColor: interpolateColor(progress.value, [0, 1], ["rgba(255,255,255,0.92)", "rgba(240,249,255,0.95)"]),
  // }));

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: "rgba(230,249,255,0.95)",
  }));

  // React.useEffect(() => { progress.value = withTiming(0, { duration: 280 }); }, []);
  const dispatch = useDispatch();
  const onSubmit = async (values) => {
    const ok = await dispatch(authLogin(values)).unwrap().catch(() => false);
    if (ok) router.replace("/role-gateway");
  };
  const Field = ({
    name,
    label,
    placeholder,
    secure = false,
    keyboardType,
    startIcon,
    variant = "outlined",
    size = "medium",
    rules,
    style,
  }) => (
    <View className="mb-3">
      <Controller
        control={control}
        name={name}
        rules={rules}
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
            variant={variant}
            size={size}
            autoCapitalize={name === "email" ? "none" : "none"}
            error={!!errors[name]}
            helperText={errors[name]?.message}
            style={style}
          />
        )}
      />
    </View>
  );
  return (
    <ImageBackground
      source={require("@/assets/building.jpg")} 
      resizeMode="cover"
      className="flex-1"
    >
      <View className="absolute inset-0 bg-black/30" />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={ "padding" }
          className="flex-1 px-6 pt-10"
        >
          <View className="mt-6">
            <Text className="text-white/90 text-2xl font-bold">AptCare</Text>
            <Text className="text-white/80 mt-1 text-[15px] w-3/4">
              Sửa chữa, bảo trì thông minh cho cuộc sống căn hộ
            </Text>
          </View>

          <Animated.View className="flex-1 justify-center ">
            <AuthTabsHeader
              active="login"
              onLogin={() => {/* stay */}}
              onRegister={() => router.replace("/(auth)/register")}
            />
            <Animated.View style={cardStyle} className="rounded-b-3xl p-6 shadow-lg">
              {/* Email */}
              <Field
                name="email"
                label="Email"
                placeholder="vd: thanh@gmail.com"
                keyboardType="email-address"
                startIcon="email-outline"
                rules={{
                  required: "Vui lòng nhập email",
                  pattern: { value: /\S+@\S+\.\S+/, message: "Email không hợp lệ" },
                }}
              />

              {/* Password */}
              <Field
                name="password"
                label="Mật khẩu"
                placeholder="••••••••"
                secure
                startIcon="lock-outline"
                rules={{ required: "Vui lòng nhập mật khẩu", minLength: { value: 6, message: "Tối thiểu 6 ký tự" } }}
                style={{ marginBottom: 12 }}
              />

              {/* <View className="items-end mb-5">
                <Text className="text-primary">Quên mật khẩu?</Text>
              </View> */}

              {/* Nút đăng nhập */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className={`rounded-2xl py-4 ${isSubmitting ? "bg-gray-300" : "bg-blue-700"}`}
              >
                <Text className="text-white text-center font-semibold text-base">
                  {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* chú thích nhỏ */}
          <View className="items-center mb-6">
            <Text className="text-white/80 text-xs">
              © {new Date().getFullYear()} AptCare
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
