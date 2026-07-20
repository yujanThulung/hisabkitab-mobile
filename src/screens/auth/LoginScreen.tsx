import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { AxiosError } from 'axios';

import { useAuthStore } from '../../store/authStore';
import { loginSchema, LoginFormData } from '../../validators/auth.validator';

const LoginScreen = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      // AppNavigator swaps to ProtectedStack automatically once accessToken is set
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      setServerError(
        axiosErr.response?.data?.message ?? 'Login failed. Please check your credentials.'
      );
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-authBg"
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <Image
            source={require('../../../assets/icon.png')}
            className="w-20 h-20 mb-4"
            resizeMode="contain"
          />
          <Text className="text-3xl font-bold text-primary">HisabKitab</Text>
          <Text className="text-sm text-textSecondary mt-1.5 text-center">
            Track shared expenses, settle instantly
          </Text>
        </View>

        <View className="bg-white rounded-2xl p-5">
          <Text className="text-sm font-semibold text-textPrimary mb-1.5 mt-3">
            Email or Phone
          </Text>
          <Controller
            control={control}
            name="identifier"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-xl px-3 h-12 gap-2 ${
                  errors.identifier ? 'border-danger' : 'border-border'
                }`}
              >
                <Ionicons name="person-outline" size={20} color="#8c9196" />
                <TextInput
                  className="flex-1 text-[15px] text-textPrimary"
                  placeholder="Email or phone number"
                  placeholderTextColor="#8c9196"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.identifier && (
            <Text className="text-danger text-xs mt-1">{errors.identifier.message}</Text>
          )}

          <Text className="text-sm font-semibold text-textPrimary mb-1.5 mt-3">Password</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-xl px-3 h-12 gap-2 ${
                  errors.password ? 'border-danger' : 'border-border'
                }`}
              >
                <Ionicons name="lock-closed-outline" size={20} color="#8c9196" />
                <TextInput
                  className="flex-1 text-[15px] text-textPrimary"
                  placeholder="Password"
                  placeholderTextColor="#8c9196"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity onPress={togglePasswordVisibility}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#8c9196"
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.password && (
            <Text className="text-danger text-xs mt-1">{errors.password.message}</Text>
          )}

          {serverError && (
            <Text className="text-danger text-sm mt-4 text-center">{serverError}</Text>
          )}

          <TouchableOpacity
            className={`bg-primary h-[50px] rounded-xl items-center justify-center mt-6 ${
              loading ? 'opacity-60' : ''
            }`}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-semibold">Log In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;