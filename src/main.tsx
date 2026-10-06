import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// กรองข้อความแจ้งเตือนรบกวนจาก Browser Extensions ภายนอก (เช่น Google Translate, IDM, Password Managers)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    if (msg.includes('A listener indicated an asynchronous response') || msg.includes('message channel closed')) {
      event.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
