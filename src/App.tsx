import ExpenseForm from './components/ExpenseForm'

function App() {
  return (
    <main className="min-h-svh bg-slate-50 p-4 sm:p-8">
      <ExpenseForm onSubmit={() => undefined} />
    </main>
  )
}

export default App
