import {
  View,
  Text,
  TouchableOpacity,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller, set } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
} from 'react-native-reanimated';
import { useLocalSearchParams, router } from 'expo-router';
import AuthTabsHeader from '@/src/components/AuthTabsHeader';
import MUITextField from '@/src/components/common/MUITextField';
import GradientButton from '@/src/components/common/GradientButton';
import {
  login as authLogin,
  register as authRegister,
  verifyOtp,
  resendOtp,
} from '@/src/features/auth/authSlice';
import { useAppDispatch } from '@/src/store';
import { use, useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';

const firstChangeSchema = yup.object({
  accountId: yup
    .number()
    .typeError('AccountId phải là số')
    .required('Thiếu AccountId'),
  currentPassword: yup.string().min(1, 'Nhập mật khẩu hiện tại').required('Bắt buộc'),
  newPassword: yup.string().min(6, 'Tối thiểu 6 ký tự').required('Bắt buộc'),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], 'Mật khẩu mới nhập lại chưa khớp')
    .required('Bắt buộc'),
});

const registerSchema = yup.object({
  email: yup.string().trim().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: yup.string().min(6, 'Tối thiểu 6 ký tự').required('Vui lòng nhập mật khẩu'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Mật khẩu nhập lại chưa khớp')
    .required('Vui lòng xác nhận mật khẩu'),
});

const otpSchema = yup.object({
  otp: yup
    .string()
    .trim()
    .matches(/^\d{6}$/, 'OTP gồm 6 chữ số')
    .required('Vui lòng nhập OTP'),
});

function Field({
  control,
  errors,
  name,
  disabled,
  label,
  placeholder,
  secure = false,
  keyboardType,
  startIcon,
  variant = 'outlined',
  size = 'small',
  style,
  maxLength,
  onChangeTransform,
  autoCapitalize = 'none',
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, onBlur, value } }) => (
          <MUITextField
            label={label}
            placeholder={placeholder}
            value={value}
            onChangeText={(t) => onChange(onChangeTransform ? onChangeTransform(t) : t)}
            onBlur={onBlur}
            secureTextEntry={secure}
            keyboardType={keyboardType}
            startIcon={startIcon}
            disabled={disabled}
            variant={variant}
            size={size}
            autoCapitalize={autoCapitalize}
            error={!!errors[name]}
            helperText={errors[name]?.message}
            style={style}
            maxLength={maxLength}
          />
        )}
      />
    </View>
  );
}
function maskEmail(email) {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const head = name.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(0, name.length - 2))}@${domain}`;
}
export default function AuthScreen() {
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams();
  const initialTab =
    typeof params.tab === 'string' && ['login', 'register', 'verify'].includes(params.tab)
      ? params.tab
      : 'login';
  const [tab, setTab] = useState(initialTab);

  const initialEmail = typeof params.email === 'string' ? decodeURIComponent(params.email) : '';
  const initialAccountId =
    typeof params.accountId === 'string' ? decodeURIComponent(params.accountId) : '';
  const [verifyEmail, setVerifyEmail] = useState(initialEmail);
  const [verifyAccountId, setVerifyAccountId] = useState(initialAccountId);
  const [idAccount, setIdAccount] = useState('');
  //shared bg
  const progress = useSharedValue(tab === 'login' ? 0 : 1);
  useEffect(() => {
    progress.value = withTiming(tab === 'login' ? 0 : 1, { duration: 280 });
  }, [tab]);
  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(240,249,255,0.95)', 'rgba(230,249,255,0.95)']
    ),
  }));

  //login
  const {
    control: loginControl,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm({
    defaultValues: { usernameOrEmail: '', password: '' },
    mode: 'onTouched',
  });
  const onLogin = async (values) => {
    try {
      const result = await dispatch(
        authLogin({ usernameOrEmail: values.usernameOrEmail.trim(), password: values.password })
      ).unwrap();

      if (result?.requiresFirstPasswordChange) {
        setIdAccount(String(result.accountId ?? ''));
        setTab('first-change');
        return;
      }
      router.replace('/role-gateway');
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Đăng nhập thất bại',
        text2: e?.message || 'Vui lòng kiểm tra lại thông tin.',
      });
    }
  };

  //register
  const {
    control: registerControl,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: isRegisterSubmitting },
    getValues: getRegisterValues,
  } = useForm({
    defaultValues: { email: '', password: '', confirmPassword: '' },
    resolver: yupResolver(registerSchema),
    mode: 'onTouched',
  });

  const onRegister = async (values) => {
    try {
      const res = await dispatch(
        authRegister({ email: values.email.trim(), password: values.password })
      ).unwrap();
      if (res?.otpSent) {
        setVerifyEmail(values.email.trim());
        setVerifyAccountId(String(res.accountId ?? ''));
        setTab('verify');
      } else {
        setTab('login');
      }
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Đăng ký thất bại',
        text2: e || 'Vui lòng kiểm tra lại thông tin.',
      });
      console.error(e);
    }
  };
  //verify otp
  const {
    control: otpControl,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors, isSubmitting: isOtpSubmitting },
    setError: setOtpError,
  } = useForm({
    defaultValues: { otp: '' },
    resolver: yupResolver(otpSchema),
    mode: 'onTouched',
  });
  const [sec, setSec] = useState(60);
  useEffect(() => {
    if (tab !== 'verify') return;
    if (sec <= 0) return;
    const t = setInterval(() => setSec((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [tab, sec]);
  const onVerifyOtp = async ({ otp }) => {
    try {
      await dispatch(verifyOtp({ accountId: verifyAccountId, otp })).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Xác thực OTP thành công',
        text2: 'Vui lòng đăng nhập để tiếp tục.',
      });
      setTab('login');
    } catch (e) {
      setOtpError('otp', { message: 'OTP không hợp lệ hoặc đã hết hạn' });
    }
  };
  const onResend = async () => {
    if (sec > 0) return;
    try {
      await dispatch(resendOtp({ accountId: verifyAccountId, email: verifyEmail })).unwrap();
      setSec(60);
    } catch (e) {
      Toast.show({
        type: 'error',
        text1: 'Gửi lại OTP thất bại',
        text2: e?.message || 'Vui lòng thử lại sau.',
      });
      console.error(e);
    }
  };

  //first change password
  const {
    control: fcControl,
    handleSubmit: handleFcSubmit,
    formState: { errors: fcErrors, isSubmitting: isFcSubmitting },
    setValue: setFcValue,
  } = useForm({
    defaultValues: {
      accountId: idAccount ,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
    resolver: yupResolver(firstChangeSchema),
    mode: 'onTouched',
  });
  return (
    <ImageBackground
      source={require('@/assets/building.jpg')}
      resizeMode="cover"
      style={{ flex: 1 }}>
      <View style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'undefined'}
          style={{ flex: 1, paddingHorizontal: 24, paddingTop: 40 }}>
          {/* headerbrand */}
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: '600' }}>
              AptCare
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 15 }}>
              Sửa chữa, bảo trì thông minh cho cuộc sống căn hộ
            </Text>
          </View>
          {/* tabHeader */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <AuthTabsHeader
              active={tab}
              onLogin={() => setTab('login')}
              onRegister={() => setTab('register')}
            />
            {/* card */}
            <Animated.View
              style={[
                {
                  borderBottomEndRadius: 24,
                  borderBottomStartRadius: 24,
                  padding: 16,
                  shadowOpacity: 0.2,
                },
                cardStyle,
              ]}>
              {tab === 'login' && (
                <View>
                  <Field
                    control={loginControl}
                    errors={loginErrors}
                    disabled={isLoginSubmitting}
                    name="usernameOrEmail"
                    label="Email hoặc tên đăng nhập"
                    placeholder="vd: thanh@gmail.com"
                    startIcon="user.fill"
                  />
                  <Field
                    control={loginControl}
                    errors={loginErrors}
                    disabled={isLoginSubmitting}
                    name="password"
                    label="Mật khẩu"
                    placeholder="••••••••"
                    secure
                    startIcon="lock"
                    style={{ marginBottom: 12 }}
                  />
                  <GradientButton
                    title={isLoginSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    loading={isLoginSubmitting}
                    disabled={isLoginSubmitting}
                    from="indigo"
                    to="blue"
                    onPress={handleLoginSubmit(onLogin)}
                  />
                  <View style={{ alignItems: 'flex-end', marginBottom: 8, marginTop: 25 }}>
                    <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                      <Text style={{ color: '#1D4ED8', fontWeight: '600' }}>Quên mật khẩu?</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {tab === 'register' && (
                <View>
                  <Field
                    control={registerControl}
                    errors={registerErrors}
                    disabled={isRegisterSubmitting}
                    name="email"
                    label="Email"
                    placeholder="vd: thanh@gmail.com"
                    keyboardType="email-address"
                    startIcon="user.fill"
                  />
                  <Field
                    control={registerControl}
                    errors={registerErrors}
                    disabled={isRegisterSubmitting}
                    name="password"
                    label="Mật khẩu"
                    placeholder="••••••••"
                    secure
                    startIcon="lock"
                  />
                  <Field
                    control={registerControl}
                    errors={registerErrors}
                    disabled={isRegisterSubmitting}
                    name="confirmPassword"
                    label="Xác nhận mật khẩu"
                    placeholder="••••••••"
                    secure
                    startIcon="lock"
                  />
                  <GradientButton
                    title={isRegisterSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                    loading={isRegisterSubmitting}
                    disabled={isRegisterSubmitting}
                    from="pink"
                    to="blue"
                    onPress={handleRegisterSubmit(onRegister)}
                  />
                </View>
              )}
              {tab === 'verify' && (
                <View>
                  <Text style={{ color: 'rgba(0,0,0,0.7)', fontSize: 13, marginBottom: 8 }}>
                    Vui lòng nhập mã OTP đã gửi tới{' '}
                    <Text style={{ fontWeight: '600' }}>{maskEmail(verifyEmail)}</Text>
                  </Text>
                  <Field
                    control={otpControl}
                    errors={otpErrors}
                    name="otp"
                    label="Mã OTP (6 số)"
                    placeholder="______"
                    keyboardType="number-pad"
                    startIcon="shield-key-outline"
                    maxLength={6}
                    onChangeTransform={(t) => t.replace(/[^0-9]/g, '')}
                  />
                  <GradientButton
                    title={isOtpSubmitting ? 'Đang xác thực....' : 'Xác thực OTP'}
                    loading={isOtpSubmitting}
                    disabled={isOtpSubmitting}
                    from="orange"
                    to="blue"
                    onPress={handleOtpSubmit(onVerifyOtp)}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 12,
                    }}>
                    <Text style={{ color: 'rgba(0,0,0,0.6)', marginRight: 8 }}>
                      Không nhận được mã?
                    </Text>
                    <TouchableOpacity disabled={sec > 0} onPress={onResend}>
                      <Text style={{ fontWeight: '600', color: 'blue' }}>{'Gửi lại OTP'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {tab === 'first-change' && (
                <View>
                  <Text style={{ color: 'rgba(0,0,0,0.7)', fontSize: 13, marginBottom: 8 }}>
                    Bạn cần đổi mật khẩu mặc định trước khi tiếp tục.
                  </Text>

                  <Field control={fcControl} errors={fcErrors} name="accountId" label="Account ID"
                         placeholder="VD: 1024" keyboardType="number-pad" startIcon="number"
                         onChangeTransform={(t) => t.replace(/[^0-9]/g, '')} />

                  <Field control={fcControl} errors={fcErrors} name="currentPassword"
                         label="Mật khẩu hiện tại" placeholder="••••••••" secure startIcon="lock" />

                  <Field control={fcControl} errors={fcErrors} name="newPassword"
                         label="Mật khẩu mới (≥ 6 ký tự)" placeholder="••••••••" secure startIcon="lock" />

                  <Field control={fcControl} errors={fcErrors} name="confirmNewPassword"
                         label="Xác nhận mật khẩu mới" placeholder="••••••••" secure startIcon="lock" />

                  <GradientButton title={isFcSubmitting ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu & tiếp tục'}
                                  loading={isFcSubmitting} disabled={isFcSubmitting}
                                  from="orange" to="blue" onPress={handleFcSubmit(onFirstChange)} />

                  <Text style={{ marginTop: 10, fontSize: 12, color: 'rgba(0,0,0,0.5)' }}>
                    Thiết bị: {deviceInfo}
                  </Text>
                </View>
              )}
            </Animated.View>
          </View>
          {/* footer */}
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
              © {new Date().getFullYear()} AptCare
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}
