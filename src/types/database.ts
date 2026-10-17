import type { TransactionType, TransactionFormValues } from './transaction.ts';
import type { Integration, CreatedIntegration, IntegrationResult } from './integration.ts';

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
    Functions: {
      create_integration: { Args: { p_name: string }; Returns: CreatedIntegration };
      list_integrations: { Args: Record<string, never>; Returns: Integration[] };
      revoke_integration: { Args: { p_integration_id: string }; Returns: boolean };
      authorize_integration: { Args: { p_token_hash: string }; Returns: IntegrationResult };
      process_integration_transaction: {
        Args: { p_token_hash: string; p_request_key: string; p_values: TransactionFormValues };
        Returns: IntegrationResult;
      };
    };
    Enums: { transaction_type: TransactionType };
    CompositeTypes: Record<string, never>;
  };
};
