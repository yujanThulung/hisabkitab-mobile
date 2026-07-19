import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import api from '../../../api/axios';
import { toast } from '../../../utils/toast';
import { expenseSchema, ExpenseFormData } from '../../../validators/expense.validator';
import type { Expense } from '../../../types/expense';

interface ExpenseFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingExpense?: Expense | null;
}

interface RNImageAsset {
  uri: string;
  name: string;
  type: string;
}

const ExpenseFormModal = ({ visible, onClose, onSuccess, editingExpense }: ExpenseFormModalProps) => {
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<RNImageAsset | null>(null);
  const isEditing = !!editingExpense;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: editingExpense?.title ?? '',
      amount: editingExpense ? String(editingExpense.amount) : '',
      note: editingExpense?.note ?? '',
    },
  });

  const resetAndClose = () => {
    reset({ title: '', amount: '', note: '' });
    setImage(null);
    onClose();
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      toast.error('Permission required to access ' + source);
      return;
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        name: asset.fileName ?? `photo_${Date.now()}.jpg`,
        type: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setSubmitting(true);
    try {
      if (isEditing) {
        await api.put(`/expense/update/${editingExpense!._id}`, {
          title: data.title,
          amount: Number(data.amount),
          note: data.note,
        });
        toast.success('Expense updated');
      } else {
        const formData = new FormData();
        formData.append('title', data.title);
        formData.append('amount', String(Number(data.amount)));
        formData.append('date', new Date().toISOString());
        if (data.note) formData.append('note', data.note);
        if (image) {
          formData.append('image', {
            uri: image.uri,
            name: image.name,
            type: image.type,
          } as any);
        }

        await api.post('/expense/create', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Expense added');
      }
      resetAndClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <View className="flex-1 bg-black/40 justify-end">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-border">
              <Text className="text-base font-bold text-textPrimary">
                {isEditing ? 'Edit Expense' : 'Add Expense'}
              </Text>
              <TouchableOpacity onPress={resetAndClose}>
                <Ionicons name="close" size={24} color="#8c9196" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-5 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
              <Text className="text-sm font-semibold text-textPrimary mb-1.5">Title</Text>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-xl px-3 h-12 text-[15px] text-textPrimary ${
                      errors.title ? 'border-danger' : 'border-border'
                    }`}
                    placeholder="e.g. Groceries"
                    placeholderTextColor="#8c9196"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.title && <Text className="text-danger text-xs mt-1">{errors.title.message}</Text>}

              <Text className="text-sm font-semibold text-textPrimary mb-1.5 mt-4">Amount</Text>
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className={`border rounded-xl px-3 h-12 text-[15px] text-textPrimary ${
                      errors.amount ? 'border-danger' : 'border-border'
                    }`}
                    placeholder="0.00"
                    placeholderTextColor="#8c9196"
                    keyboardType="decimal-pad"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              {errors.amount && <Text className="text-danger text-xs mt-1">{errors.amount.message}</Text>}

              {!isEditing && (
                <>
                  <Text className="text-sm font-semibold text-textPrimary mb-1.5 mt-4">Note (optional)</Text>
                  <Controller
                    control={control}
                    name="note"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        className="border border-border rounded-xl px-3 h-12 text-[15px] text-textPrimary"
                        placeholder="Add a note"
                        placeholderTextColor="#8c9196"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                      />
                    )}
                  />
                  <Text className="text-sm font-semibold text-textPrimary mb-1.5 mt-4">
                    Receipt Image (optional)
                  </Text>
                  {image ? (
                    <View className="relative">
                      <Image source={{ uri: image.uri }} className="w-full h-40 rounded-xl" />
                      <TouchableOpacity
                        className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5"
                        onPress={() => setImage(null)}
                      >
                        <Ionicons name="close" size={16} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        className="flex-1 border border-dashed border-border rounded-xl items-center justify-center py-6"
                        onPress={() => pickImage('camera')}
                      >
                        <Ionicons name="camera-outline" size={22} color="#8c9196" />
                        <Text className="text-xs text-textSecondary mt-1">Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className="flex-1 border border-dashed border-border rounded-xl items-center justify-center py-6"
                        onPress={() => pickImage('gallery')}
                      >
                        <Ionicons name="image-outline" size={22} color="#8c9196" />
                        <Text className="text-xs text-textSecondary mt-1">Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              <TouchableOpacity
                className={`bg-primary h-[50px] rounded-xl items-center justify-center mt-6 ${
                  submitting ? 'opacity-60' : ''
                }`}
                onPress={handleSubmit(onSubmit)}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    {isEditing ? 'Update Expense' : 'Add Expense'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default ExpenseFormModal;