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

export default function Login() {
  const { control, handleSubmit } = useForm({
    defaultValues: { email: "", password: "" },
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
    //const ok = await dispatch(authLogin(values)).unwrap().catch(() => false);
    if (true) router.replace("/(main)/(tabs)/home");
  };

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
              <View className="mb-3">
                <Text className="text-gray-600 mb-2">Email</Text>
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-200 rounded-xl px-4 py-3 bg-white"
                      placeholder="vd: thanh@gmail.com"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>

              {/* Password */}
              <View className="mb-2">
                <Text className="text-gray-600 mb-2">Mật khẩu</Text>
                <Controller
                  control={control}
                  name="password"
                  rules={{ required: true }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      className="border border-gray-200 rounded-xl px-4 py-3 bg-white"
                      placeholder="••••••••"
                      secureTextEntry
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
              </View>

              {/* <View className="items-end mb-5">
                <Text className="text-primary">Quên mật khẩu?</Text>
              </View> */}

              {/* Nút đăng nhập */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                className=" rounded-2xl py-4 bg-blue-700"
              >
                <Text className="text-white text-center font-semibold text-base">
                  Đăng nhập
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
