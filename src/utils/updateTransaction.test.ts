import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Transaction, TransactionFormValues } from '../types/transaction';
import { updateTransaction } from './updateTransaction';

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
    type: 'expense',
    description: 'Bus fare',
    amount: 2.5,
    category: 'Transport',
    date: '2026-09-18',
    updatedAt: '2026-09-18T10:00:00.000Z',
  },
  {
    id: 'transaction-3',
    type: 'income',
    description: 'Salary',
    amount: 2500,
    category: 'Salary',
    date: '2026-09-19',
    updatedAt: '2026-09-19T10:00:00.000Z',
  },
];

const updatedValues: TransactionFormValues = {
  type: 'income',
  description: 'Freelance project',
  amount: 450,
  category: 'Freelance',
  date: '2026-09-20',
};

afterEach(() => {
  vi.useRealTimers();
});

describe('updateTransaction', () => {
  it('updates only the matching transaction and can change its type', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-21T12:00:00.000Z'));

    const result = updateTransaction(
      transactions,
      'transaction-2',
      updatedValues,
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toBe(transactions[0]);
    expect(result[2]).toBe(transactions[2]);
    expect(result[1]).toMatchObject({
      ...updatedValues,
      id: 'transaction-2',
      updatedAt: '2026-09-21T12:00:00.000Z',
    });
  });

  it('keeps transactions in order without mutating the original list', () => {
    const originalTransactions = transactions.map((transaction) => ({
      ...transaction,
    }));

    const result = updateTransaction(
      transactions,
      'transaction-2',
      updatedValues,
    );

    expect(result.map((transaction) => transaction.id)).toEqual([
      'transaction-1',
      'transaction-2',
      'transaction-3',
    ]);
    expect(transactions).toEqual(originalTransactions);
    expect(result).not.toBe(transactions);
  });

  it('returns all transactions when the id does not exist', () => {
    const result = updateTransaction(
      transactions,
      'missing-transaction',
      updatedValues,
    );

    expect(result).toEqual(transactions);
    expect(result).not.toBe(transactions);
  });

  it('normalizes text values before updating a transaction', () => {
    const result = updateTransaction(transactions, 'transaction-2', {
      ...updatedValues,
      description: '  Freelance project  ',
      category: '  Freelance  ',
    });

    expect(result[1].description).toBe('Freelance project');
    expect(result[1].category).toBe('Freelance');
  });

  it.each([
    { ...updatedValues, description: '' },
    { ...updatedValues, amount: 0 },
    { ...updatedValues, category: '   ' },
    { ...updatedValues, date: '2026-02-30' },
  ])('rejects invalid transaction values', (values) => {
    expect(() =>
      updateTransaction(transactions, 'transaction-2', values),
    ).toThrow();
  });
});
