import React from "react";
import { View, Text, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, interpolateColor } from "react-native-reanimated";
import { useDispatch } from "react-redux";

import AuthTabsHeader from "@/src/components/AuthTabsHeader";
import MUITextField from "@/src/components/common/MUITextField";
import { resendOtp, verifyOtp } from "@/src/features/auth/authSlice";
import GradientButton from "@/src/components/common/GradientButton";

const schema = yup.object({
  otp: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, "OTP gồm 6 chữ số")
    .required("Vui lòng nhập OTP"),
});

export default function VerifyOtp() {
  const dispatch = useDispatch();
  const params = useLocalSearchParams(); // ?email=&accountId=
  const email = typeof params.email === "string" ? decodeURIComponent(params.email) : "";
  const accountId = typeof params.accountId === "string" ? params.accountId : "";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    defaultValues: { otp: "" },
    resolver: yupResolver(schema),
    mode: "onTouched",
  });

  // nền card đồng bộ style
  const progress = useSharedValue(1);
  React.useEffect(() => {
    progress.value = withTiming(1, { duration: 280 });
  }, []);
  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ["rgba(255,255,255,0.92)", "rgba(230,249,255,0.95)"]),
  }));

  // resend OTP cooldown
  const [sec, setSec] = React.useState(60);
  React.useEffect(() => {
    if (sec <= 0) return;
    const t = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [sec]);

  const onSubmit = async ({ otp }) => {
    try {
      // payload theo API của bạn
      console.log('submit and call api verify otp')
      const payload = { accountId: accountId, otp: otp };
      const ok = await dispatch(verifyOtp(payload)).unwrap();
      console.log('verify otp res =', ok);
      // thành công -> về login
      router.replace("/(auth)/login");
    } catch (e) {
      setError("otp", { message: "OTP không hợp lệ hoặc đã hết hạn" });
    }
  };

  const onResend = async () => {
    if (sec > 0) return;
    try {
      await dispatch(resendOtp({ accountId, email })).unwrap();
      setSec(60);
    } catch {
      // tuỳ bạn hiện toast/alert
    }
  };

  const maskEmail = (e) => {
    if (!e) return "";
    const [name, domain] = e.split("@");
    if (!domain) return e;
    const head = name.slice(0, 2);
    return `${head}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
    };

  return (
    <ImageBackground source={require("@/assets/building.jpg")} resizeMode="cover" className="flex-1">
      <View className="absolute inset-0 bg-black/30" />
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 px-6 pt-10">
          <View className="mt-6">
            <Text className="text-white/90 text-2xl font-bold">AptCare</Text>
            <Text className="text-white/80 mt-1">Xác thực OTP</Text>
          </View>

          <View className="flex-1 justify-center">
            <AuthTabsHeader
              active="verify"
              onLogin={() => router.replace("/(auth)/login")}
              onRegister={() => router.replace("/(auth)/register")}
            />

            <Animated.View style={cardStyle} className="rounded-b-3xl p-6 shadow-lg">
              <Text className="text-black/70 text-sm mb-3">
                Vui lòng nhập mã OTP đã gửi tới{" "}
                <Text className="font-semibold">{maskEmail(email)}</Text>
              </Text>

              <View className="mb-3">
                <Controller
                  control={control}
                  name="otp"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <MUITextField
                      label="Mã OTP (6 số)"
                      placeholder="______"
                      value={value}
                      onChangeText={(t) => onChange(t.replace(/[^0-9]/g, "").slice(0, 6))}
                      onBlur={onBlur}
                      keyboardType="number-pad"
                      startIcon="shield-key-outline"
                      variant="outlined"
                      size="medium"
                      autoCapitalize="none"
                      error={!!errors.otp}
                      helperText={errors.otp?.message}
                    />
                  )}
                />
              </View>

              <GradientButton
                title={isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                onPress={handleSubmit(onSubmit)}
                loading={isSubmitting}
                disabled={isSubmitting}
                from="pink"
                to="blue"
              />

              <View className="flex-row items-center justify-center mt-4">
                <Text className="text-black/60 mr-2">Không nhận được mã?</Text>
                <TouchableOpacity disabled={sec > 0} onPress={onResend}>
                  <Text className={`font-semibold ${sec > 0 ? "text-gray-400" : "text-blue-700"}`}>
                    {sec > 0 ? `Gửi lại sau ${sec}s` : "Gửi lại OTP"}
                  </Text>
                </TouchableOpacity>
              </View>
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

// Ẩn header mặc định của router
export const options = { headerShown: false };
