import type { TransactionRow } from '../types/database';
import type { Transaction } from '../types/transaction';
import { getSupabaseClient } from '../lib/supabaseClient';

const columns = 'id,type,description,amount,category,date,created_at,updated_at';

export function fromTransactionRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    description: row.description,
    amount: row.amount,
    category: row.category,
    date: row.date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toTransactionRow(transaction: Transaction): TransactionRow {
  return {
    id: transaction.id,
    type: transaction.type,
    description: transaction.description,
    amount: transaction.amount,
    category: transaction.category,
    date: transaction.date,
    created_at: transaction.createdAt,
    updated_at: transaction.updatedAt,
  };
}

export async function listTransactions(): Promise<Transaction[]> {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .select(columns)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map(fromTransactionRow);
}

export async function insertTransaction(
  transaction: Transaction,
): Promise<Transaction> {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .insert(toTransactionRow(transaction))
    .select(columns)
    .single();

  if (error) {
    throw error;
  }

  return fromTransactionRow(data);
}

export async function saveTransaction(
  transaction: Transaction,
): Promise<Transaction> {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .update({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      updated_at: transaction.updatedAt,
    })
    .eq('id', transaction.id)
    .select(columns)
    .single();

  if (error) {
    throw error;
  }

  return fromTransactionRow(data);
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('transactions')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    throw error;
  }
}
