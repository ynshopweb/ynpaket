import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function EyeIcon({ open }) {
  return open ? (
    // Mata terbuka = password terlihat
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    // Mata dicoret = password disembunyikan
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a21.6 21.6 0 0 1 5.06-6.06M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a21.6 21.6 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LoginView() {
  const { login, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mode, setMode] = useState('login'); // 'login' | 'forgot'
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    if (!resetEmail) {
      setResetError('Masukkan email Anda terlebih dahulu.');
      return;
    }
    setResetLoading(true);
    const result = await resetPassword(resetEmail);
    setResetLoading(false);
    if (result.success) {
      setResetSent(true);
    } else {
      setResetError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-pink-200 mb-3">
            YN
          </div>
          <h1 className="font-bold text-slate-900 text-xl">YN Paket</h1>
          <p className="text-xs text-slate-500">Stok & Package Tracker</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          {mode === 'login' ? (
            <>
              <h2 className="font-semibold text-slate-900 text-lg mb-1">Masuk ke Akun</h2>
              <p className="text-sm text-slate-500 mb-5">Khusus pengguna terdaftar. Silakan login dengan email dan password Anda.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl shadow-sm transition-all text-sm"
                >
                  {loading ? 'Memproses...' : 'Masuk'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setResetEmail(email);
                    setResetSent(false);
                    setResetError('');
                  }}
                  className="w-full text-center text-xs text-rose-600 hover:text-rose-700 font-medium pt-1"
                >
                  Lupa password?
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-slate-900 text-lg mb-1">Reset Password</h2>
              <p className="text-sm text-slate-500 mb-5">
                Masukkan email akun Anda. Kami akan mengirimkan tautan konfirmasi untuk mengganti password melalui email.
              </p>

              {resetSent ? (
                <div className="text-sm bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-3 py-3 mb-4">
                  Link reset password telah dikirim ke <strong>{resetEmail}</strong>. Silakan cek inbox (atau folder spam) email Anda.
                </div>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="nama@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
                    />
                  </div>

                  {resetError && (
                    <div className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl px-3 py-2">
                      {resetError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-xl shadow-sm transition-all text-sm"
                  >
                    {resetLoading ? 'Mengirim...' : 'Kirim Link Reset'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-700 font-medium pt-4"
              >
                ← Kembali ke halaman login
              </button>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Akun hanya dapat dibuat oleh admin. Hubungi admin bila belum memiliki akun.
        </p>
      </div>
    </div>
  );
}

export default LoginView;
