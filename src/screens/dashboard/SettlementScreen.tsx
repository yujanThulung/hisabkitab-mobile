import React from 'react';
import { View, Text } from 'react-native';
import AppHeader from '../../components/AppHeader';

const SettlementScreen = () => (
  <View className="flex-1 bg-white">
    <AppHeader title="Settlement" />
    <View className="flex-1 items-center justify-center">
      <Text className="text-textSecondary">Live balances coming soon</Text>
    </View>
  </View>
);

export default SettlementScreen;