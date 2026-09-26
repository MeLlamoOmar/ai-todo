import type { Transaction, TransactionFormValues } from '../types/transaction';
import { validateTransactionValues } from './validateTransactionValues';

export function createTransaction(values: TransactionFormValues): Transaction {
  const transactionValues = validateTransactionValues(values);
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    ...transactionValues,
    updatedAt: timestamp,
  };
}
