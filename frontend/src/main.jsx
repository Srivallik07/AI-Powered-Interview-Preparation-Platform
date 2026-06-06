import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Fetch Interceptor to handle JWT token expiration (401 Unauthorized)
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    if (response.status === 401) {
      const token = localStorage.getItem('token');
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        // Only redirect if we are not on the auth page or landing page to avoid redirect loops
        if (!window.location.pathname.startsWith('/auth') && window.location.pathname !== '/') {
          window.location.href = '/auth?expired=true';
        }
      }
    }
    return response;
  } catch (error) {
    throw error;
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
