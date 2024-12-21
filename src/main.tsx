import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import Index from './pages/Index'
import { SidebarProvider } from '@/contexts/SidebarContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <App>
          <BrowserRouter>
            <Index />
          </BrowserRouter>
        </App>
      </SidebarProvider>
    </QueryClientProvider>
  </React.StrictMode>
)