import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';

import AppHeader from '../../components/AppHeader';
import { useDashboard } from './hooks/useDashboard';
import { formatCurrency } from '../../utils/date';

const CHART_COLORS = ['#ff6b35', '#52c41a', '#faad14', '#8c9196', '#ff4d4f', '#ff8c42'];

const OverviewScreen = () => {
  const { data, loading, fetchData } = useDashboard();
  const { grandTotal, perPersonShare, userBreakdown, totalTransactions } = data;

  const pieData = userBreakdown.map((u, i) => ({
    value: u.totalAmount,
    color: CHART_COLORS[i % CHART_COLORS.length],
    text: u.name,
  }));

  const barData = userBreakdown.map((u, i) => ({
    value: u.totalAmount,
    label: u.name.split(' ')[0],
    frontColor: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (loading && userBreakdown.length === 0) {
    return (
      <View className="flex-1 bg-white">
        <AppHeader title="Overview" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff6b35" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <AppHeader title="Overview" />
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <Text className="text-xs text-textSecondary mt-4 mb-2">This month</Text>

        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-authBg rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="wallet-outline" size={18} color="#ff6b35" />
              <Text className="text-xs text-textSecondary">Total Spent</Text>
            </View>
            <Text className="text-xl font-bold text-textPrimary">
              {formatCurrency(grandTotal)}
            </Text>
          </View>

          <View className="flex-1 bg-authBg rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="people-outline" size={18} color="#ff6b35" />
              <Text className="text-xs text-textSecondary">Per Person</Text>
            </View>
            <Text className="text-xl font-bold text-textPrimary">
              {formatCurrency(perPersonShare)}
            </Text>
          </View>
        </View>

        <View className="bg-authBg rounded-2xl p-4 mb-6">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="receipt-outline" size={18} color="#ff6b35" />
            <Text className="text-xs text-textSecondary">Total Purchases</Text>
          </View>
          <Text className="text-xl font-bold text-textPrimary">{totalTransactions}</Text>
        </View>

        {pieData.length > 0 && (
          <View className="mb-8">
            <Text className="text-sm font-semibold text-textPrimary mb-4">Spend by Person</Text>
            <View className="items-center">
              <PieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={55}
                centerLabelComponent={() => (
                  <Text className="text-xs text-textSecondary">Total</Text>
                )}
              />
            </View>
            <View className="flex-row flex-wrap gap-3 mt-4 justify-center">
              {pieData.map((d, i) => (
                <View key={i} className="flex-row items-center gap-1.5">
                  <View style={{ backgroundColor: d.color, width: 10, height: 10, borderRadius: 5 }} />
                  <Text className="text-xs text-textSecondary">{d.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {barData.length > 0 && (
          <View className="mb-4">
            <Text className="text-sm font-semibold text-textPrimary mb-4">Amount by Person</Text>
            <BarChart
              data={barData}
              barWidth={32}
              spacing={24}
              roundedTop
              hideRules
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor="#e5e7eb"
              noOfSections={4}
              yAxisTextStyle={{ color: '#8c9196', fontSize: 10 }}
              xAxisLabelTextStyle={{ color: '#8c9196', fontSize: 10 }}
            />
          </View>
        )}

        {pieData.length === 0 && (
          <View className="items-center justify-center py-12">
            <Ionicons name="bar-chart-outline" size={40} color="#8c9196" />
            <Text className="text-textSecondary text-sm mt-3">No expenses this month</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default OverviewScreen;