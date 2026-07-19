import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import AppHeader from '../../components/AppHeader';
import { settlementApi, type SettlementRecord } from '../../api/settlement';
import { formatCurrency } from '../../utils/date';
import type { SettlementTransaction, UserBalanceSnapshot } from '../../api/settlement';

// ─── Detail modal ─────────────────────────────────────────────────────────────

const TransactionRow = ({ item }: { item: SettlementTransaction }) => (
  <View className="flex-row items-center py-3 border-b border-border">
    <View className="flex-1">
      <Text className="text-sm text-textPrimary">
        <Text className="font-semibold">{item.fromName}</Text>
        <Text className="text-textSecondary"> gave </Text>
        <Text className="font-semibold">{item.toName}</Text>
      </Text>
    </View>
    <Text className="text-sm font-bold text-primary">{formatCurrency(Math.abs(item.amount))}</Text>
  </View>
);

const BalanceRow = ({ person }: { person: UserBalanceSnapshot }) => {
  const isPositive = person.balance > 0;
  const isEven = person.balance === 0;
  const color = isEven ? '#8c9196' : isPositive ? '#52c41a' : '#ff4d4f';

  return (
    <View className="flex-row items-center py-3 border-b border-border">
      <View className="w-8 h-8 rounded-full bg-primary items-center justify-center mr-3">
        <Text className="text-white text-xs font-bold">
          {person.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-textPrimary">{person.name}</Text>
        <Text className="text-xs text-textSecondary">Spent {formatCurrency(person.totalAmount)}</Text>
      </View>
      <Text className="text-sm font-bold" style={{ color }}>
        {isEven ? '—' : `${isPositive ? '+' : ''}${formatCurrency(person.balance)}`}
      </Text>
    </View>
  );
};

const DetailModal = ({
  record,
  onClose,
}: {
  record: SettlementRecord | null;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  if (!record) return null;

  return (
    <Modal visible={!!record} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View
        style={{ paddingBottom: insets.bottom + 8 }}
        className="bg-white rounded-t-3xl max-h-[85%]"
      >
        <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
          <View>
            <Text className="text-base font-bold text-textPrimary">Settlement Detail</Text>
            <Text className="text-xs text-textSecondary mt-0.5">
              {dayjs(record.settledAt).format('MMM D, YYYY · hh:mm A')}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-1">
            <Ionicons name="close" size={22} color="#8c9196" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="px-5 pt-4"
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats */}
          <View className="flex-row gap-3 mb-5">
            <View className="flex-1 bg-authBg rounded-xl p-3 items-center">
              <Text className="text-xs text-textSecondary mb-1">Total</Text>
              <Text className="text-sm font-bold text-textPrimary">
                {formatCurrency(record.totalAmount)}
              </Text>
            </View>
            <View className="flex-1 bg-authBg rounded-xl p-3 items-center">
              <Text className="text-xs text-textSecondary mb-1">Per Person</Text>
              <Text className="text-sm font-bold text-textPrimary">
                {formatCurrency(record.perPersonShare)}
              </Text>
            </View>
            <View className="flex-1 bg-authBg rounded-xl p-3 items-center">
              <Text className="text-xs text-textSecondary mb-1">Period</Text>
              <Text className="text-xs font-bold text-textPrimary text-center">
                {dayjs(record.periodFrom).format('MMM D')} → {dayjs(record.periodTo).format('MMM D')}
              </Text>
            </View>
          </View>

          {record.transactions?.length > 0 && (
            <View className="mb-5">
              <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
                Payments
              </Text>
              <View className="bg-authBg rounded-xl px-3">
                {record.transactions.map((item, idx) => (
                  <TransactionRow key={`${item.fromId}-${item.toId}-${idx}`} item={item} />
                ))}
              </View>
            </View>
          )}

          <View>
            <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
              Balances
            </Text>
            <View className="bg-authBg rounded-xl px-3">
              {record.userSnapshot?.map((person) => (
                <BalanceRow key={person.userId} person={person} />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── List item ────────────────────────────────────────────────────────────────

const LogItem = ({
  record,
  onPress,
}: {
  record: SettlementRecord;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
    activeOpacity={0.7}
  >
    <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-4">
      <Ionicons name="checkmark-circle" size={22} color="#52c41a" />
    </View>
    <View className="flex-1">
      <Text className="text-sm font-semibold text-textPrimary">
        {formatCurrency(record.totalAmount)}
      </Text>
      <Text className="text-xs text-textSecondary mt-0.5">
        {dayjs(record.periodFrom).format('MMM D')} → {dayjs(record.periodTo).format('MMM D, YYYY')}
      </Text>
    </View>
    <View className="items-end">
      <Text className="text-xs text-textSecondary">
        {dayjs(record.settledAt).format('MMM D, hh:mm A')}
      </Text>
      <Ionicons name="chevron-forward" size={16} color="#8c9196" style={{ marginTop: 4 }} />
    </View>
  </TouchableOpacity>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const SettlementLogsScreen = () => {
  const [records, setRecords] = useState<SettlementRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<SettlementRecord | null>(null);
  const insets = useSafeAreaInsets();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settlementApi.getSettlements();
      setRecords(res.data ?? []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <View className="flex-1 bg-authBg">
      <AppHeader title="Settlement Logs" />

      <FlatList
        data={records}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchLogs} tintColor="#ff6b35" />
        }
        renderItem={({ item }) => (
          <LogItem record={item} onPress={() => setSelected(item)} />
        )}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-24">
              <Ionicons name="time-outline" size={44} color="#8c9196" />
              <Text className="text-sm font-semibold text-textPrimary mt-4">No settlements yet</Text>
              <Text className="text-xs text-textSecondary mt-1 text-center px-8">
                Past settlements will show up here once you complete the first one.
              </Text>
            </View>
          ) : (
            <ActivityIndicator color="#ff6b35" style={{ marginTop: 48 }} />
          )
        }
      />

      <DetailModal record={selected} onClose={() => setSelected(null)} />
    </View>
  );
};

export default SettlementLogsScreen;
