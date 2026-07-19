import React from 'react';
import { View, Text } from 'react-native';
import AppHeader from '../../components/AppHeader';

const SettlementLogsScreen = () => (
  <View className="flex-1 bg-white">
    <AppHeader title="Settlement Logs" />
    <View className="flex-1 items-center justify-center">
      <Text className="text-textSecondary">History coming soon</Text>
    </View>
  </View>
);

export default SettlementLogsScreen;