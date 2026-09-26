import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TransactionRow } from '../types/database'
import type { Transaction } from '../types/transaction'
import {
  deleteTransaction,
  fromTransactionRow,
  insertTransaction,
  listTransactions,
  saveTransaction,
  toTransactionRow,
} from './transactionRepository'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({ from: fromMock }),
}))

const row: TransactionRow = {
  id: 'cb086d0f-61b0-4af8-aa56-2aaf03647fb5',
  type: 'expense',
  description: 'Groceries',
  amount: 42.5,
  category: 'Food',
  date: '2026-09-25',
  created_at: '2026-09-25T12:00:00+00:00',
  updated_at: '2026-09-25T12:00:00+00:00',
}

const transaction: Transaction = {
  id: row.id,
  type: row.type,
  description: row.description,
  amount: row.amount,
  category: row.category,
  date: row.date,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
}

function mockSingleOperation(
  method: 'insert' | 'update' | 'delete',
  response: { data: TransactionRow | null; error: Error | null },
) {
  const single = vi.fn().mockResolvedValue(response)
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const operation = vi
    .fn()
    .mockReturnValue(method === 'insert' ? { select } : { eq })

  fromMock.mockReturnValue({ [method]: operation })
  return { operation, eq, select, single }
}

beforeEach(() => {
  fromMock.mockReset()
})

describe('transaction row conversion', () => {
  it('converts database snake_case fields into the app model', () => {
    expect(fromTransactionRow(row)).toEqual(transaction)
    expect(row.created_at).toBe(transaction.createdAt)
  })

  it('converts the app model into a database row without mutation', () => {
    const original = { ...transaction }

    expect(toTransactionRow(transaction)).toEqual(row)
    expect(transaction).toEqual(original)
  })
})

describe('transaction repository', () => {
  it('loads transactions newest first and converts their rows', async () => {
    const lastOrder = vi.fn().mockResolvedValue({ data: [row], error: null })
    const firstOrder = vi.fn().mockReturnValue({ order: lastOrder })
    const select = vi.fn().mockReturnValue({ order: firstOrder })
    fromMock.mockReturnValue({ select })

    await expect(listTransactions()).resolves.toEqual([transaction])
    expect(fromMock).toHaveBeenCalledWith('transactions')
    expect(firstOrder).toHaveBeenCalledWith('created_at', {
      ascending: false,
    })
    expect(lastOrder).toHaveBeenCalledWith('id', { ascending: false })
  })

  it('propagates load errors', async () => {
    const error = new Error('Read failed')
    const lastOrder = vi.fn().mockResolvedValue({ data: null, error })
    const firstOrder = vi.fn().mockReturnValue({ order: lastOrder })
    fromMock.mockReturnValue({
      select: vi.fn().mockReturnValue({ order: firstOrder }),
    })

    await expect(listTransactions()).rejects.toThrow('Read failed')
  })

  it('inserts a transaction and returns the saved row', async () => {
    const { operation, select } = mockSingleOperation('insert', {
      data: row,
      error: null,
    })

    await expect(insertTransaction(transaction)).resolves.toEqual(transaction)
    expect(operation).toHaveBeenCalledWith(row)
    expect(select).toHaveBeenCalled()
  })

  it('propagates insert errors', async () => {
    mockSingleOperation('insert', {
      data: null,
      error: new Error('Insert failed'),
    })

    await expect(insertTransaction(transaction)).rejects.toThrow('Insert failed')
  })

  it('updates only the editable fields and returns the saved row', async () => {
    const savedRow = {
      ...row,
      description: 'Weekly groceries',
      updated_at: '2026-09-26T13:00:00+00:00',
    }
    const { operation, eq } = mockSingleOperation('update', {
      data: savedRow,
      error: null,
    })

    await expect(saveTransaction(transaction)).resolves.toEqual(
      fromTransactionRow(savedRow),
    )
    expect(operation).toHaveBeenCalledWith({
      type: transaction.type,
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      updated_at: transaction.updatedAt,
    })
    expect(eq).toHaveBeenCalledWith('id', transaction.id)
  })

  it('propagates update errors', async () => {
    mockSingleOperation('update', {
      data: null,
      error: new Error('Update failed'),
    })

    await expect(saveTransaction(transaction)).rejects.toThrow('Update failed')
  })

  it('deletes only the requested id', async () => {
    const { eq, select } = mockSingleOperation('delete', {
      data: row,
      error: null,
    })

    await expect(deleteTransaction(transaction.id)).resolves.toBeUndefined()
    expect(eq).toHaveBeenCalledWith('id', transaction.id)
    expect(select).toHaveBeenCalledWith('id')
  })

  it('propagates delete errors', async () => {
    mockSingleOperation('delete', {
      data: null,
      error: new Error('Delete failed'),
    })

    await expect(deleteTransaction(transaction.id)).rejects.toThrow(
      'Delete failed',
    )
  })
})
