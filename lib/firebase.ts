import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, type Analytics, isSupported } from 'firebase/analytics'

let app: FirebaseApp | null = null
let analytics: Analytics | null = null

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    })
  }
  return app!
}

export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null
  if (analytics) return analytics
  try {
    if (await isSupported()) {
      analytics = getAnalytics(getFirebaseApp())
      return analytics
    }
  } catch {
    // ignore
  }
  return null
}
