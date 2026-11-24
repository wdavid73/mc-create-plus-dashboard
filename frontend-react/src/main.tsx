import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ApiError } from '@/api/client'
import './index.css'
import App from './App.tsx'

function redirectToLoginOn401(error: unknown) {
  if (
    error instanceof ApiError &&
    error.status === 401 &&
    window.location.pathname !== '/login'
  ) {
    window.location.assign('/login')
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({ onError: redirectToLoginOn401 }),
  mutationCache: new MutationCache({ onError: redirectToLoginOn401 }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
