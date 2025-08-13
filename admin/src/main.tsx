import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'

// Initialize dev tools in development
if (process.env.NODE_ENV === 'development') {
  import('./utils/devTools').then(({ adminDevTools }) => {
    console.log('🛠️ Admin Dev Tools loaded');
    console.log('Use Ctrl+Shift+P for performance report');
    console.log('Use Ctrl+Shift+R for route report');
    console.log('Use Ctrl+Shift+L to preload all routes');
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
