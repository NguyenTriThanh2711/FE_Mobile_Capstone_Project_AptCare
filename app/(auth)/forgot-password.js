// app/(auth)/forgot-password.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ImageBackground, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Toast from "react-native-toast-message";
import { router, useLocalSearchParams } from "expo-router";

import MUITextField from "@/src/components/common/MUITextField";
import GradientButton from "@/src/components/common/GradientButton";
import http from "@/src/services/http";

/* ----------------------------- Utils nhỏ ----------------------------- */
function maskEmail(email) {
  if (!email) return "";
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const head = name.slice(0, 2);
  return `${head}${"*".repeat(Math.max(0, name.length - 2))}@${domain}`;
}

/* ----------------------------- Step 1: Email ----------------------------- */
const emailSchema = yup.object({
  email: yup.string().trim().email("Email không hợp lệ").required("Vui lòng nhập email"),
});

function StepEmail({ onSuccess, defaultEmail = "" }) {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { email: defaultEmail },
    resolver: yupResolver(emailSchema),
    mode: "onTouched",
  });

  const submit = async ({ email }) => {
    try {
      const { data } = await http.post("/auth/password-reset/request", { email: email.trim() });
      const accountId = String(data?.accountId ?? "");
      Toast.show({ type: "success", text1: "Đã gửi OTP", text2: "Vui lòng kiểm tra email." });
      onSuccess({ email: email.trim(), accountId });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Không gửi được OTP",
        text2: e?.response?.data?.detail || e?.message || "Vui lòng thử lại.",
      });
    }
  };

  return (
    <View>
      <Text style={{ color: "rgba(0,0,0,0.7)", marginBottom: 8 }}>
        Nhập email tài khoản để nhận mã OTP đặt lại mật khẩu.
      </Text>

      <View style={{ marginBottom: 12 }}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value} }) => (
            <MUITextField
              label="Email"
              placeholder="you@domain.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              startIcon="envelope"
              variant="outlined"
              size="medium"
              autoCapitalize="none"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
          )}
        />
      </View>

      <GradientButton
        title={isSubmitting ? "Đang gửi..." : "Gửi OTP"}
        loading={isSubmitting}
        disabled={isSubmitting}
        from="pink"
        to="blue"
        onPress={handleSubmit(submit)}
      />
    </View>
  );
}

/* ----------------------------- Step 2: OTP ----------------------------- */
const otpSchema = yup.object({
  otp: yup.string().trim().matches(/^\d{6}$/, "OTP gồm 6 chữ số").required("Vui lòng nhập OTP"),
});

function StepOTP({ email, accountId, onVerified, onBackToEmail }) {
  const { control, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm({
    defaultValues: { otp: "" },
    resolver: yupResolver(otpSchema),
    mode: "onTouched",
  });

  const [sec, setSec] = useState(60);
  useEffect(() => {
    if (sec <= 0) return;
    const t = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [sec]);

  const submit = async ({ otp }) => {
    try {
      const { data } = await http.post("/auth/password-reset/verify-otp", { accountId, otp });
      const resetToken = String(data?.resetToken ?? "");
      Toast.show({ type: "success", text1: "OTP hợp lệ", text2: "Vui lòng đặt mật khẩu mới." });
      onVerified({ resetToken });
    } catch (e) {
      setError("otp", { message: "OTP không hợp lệ hoặc đã hết hạn" });
    }
  };

  const resend = async () => {
    if (sec > 0) return;
    try {
      await http.post("/auth/password-reset/request", { email });
      setSec(60);
      Toast.show({ type: "success", text1: "Đã gửi lại OTP" });
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Gửi lại OTP thất bại",
        text2: e?.response?.data?.detail || e?.message || "Vui lòng thử lại.",
      });
    }
  };

  return (
    <View>
      <Text style={{ color: "rgba(0,0,0,0.7)", marginBottom: 8 }}>
        Nhập mã OTP đã gửi tới <Text style={{ fontWeight: "600" }}>{maskEmail(email)}</Text>
      </Text>

      <View style={{ marginBottom: 12 }}>
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
              maxLength={6}
              error={!!errors.otp}
              helperText={errors.otp?.message}
            />
          )}
        />
      </View>

      <GradientButton
        title={isSubmitting ? "Đang xác thực..." : "Xác thực OTP"}
        loading={isSubmitting}
        disabled={isSubmitting}
        from="orange"
        to="red"
        onPress={handleSubmit(submit)}
      />

      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12 }}>
        <Text style={{ color: "rgba(0,0,0,0.6)", marginRight: 8 }}>Không nhận được mã?</Text>
        <TouchableOpacity disabled={sec > 0} onPress={resend}>
          <Text style={{ fontWeight: "600", color: sec > 0 ? "#9CA3AF" : "#1D4ED8" }}>
            {sec > 0 ? `Gửi lại sau ${sec}s` : "Gửi lại OTP"}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={onBackToEmail} style={{ marginTop: 12 }}>
        <Text style={{ textAlign: "center", color: "#1D4ED8", fontWeight: "600" }}>← Nhập lại email</Text>
      </TouchableOpacity>
    </View>
  );
}

/* ----------------------------- Step 3: Confirm ----------------------------- */
const confirmSchema = yup.object({
  newPassword: yup.string().min(6, "Tối thiểu 6 ký tự").required("Vui lòng nhập mật khẩu mới"),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Mật khẩu nhập lại chưa khớp")
    .required("Vui lòng xác nhận mật khẩu mới"),
});

function StepConfirm({ email, accountId, resetToken, onDone }) {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { newPassword: "", confirmNewPassword: "" },
    resolver: yupResolver(confirmSchema),
    mode: "onTouched",
  });

  const submit = async ({ newPassword }) => {
    try {
      await http.post("/auth/password-reset/confirm", {
        accountId,
        resetToken,
        newPassword,
      });
      Toast.show({
        type: "success",
        text1: "Đặt lại mật khẩu thành công",
        text2: "Vui lòng đăng nhập với mật khẩu mới.",
      });
      onDone();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Xác nhận thất bại",
        text2: e?.response?.data?.detail || e?.message || "Vui lòng thử lại.",
      });
    }
  };

  return (
    <View>
      <Text style={{ color: "rgba(0,0,0,0.7)", marginBottom: 8 }}>
        Đặt mật khẩu mới cho tài khoản <Text style={{ fontWeight: "600" }}>{maskEmail(email)}</Text>
      </Text>

      <View style={{ marginBottom: 12 }}>
        <Controller
          control={control}
          name="newPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <MUITextField
              label="Mật khẩu mới"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              startIcon="lock"
              variant="outlined"
              size="medium"
              autoCapitalize="none"
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message}
            />
          )}
        />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Controller
          control={control}
          name="confirmNewPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <MUITextField
              label="Xác nhận mật khẩu mới"
              placeholder="••••••••"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              startIcon="lock"
              variant="outlined"
              size="medium"
              autoCapitalize="none"
              error={!!errors.confirmNewPassword}
              helperText={errors.confirmNewPassword?.message}
            />
          )}
        />
      </View>

      <GradientButton
        title={isSubmitting ? "Đang xác nhận..." : "Xác nhận đặt lại mật khẩu"}
        loading={isSubmitting}
        disabled={isSubmitting}
        from="indigo"
        to="blue"
        onPress={handleSubmit(submit)}
      />
    </View>
  );
}

/* ----------------------------- Trang gộp 3 bước ----------------------------- */
export default function ForgotPasswordScreen() {
  // cho phép prefill qua params nếu muốn (?email=..., ?accountId=...)
  const params = useLocalSearchParams();
  const initialEmail = typeof params.email === "string" ? decodeURIComponent(params.email) : "";

  const [step, setStep] = useState("email"); // "email" | "otp" | "confirm"
  const [email, setEmail] = useState(initialEmail);
  const [accountId, setAccountId] = useState("");
  const [resetToken, setResetToken] = useState("");

  const headerTitle = useMemo(() => {
    switch (step) {
      case "email": return "Đặt lại mật khẩu";
      case "otp": return "Xác thực OTP";
      case "confirm": return "Đặt mật khẩu mới";
      default: return "Đặt lại mật khẩu";
    }
  }, [step]);

  return (
    <ImageBackground source={require("@/assets/building.jpg")} resizeMode="cover" style={{ flex: 1 }}>
      <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.30)" }} />

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
          {/* Brand header */}
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 22, fontWeight: "600" }}>AptCare</Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 4, fontSize: 15 }}>{headerTitle}</Text>
          </View>

          {/* Card */}
          <View style={{ flex: 1, justifyContent: "center" }}>
            <View style={{ backgroundColor: "rgba(230,249,255,0.95)", borderRadius: 24, padding: 24 }}>
              {step === "email" && (
                <StepEmail
                  defaultEmail={email}
                  onSuccess={({ email: e, accountId: aId }) => {
                    setEmail(e);
                    setAccountId(aId);
                    setStep("otp");
                  }}
                />
              )}

              {step === "otp" && (
                <StepOTP
                  email={email}
                  accountId={accountId}
                  onVerified={({ resetToken: token }) => {
                    setResetToken(token);
                    setStep("confirm");
                  }}
                  onBackToEmail={() => setStep("email")}
                />
              )}

              {step === "confirm" && (
                <StepConfirm
                  email={email}
                  accountId={accountId}
                  resetToken={resetToken}
                  onDone={() => router.replace("/(auth)/login")}
                />
              )}

              {/* back nhỏ */}
              <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
                <Text style={{ textAlign: "center", color: "#1D4ED8", fontWeight: "600" }}>← Quay lại</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
              © {new Date().getFullYear()} AptCare
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

export const options = { headerShown: false };
