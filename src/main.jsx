import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './contexts/AuthContext.jsx';
import './index.css';

// Dua "aplikasi" terpisah dalam satu project:
//  - /co  -> Form CO untuk user (publik, tanpa login). Kode dashboard admin
//            TIDAK ikut dimuat di halaman ini (code-splitting lewat lazy).
//  - lainnya -> Dashboard admin (wajib login).
const FormCoPage = lazy(() => import('./pages/FormCoPage.jsx'));
const App = lazy(() => import('./App.jsx'));

const path = window.location.pathname.replace(/\/+$/, '');
const isFormCo = path === '/co';

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-10 h-10 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin"></div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<Loading />}>
      {isFormCo ? (
        <FormCoPage />
      ) : (
        <AuthProvider>
          <App />
        </AuthProvider>
      )}
    </Suspense>
  </React.StrictMode>
);
