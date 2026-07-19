import { z } from 'zod';

export const expenseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  amount: z
    .string()
    .trim()
    .min(1, 'Amount is required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  note: z.string().trim().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;