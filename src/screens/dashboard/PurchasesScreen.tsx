import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppHeader from '../../components/AppHeader';
import ExpenseListItem from '../dashboard/components/ExpenseListItem';
import ExpenseFormModal from './components/ExpenseFormModal';
import { usePurchases } from './hooks/usePurchases';
import type { Expense } from '../../types/expense';

const PurchasesScreen = () => {
  const { items, loading, refreshing, loadMore, refresh, reload } = usePurchases();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setModalVisible(true);
  };

  const handleSuccess = () => {
    setModalVisible(false);
    reload();
  };

  return (
    <View className="flex-1 bg-white">
      <AppHeader title="Purchases" />

      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <ExpenseListItem expense={item} onPress={() => openEditModal(item)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loading && !refreshing ? (
            <ActivityIndicator size="small" color="#ff6b35" style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View className="items-center justify-center py-24">
              <Ionicons name="cart-outline" size={40} color="#8c9196" />
              <Text className="text-textSecondary text-sm mt-3">No purchases yet</Text>
            </View>
          ) : null
        }
      />

      <ExpenseFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleSuccess}
        editingExpense={editingExpense}
      />
    </View>
  );
};

export default PurchasesScreen;