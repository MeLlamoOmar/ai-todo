import { describe, expect, it } from 'vitest';
import type { Transaction } from '../types/transaction';
import { calculateTransactionSummary } from './calculateTransactionSummary';

const transactions: Transaction[] = [
  {
    id: 'transaction-1',
    type: 'income',
    description: 'Salary',
    amount: 100.75,
    category: 'Salary',
    date: '2026-09-17',
    updatedAt: '2026-09-17T10:00:00.000Z',
  },
  {
    id: 'transaction-2',
    type: 'expense',
    description: 'Groceries',
    amount: 45.25,
    category: 'Food',
    date: '2026-09-18',
    updatedAt: '2026-09-18T10:00:00.000Z',
  },
];

describe('calculateTransactionSummary', () => {
  it('returns zero totals for an empty list', () => {
    expect(calculateTransactionSummary([])).toEqual({
      income: 0,
      expenses: 0,
      balance: 0,
    });
  });

  it('calculates income, expenses, and balance separately', () => {
    expect(calculateTransactionSummary(transactions)).toEqual({
      income: 100.75,
      expenses: 45.25,
      balance: 55.5,
    });
  });

  it('returns a negative balance when expenses exceed income', () => {
    expect(
      calculateTransactionSummary([
        ...transactions,
        {
          ...transactions[1],
          id: 'transaction-3',
          amount: 70,
        },
      ]).balance,
    ).toBe(-14.5);
  });

  it('does not mutate the original list', () => {
    const originalTransactions = transactions.map((transaction) => ({
      ...transaction,
    }));

    calculateTransactionSummary(transactions);

    expect(transactions).toEqual(originalTransactions);
  });
});
