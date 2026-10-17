import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import { TooltipProvider } from './components/ui/tooltip'
import './index.css'
import App from './App.tsx'
import AuthPage from './pages/AuthPage'
import AuthProvider from './components/AuthProvider'
import RequireAuth from './components/RequireAuth'
import NotFoundPage from './pages/NotFoundPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<RequireAuth />} />
              <Route path="auth" element={<AuthPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </StrictMode>,
)
