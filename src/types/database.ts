import type { TransactionType } from './transaction';

export type TransactionRow = {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      transactions: {
        Row: TransactionRow;
        Insert: Pick<
          TransactionRow,
          'type' | 'description' | 'amount' | 'category' | 'date'
        > &
          Partial<Pick<TransactionRow, 'id' | 'created_at' | 'updated_at'>>;
        Update: Partial<TransactionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: { transaction_type: TransactionType };
    CompositeTypes: Record<string, never>;
  };
};
