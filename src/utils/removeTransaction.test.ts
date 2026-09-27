import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types/transaction';
import { removeTransaction } from './removeTransaction';

const transactions: Transaction[] = [
  {
    id: 'transaction-1',
    type: 'expense',
    description: 'Groceries',
    amount: 42.5,
    category: 'Food',
    date: '2026-09-17',
    updatedAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'transaction-2',
    type: 'income',
    description: 'Salary',
    amount: 2500,
    category: 'Salary',
    date: '2026-09-18',
    updatedAt: '2026-09-18T10:00:00.000Z',
  },
  {
    id: 'transaction-3',
    type: 'expense',
    description: 'Book',
    amount: 15,
    category: 'Education',
    date: '2026-09-19',
    updatedAt: '2026-09-19T10:00:00.000Z',
  },
];

describe('removeTransaction', () => {
  it('removes only the transaction with the matching id', () => {
    const result = removeTransaction(transactions, 'transaction-2');

    expect(result).toEqual([transactions[0], transactions[2]]);
  });

  it('keeps the remaining transactions in the same order', () => {
    const result = removeTransaction(transactions, 'transaction-1');

    expect(result.map((transaction) => transaction.id)).toEqual([
      'transaction-2',
      'transaction-3',
    ]);
  });

  it('does not mutate the original list', () => {
    const originalTransactions = [...transactions];

    const result = removeTransaction(transactions, 'transaction-2');

    expect(transactions).toEqual(originalTransactions);
    expect(result).not.toBe(transactions);
  });

  it('returns all transactions when the id does not exist', () => {
    const result = removeTransaction(transactions, 'missing-transaction');

    expect(result).toEqual(transactions);
    expect(result).not.toBe(transactions);
  });

  it('returns an empty list when removing from an empty list', () => {
    expect(removeTransaction([], 'transaction-1')).toEqual([]);
  });
});
