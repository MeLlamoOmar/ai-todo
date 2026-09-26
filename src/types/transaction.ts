export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  updatedAt: string;
};

export type TransactionFormValues = Omit<
  Transaction,
  'id' | 'createdAt' | 'updatedAt'
>;
