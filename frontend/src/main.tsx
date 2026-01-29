
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App';
console.log('🔧 main.tsx loaded');
// Global error logging for debugging white screen
createRoot(document.getElementById('root')!).render(
  <App />
)
