import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { formatCurrency } from '../../../utils/date';
import type { Expense } from '../../../types/expense';

interface ExpenseListItemProps {
  expense: Expense;
  onPress: () => void;
}

const ExpenseListItem = ({ expense, onPress }: ExpenseListItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center bg-white rounded-2xl p-3 mb-3 border border-border"
  >
    {expense.image ? (
      <Image source={{ uri: expense.image }} className="w-12 h-12 rounded-xl mr-3" />
    ) : (
      <View className="w-12 h-12 rounded-xl bg-authBg items-center justify-center mr-3">
        <Ionicons name="receipt-outline" size={20} color="#8c9196" />
      </View>
    )}

    <View className="flex-1">
      <Text className="text-sm font-semibold text-textPrimary" numberOfLines={1}>
        {expense.title}
      </Text>
      <Text className="text-xs text-textSecondary mt-0.5">
        {expense.userId?.name} · {dayjs(expense.date).format('MMM D, YYYY')}
      </Text>
    </View>

    <Text className="text-sm font-bold text-textPrimary ml-2">
      {formatCurrency(expense.amount)}
    </Text>
  </TouchableOpacity>
);

export default ExpenseListItem;