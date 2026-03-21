import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: "AIzaSyAR29RLS8JnQkivOEuYjbcAiMHtngB2UrY",
  authDomain: "camisas-2026.firebaseapp.com",
  projectId: "camisas-2026",
  storageBucket: "camisas-2026.firebasestorage.app",
  messagingSenderId: "133649785821",
  appId: "1:133649785821:web:6aa0c43f6ee1c1f0b38c34"
};

// Safety check: verify if the user has actually configured the keys.
const isConfigured = firebaseConfig.apiKey !== "";

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