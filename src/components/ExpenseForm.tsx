import { useState, type SubmitEvent } from 'react';
import type { ExpenseFormValues } from '../types/expense';
import { isValidDate } from '../utils/date';

type ExpenseFormProps = {
  onSubmit: (expense: ExpenseFormValues) => void;
};

type FormErrors = Partial<Record<keyof ExpenseFormValues, string>>;

function getToday() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60_000;

  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function ExpenseForm({ onSubmit }: ExpenseFormProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(getToday);
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const parsedAmount = Number(amount);

    if (!description.trim()) {
      nextErrors.description = 'Description is required.';
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Amount must be greater than zero.';
    }

    if (!category.trim()) {
      nextErrors.category = 'Category is required.';
    }

    if (!isValidDate(date)) {
      nextErrors.date = 'Enter a valid date.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      description: description.trim(),
      amount: parsedAmount,
      category: category.trim(),
      date,
    });

    setDescription('');
    setAmount('');
    setCategory('');
    setDate(getToday());
    setErrors({});
  }

  return (
    <form
      className="mx-auto w-full max-w-xl space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={handleSubmit}
      noValidate
    >
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Add expense</h1>
        <p className="mt-1 text-sm text-slate-600">
          Record an expense to keep track of your spending.
        </p>
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="description"
        >
          Description
        </label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          id="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          aria-describedby={
            errors.description ? 'description-error' : undefined
          }
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600" id="description-error">
            {errors.description}
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="amount"
        >
          Amount
        </label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-describedby={errors.amount ? 'amount-error' : undefined}
          aria-invalid={Boolean(errors.amount)}
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600" id="amount-error">
            {errors.amount}
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="category"
        >
          Category
        </label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          id="category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-describedby={errors.category ? 'category-error' : undefined}
          aria-invalid={Boolean(errors.category)}
        />
        {errors.category && (
          <p className="mt-1 text-sm text-red-600" id="category-error">
            {errors.category}
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium text-slate-700"
          htmlFor="date"
        >
          Date
        </label>
        <input
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          id="date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          aria-describedby={errors.date ? 'date-error' : undefined}
          aria-invalid={Boolean(errors.date)}
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600" id="date-error">
            {errors.date}
          </p>
        )}
      </div>

      <button
        className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        type="submit"
      >
        Add expense
      </button>
    </form>
  );
}

export default ExpenseForm;
