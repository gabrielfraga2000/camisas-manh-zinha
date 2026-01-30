import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: "AIzaSyBMR4XkaSmbnUsrhk1bm5ZGmizz2cLyGhs",
  authDomain: "manhazinha-camisas.firebaseapp.com",
  projectId: "manhazinha-camisas",
  storageBucket: "manhazinha-camisas.firebasestorage.app",
  messagingSenderId: "1010526078467",
  appId: "1:1010526078467:web:2559ecb8c9c5fb72aeb036"
};

// Safety check: verify if the user has actually configured the keys.
// If not, we don't initialize Firebase to prevent the app from crashing (White Screen).
const isConfigured = firebaseConfig.apiKey !== "AIzaSyBMR4XkaSmbnUsrhk1bm5ZGmizz2cLyGhs";

let app;
let dbInstance;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
  } catch (error) {
    console.error("Failed to initialize Firebase:", error);
  }
} else {
  console.warn("Firebase config is missing. App is running in safe mode (Mock DB recommended).");
}

export const db = dbInstance;