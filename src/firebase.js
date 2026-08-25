// Konfigurasi & inisialisasi Firebase untuk aplikasi YN Paket
// Menghubungkan aplikasi ke Firebase Authentication (login) dan
// Cloud Firestore (database semua data: paket, akun CO, produk, dll)

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { isSupported, getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCatvaeT0ohChnOtsD4rYTK8970y5_pL-c",
  authDomain: "ynpaket.firebaseapp.com",
  projectId: "ynpaket",
  storageBucket: "ynpaket.firebasestorage.app",
  messagingSenderId: "689538684090",
  appId: "1:689538684090:web:a6a35bcb19fbb429609e83",
  measurementId: "G-W9ER0RX35X"
};

// Initialize Firebase (guard against re-init during hot-reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Auth & Firestore instances used across the app
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics hanya berjalan di browser & bila didukung (mis. tidak di SSR)
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported()
    .then((supported) => {
      if (supported) analytics = getAnalytics(app);
    })
    .catch(() => {
      /* analytics tidak tersedia, abaikan */
    });
}

export default app;
