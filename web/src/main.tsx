import { ThemeProvider } from 'next-themes'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV && new URLSearchParams(location.search).has('scan')) {
  void import('react-scan').then(({ scan }) => scan({ enabled: true }))
}

createRoot(document.getElementById('root')!).render(
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="flow-theme"><App /></ThemeProvider>,
)
