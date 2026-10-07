import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const ST_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'atrader-54ae9.firebasestorage.app';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: ST_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore with offline persistence
let db: any;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
  });
} catch (error: any) {
  if (error.message.includes('already been called')) {
    db = getFirestore(app);
  } else {
    throw error;
  }
}

// Initialize Storage
const storage = getStorage(app);

export { app, db, storage, auth };
