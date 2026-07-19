import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import dayjs from 'dayjs';

import AppHeader from '../../components/AppHeader';
import { useSettlement } from './hooks/useSettlement';
import { formatCurrency } from '../../utils/date';
import type { SettlementTransaction, UserBalanceSnapshot } from '../../api/settlement';

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-1 bg-authBg rounded-2xl p-4 items-center">
    <Text className="text-xs text-textSecondary mb-1">{label}</Text>
    <Text className="text-base font-bold text-textPrimary">{value}</Text>
  </View>
);

const TransactionRow = ({ item }: { item: SettlementTransaction }) => (
  <View className="flex-row items-center py-3 border-b border-border last:border-0">
    <View className="w-8 h-8 rounded-full bg-orange-100 items-center justify-center mr-3">
      <Text className="text-primary text-xs font-bold">
        {item.fromName.charAt(0).toUpperCase()}
      </Text>
    </View>
    <View className="flex-1">
      <Text className="text-sm text-textPrimary">
        <Text className="font-semibold">{item.fromName}</Text>
        <Text className="text-textSecondary"> needs to give </Text>
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
  const label = isEven ? 'All even' : isPositive ? 'Will get back' : 'Needs to give';

  return (
    <View className="flex-row items-center py-3 border-b border-border">
      <View className="w-9 h-9 rounded-full bg-primary items-center justify-center mr-3">
        <Text className="text-white text-sm font-bold">
          {person.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-textPrimary">{person.name}</Text>
        <Text className="text-xs text-textSecondary">
          Spent {formatCurrency(person.totalAmount)}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-sm font-bold" style={{ color }}>
          {isEven ? '—' : `${isPositive ? '+' : ''}${formatCurrency(person.balance)}`}
        </Text>
        <Text className="text-xs" style={{ color }}>{label}</Text>
      </View>
    </View>
  );
};

// ─── Confirm Modal ────────────────────────────────────────────────────────────

interface ConfirmModalProps {
  visible: boolean;
  totalAmount: number;
  settling: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmModal = ({ visible, totalAmount, settling, onCancel, onConfirm }: ConfirmModalProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <Pressable className="flex-1 bg-black/50 items-center justify-center px-6" onPress={onCancel}>
      <Pressable onPress={() => {}} className="bg-white rounded-2xl w-full p-6">
        <View className="w-14 h-14 rounded-full bg-orange-100 items-center justify-center self-center mb-4">
          <Ionicons name="flash" size={28} color="#ff6b35" />
        </View>
        <Text className="text-lg font-bold text-textPrimary text-center mb-2">
          Settle {formatCurrency(totalAmount)}?
        </Text>
        <Text className="text-sm text-textSecondary text-center mb-6 px-2">
          Everyone settles up, history stays. A new cycle starts right after.
        </Text>
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={onCancel}
            disabled={settling}
            className="flex-1 h-12 rounded-xl border border-border items-center justify-center"
          >
            <Text className="text-textPrimary font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onConfirm}
            disabled={settling}
            className="flex-1 h-12 rounded-xl bg-primary items-center justify-center"
          >
            {settling ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold">Settle Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

const SettlementScreen = () => {
  const { preview, lastSettlement, loading, settling, refresh, settle } = useSettlement();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSettle = async () => {
    setConfirmOpen(false);
    await settle();
  };

  return (
    <View className="flex-1 bg-authBg">
      <AppHeader title="Settlement" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#ff6b35" />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Current cycle card ── */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-bold text-textPrimary">Current Cycle</Text>
            {lastSettlement && (
              <Text className="text-xs text-textSecondary">
                Since {dayjs(lastSettlement.settledAt).format('MMM D, hh:mm A')}
              </Text>
            )}
          </View>

          {!preview ? (
            <View className="items-center py-8">
              <Ionicons name="checkmark-circle-outline" size={40} color="#52c41a" />
              <Text className="text-sm font-semibold text-textPrimary mt-3">All Settled Up</Text>
              <Text className="text-xs text-textSecondary mt-1 text-center px-4">
                {lastSettlement
                  ? 'Nothing new since the last settlement.'
                  : 'Add some purchases to get started.'}
              </Text>
            </View>
          ) : (
            <>
              {/* Stats row */}
              <View className="flex-row gap-3 mb-5">
                <StatCard label="Total Spent" value={formatCurrency(preview.totalAmount)} />
                <StatCard label="Per Person" value={formatCurrency(preview.perPersonShare)} />
                <StatCard label="People" value={String(preview.userSnapshot?.length ?? 0)} />
              </View>

              {/* Who owes whom */}
              {preview.transactions?.length > 0 && (
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
                    Who Pays Whom
                  </Text>
                  <View className="bg-authBg rounded-xl px-3">
                    {preview.transactions.map((item, idx) => (
                      <TransactionRow key={`${item.fromId}-${item.toId}-${idx}`} item={item} />
                    ))}
                  </View>
                </View>
              )}

              {/* Balances */}
              <View className="mb-5">
                <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
                  Balances
                </Text>
                <View className="bg-authBg rounded-xl px-3">
                  {preview.userSnapshot?.map((person) => (
                    <BalanceRow key={person.userId} person={person} />
                  ))}
                </View>
              </View>

              {/* Settle button */}
              <TouchableOpacity
                onPress={() => setConfirmOpen(true)}
                disabled={settling}
                className={`bg-primary h-13 rounded-xl items-center justify-center flex-row gap-2 ${settling ? 'opacity-60' : ''}`}
                style={{ height: 52 }}
              >
                <Ionicons name="flash" size={18} color="#fff" />
                <Text className="text-white font-bold text-base">
                  Settle All — {formatCurrency(preview.totalAmount)}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* ── Last settlement card ── */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-sm font-bold text-textPrimary">Last Settlement</Text>
            {lastSettlement && (
              <View className="bg-green-50 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                <Ionicons name="checkmark-circle" size={12} color="#52c41a" />
                <Text className="text-xs text-green-700">
                  {dayjs(lastSettlement.settledAt).format('MMM D, hh:mm A')}
                </Text>
              </View>
            )}
          </View>

          {!lastSettlement ? (
            <View className="items-center py-8">
              <Ionicons name="time-outline" size={40} color="#8c9196" />
              <Text className="text-sm text-textSecondary mt-3">No settlements yet</Text>
            </View>
          ) : (
            <>
              <Text className="text-xs text-textSecondary mb-4">
                {dayjs(lastSettlement.periodFrom).format('MMM D')} →{' '}
                {dayjs(lastSettlement.periodTo).format('MMM D, YYYY')}
              </Text>

              <View className="flex-row gap-3 mb-5">
                <StatCard label="Total" value={formatCurrency(lastSettlement.totalAmount)} />
                <StatCard label="Per Person" value={formatCurrency(lastSettlement.perPersonShare)} />
                <StatCard label="People" value={String(lastSettlement.userSnapshot?.length ?? 0)} />
              </View>

              {lastSettlement.transactions?.length > 0 && (
                <View className="mb-4">
                  <Text className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
                    Payments
                  </Text>
                  <View className="bg-authBg rounded-xl px-3">
                    {lastSettlement.transactions.map((item, idx) => (
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
                  {lastSettlement.userSnapshot?.map((person) => (
                    <BalanceRow key={person.userId} person={person} />
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <ConfirmModal
        visible={confirmOpen}
        totalAmount={preview?.totalAmount ?? 0}
        settling={settling}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSettle}
      />
    </View>
  );
};

export default SettlementScreen;
