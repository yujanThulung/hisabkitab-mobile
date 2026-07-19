import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';

type AppHeaderProps = {
  title: string;
};

const AppHeader = ({ title }: AppHeaderProps) => {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [profileVisible, setProfileVisible] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <>
      {/* Header bar */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-white border-b border-border px-5 pb-3"
      >
        <View className="flex-row items-center justify-between" style={{ minHeight: 48 }}>
          <Text className="text-lg font-bold text-textPrimary">{title}</Text>
          <TouchableOpacity
            onPress={() => setProfileVisible(true)}
            className="w-9 h-9 rounded-full bg-primary items-center justify-center"
          >
            <Text className="text-white text-sm font-bold">{initials}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile bottom sheet */}
      <Modal
        visible={profileVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setProfileVisible(false)}
        />
        <View
          style={{ paddingBottom: insets.bottom + 16 }}
          className="bg-white rounded-t-3xl px-5 pt-5"
        >
          {/* Avatar + name */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 rounded-full bg-primary items-center justify-center mb-3">
              <Text className="text-white text-2xl font-bold">{initials}</Text>
            </View>
            <Text className="text-base font-bold text-textPrimary">{user?.name ?? '—'}</Text>
            <Text className="text-sm text-textSecondary mt-0.5">{user?.phone ?? '—'}</Text>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={() => {
              setProfileVisible(false);
              logout();
            }}
            className="flex-row items-center gap-3 py-4 border-t border-border"
          >
            <Ionicons name="log-out-outline" size={20} color="#e53e3e" />
            <Text className="text-base font-semibold text-danger">Logout</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

export default AppHeader;
