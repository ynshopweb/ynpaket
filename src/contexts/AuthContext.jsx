import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

// Pesan error Firebase Auth diterjemahkan ke Bahasa Indonesia yang ramah pengguna
function terjemahkanErrorAuth(error) {
  const code = error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau password salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan gagal. Coba lagi beberapa saat lagi.';
    case 'auth/network-request-failed':
      return 'Koneksi internet bermasalah. Periksa jaringan Anda.';
    default:
      return 'Terjadi kesalahan. Silakan coba lagi.';
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      return { success: true, user: cred.user };
    } catch (error) {
      return { success: false, message: terjemahkanErrorAuth(error) };
    }
  };

  const logout = () => signOut(auth);

  // Reset password: Firebase mengirim email berisi tautan konfirmasi ganti password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (error) {
      return { success: false, message: terjemahkanErrorAuth(error) };
    }
  };

  const value = { user, authLoading, login, logout, resetPassword };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  return ctx;
}
