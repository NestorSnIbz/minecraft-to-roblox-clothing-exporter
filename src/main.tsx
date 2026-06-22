import { ViteReactSSG } from 'vite-react-ssg'
import { routes } from './App.tsx'
import './index.css'

// Bypass hydration for dynamic client-side routes to prevent hydration mismatch crashes
if (typeof window !== 'undefined') {
  const isDynamicRoute = window.location.pathname.startsWith('/share/');
  if (isDynamicRoute) {
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.removeAttribute('data-server-rendered');
      rootEl.innerHTML = '';
    }
  }
}

export const createRoot = ViteReactSSG({
  routes,
})
