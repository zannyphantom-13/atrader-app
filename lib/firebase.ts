import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// @ts-ignore
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ST_BUCKET = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'atrader-54ae9.firebasestorage.app';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDQobYUvPH6msqkwrGDXZ-TkST53rb58D8",
  authDomain: `${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "atrader-54ae9"}.firebaseapp.com`,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "atrader-54ae9",
  storageBucket: ST_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "389902445630",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:389902445630:web:0710191b5b7f051031756f",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with React Native persistence
let auth: ReturnType<typeof getAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error: any) {
  auth = getAuth(app);
}

// Initialize Firestore with offline persistence
let db: any;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache(),
  });
} catch (error: any) {
  if (error?.message?.includes('already been called')) {
    db = getFirestore(app);
  } else {
    try {
      db = getFirestore(app);
    } catch {
      // Fallback
    }
  }
}

// Initialize Storage
const storage = getStorage(app);

export { app, db, storage, auth };
