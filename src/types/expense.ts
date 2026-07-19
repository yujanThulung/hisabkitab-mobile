export interface ExpenseUser {
  _id: string;
  name: string;
  phone: string;
}

export interface Expense {
  _id: string;
  title: string;
  amount: number;
  image?: string;
  imagePublicId?: string | null;
  note?: string;
  date: string;
  userId: ExpenseUser;
  createdAt: string;
  updatedAt: string;
}

export interface UserTotal {
  userId: string;
  name: string;
  phone: string;
  totalAmount: number;
}

export interface ExpenseSummary {
  grandTotal: number;
  userTotals: UserTotal[];
}

export interface ExpenseListResponse {
  items: Expense[];
  summary: ExpenseSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CreateExpenseDto {
  title: string;
  amount: number;
  note?: string;
  date?: string;
  image?: File;
}

export interface UpdateExpenseDto {
  title?: string;
  amount?: number;
  note?: string;
  date?: string;
}