import type { TransactionType } from './transaction';

export type TransactionRow = {
  id: string;
  user_id: string | null;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
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
          Partial<Pick<TransactionRow, 'id' | 'updated_at' | 'user_id'>>;
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
