import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase project configuration
// You can get this from the Firebase Console -> Project Settings -> General
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "0000000000",
  appId: "1:0000000000:web:0000000000"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);