import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';

import AppHeader from '../../components/AppHeader';
import { useDashboard } from './hooks/useDashboard';
import { useSettlement } from './hooks/useSettlement';
import { useAuthStore } from '../../store/authStore';
import { formatCurrency } from '../../utils/date';

const CHART_COLORS = ['#ff6b35', '#52c41a', '#faad14', '#8c9196', '#ff4d4f', '#ff8c42'];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const OverviewScreen = () => {
  const { data, loading, fetchData } = useDashboard();
  const { grandTotal, perPersonShare, userBreakdown, totalTransactions } = data;
  const { lastSettlement } = useSettlement();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? '';

  const pieData = userBreakdown.map((u, i) => ({
    value: u.totalAmount,
    color: CHART_COLORS[i % CHART_COLORS.length],
    text: u.name,
  }));

  if (loading && userBreakdown.length === 0) {
    return (
      <View className="flex-1 bg-authBg">
        <AppHeader title="Overview" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ff6b35" />
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-authBg">
      <AppHeader title="Overview" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#ff6b35" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Greeting */}
        <View className="mb-5">
          <Text className="text-xl font-bold text-textPrimary">
            {getGreeting()}{firstName ? `, ${firstName}` : ''} 👋
          </Text>
          <Text className="text-sm text-textSecondary mt-0.5">Here's this month's summary</Text>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-white rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="wallet-outline" size={16} color="#ff6b35" />
              <Text className="text-xs text-textSecondary">Total Spent</Text>
            </View>
            <Text className="text-xl font-bold text-textPrimary">{formatCurrency(grandTotal)}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="people-outline" size={16} color="#ff6b35" />
              <Text className="text-xs text-textSecondary">Per Person</Text>
            </View>
            <Text className="text-xl font-bold text-textPrimary">{formatCurrency(perPersonShare)}</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-5">
          <View className="flex-1 bg-white rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="receipt-outline" size={16} color="#ff6b35" />
              <Text className="text-xs text-textSecondary">Purchases</Text>
            </View>
            <Text className="text-xl font-bold text-textPrimary">{totalTransactions}</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-4">
            <View className="flex-row items-center gap-2 mb-1">
              <Ionicons name="person-outline" size={16} color="#ff6b35" />
              <Text className="text-xs text-textSecondary">People</Text>
            </View>
            <Text className="text-xl font-bold text-textPrimary">{userBreakdown.length}</Text>
          </View>
        </View>

        {/* Per-person breakdown */}
        {userBreakdown.length > 0 && (
          <View className="bg-white rounded-2xl p-4 mb-5">
            <Text className="text-sm font-bold text-textPrimary mb-4">Spend by Person</Text>

            <View className="items-center mb-5">
              <PieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={55}
                centerLabelComponent={() => (
                  <Text className="text-xs text-textSecondary text-center">Total{'\n'}{formatCurrency(grandTotal)}</Text>
                )}
              />
            </View>

            {/* Person rows */}
            {userBreakdown.map((u, i) => (
              <View
                key={u.userId}
                className="flex-row items-center py-3 border-b border-border last:border-0"
              >
                <View
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                  className="w-2.5 h-2.5 rounded-full mr-3"
                />
                <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center mr-3">
                  <Text className="text-primary text-xs font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text className="flex-1 text-sm font-medium text-textPrimary">{u.name}</Text>
                <View className="items-end">
                  <Text className="text-sm font-bold text-textPrimary">
                    {formatCurrency(u.totalAmount)}
                  </Text>
                  <Text className="text-xs text-textSecondary">
                    {grandTotal > 0 ? `${Math.round((u.totalAmount / grandTotal) * 100)}%` : '0%'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {userBreakdown.length === 0 && (
          <View className="bg-white rounded-2xl items-center justify-center py-16">
            <Ionicons name="receipt-outline" size={44} color="#8c9196" />
            <Text className="text-sm font-semibold text-textPrimary mt-4">No expenses yet</Text>
            <Text className="text-xs text-textSecondary mt-1">Add some purchases to see the summary.</Text>
          </View>
        )}

        {/* Last settlement summary */}
        <View className="bg-white rounded-2xl p-4 mt-2">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="time-outline" size={16} color="#ff6b35" />
            <Text className="text-sm font-bold text-textPrimary">Last Settlement</Text>
          </View>

          {!lastSettlement ? (
            <View className="items-center py-6">
              <Text className="text-sm text-textSecondary">No settlements done yet</Text>
            </View>
          ) : (
            <>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs text-textSecondary">
                  {dayjs(lastSettlement.periodFrom).format('MMM D')} → {dayjs(lastSettlement.periodTo).format('MMM D, YYYY')}
                </Text>
                <View className="bg-green-50 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <Ionicons name="checkmark-circle" size={11} color="#52c41a" />
                  <Text className="text-xs text-green-700">
                    {dayjs(lastSettlement.settledAt).format('MMM D, hh:mm A')}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3 mb-3">
                <View className="flex-1 bg-authBg rounded-xl p-3 items-center">
                  <Text className="text-xs text-textSecondary mb-1">Total</Text>
                  <Text className="text-sm font-bold text-textPrimary">
                    {formatCurrency(lastSettlement.totalAmount)}
                  </Text>
                </View>
                <View className="flex-1 bg-authBg rounded-xl p-3 items-center">
                  <Text className="text-xs text-textSecondary mb-1">Per Person</Text>
                  <Text className="text-sm font-bold text-textPrimary">
                    {formatCurrency(lastSettlement.perPersonShare)}
                  </Text>
                </View>
                <View className="flex-1 bg-authBg rounded-xl p-3 items-center">
                  <Text className="text-xs text-textSecondary mb-1">People</Text>
                  <Text className="text-sm font-bold text-textPrimary">
                    {lastSettlement.userSnapshot?.length ?? 0}
                  </Text>
                </View>
              </View>

              {lastSettlement.transactions?.length > 0 && (
                <View className="bg-authBg rounded-xl px-3">
                  {lastSettlement.transactions.map((item, idx) => (
                    <View
                      key={`${item.fromId}-${item.toId}-${idx}`}
                      className="flex-row items-center py-2.5 border-b border-border"
                    >
                      <Text className="flex-1 text-xs text-textPrimary">
                        <Text className="font-semibold">{item.fromName}</Text>
                        <Text className="text-textSecondary"> gave </Text>
                        <Text className="font-semibold">{item.toName}</Text>
                      </Text>
                      <Text className="text-xs font-bold text-primary">
                        {formatCurrency(Math.abs(item.amount))}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default OverviewScreen;
