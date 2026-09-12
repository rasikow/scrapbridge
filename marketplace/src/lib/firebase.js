// Firebase bootstrap.
//
// This prototype ships with the `firebase` SDK wired up, but no live project
// keys — Module 1 runs entirely against the mock repository in
// `src/services` so the UI/UX can be demoed without a backend. Drop your own
// project config into a `.env.local` (see `.env.example`) and flip
// `USE_FIREBASE` to `true` to switch every service over to real
// Auth/Firestore/Storage calls without touching any component.

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const USE_FIREBASE = false

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app, auth, db, storage

if (USE_FIREBASE) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
}

export { app, auth, db, storage }
