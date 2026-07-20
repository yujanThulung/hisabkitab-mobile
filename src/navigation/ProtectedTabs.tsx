import React, { useEffect, useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import OverviewScreen from '../screens/dashboard/OverviewScreen';
import PurchasesScreen from '../screens/dashboard/PurchasesScreen';
import SettlementScreen from '../screens/dashboard/SettlementScreen';
import SettlementLogsScreen from '../screens/dashboard/SettlementLogsScreen';
import ExpenseFormModal from '../screens/dashboard/components/ExpenseFormModal';

export type ProtectedTabsParamList = {
  Overview: undefined;
  Purchases: undefined;
  Add: undefined;
  Settlement: undefined;
  SettlementLogs: undefined;
};

const Tab = createBottomTabNavigator<ProtectedTabsParamList>();

const TAB_ICONS: Record<keyof ProtectedTabsParamList, keyof typeof Ionicons.glyphMap> = {
  Overview: 'grid-outline',
  Purchases: 'cart-outline',
  Add: 'add',
  Settlement: 'swap-horizontal-outline',
  SettlementLogs: 'time-outline',
};

interface AnimatedTabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}

const AnimatedTabIcon = ({ name, color, size, focused }: AnimatedTabIconProps) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.4, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 6, stiffness: 200 }),
      );
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
};

const ProtectedTabs = () => {
  const insets = useSafeAreaInsets();
  const [addModalVisible, setAddModalVisible] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#ff6b35',
          tabBarInactiveTintColor: '#8c9196',
          tabBarStyle: {
            height: 60 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name={TAB_ICONS[route.name as keyof ProtectedTabsParamList]}
              color={color}
              size={size}
              focused={focused}
            />
          ),
        })}
      >
        <Tab.Screen name="Overview" component={OverviewScreen} />
        <Tab.Screen name="Purchases" component={PurchasesScreen} />
        <Tab.Screen
          name="Add"
          component={PurchasesScreen}
          options={{
            tabBarLabel: () => null,
          tabBarButton: () => (
            <TouchableOpacity
              onPress={() => setAddModalVisible(true)}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 60,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TouchableOpacity
                onPress={() => setAddModalVisible(true)}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: '#ff6b35',
                  alignItems: 'center',
                  justifyContent: 'center',
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                <Ionicons name="add" size={30} color="#fff" />
              </TouchableOpacity>
            </TouchableOpacity>
          ),
          }}
        />
        <Tab.Screen name="Settlement" component={SettlementScreen} />
        <Tab.Screen
          name="SettlementLogs"
          component={SettlementLogsScreen}
          options={{ title: 'Logs' }}
        />
      </Tab.Navigator>

      <ExpenseFormModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSuccess={() => setAddModalVisible(false)}
      />
    </>
  );
};

export default ProtectedTabs;
