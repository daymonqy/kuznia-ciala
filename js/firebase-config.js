// ============================================
// KONFIGURACJA FIREBASE – WYPEŁNIJ SWOIMI DANYMI
// ============================================
// 1. Wejdź na https://console.firebase.google.com
// 2. Utwórz projekt (np. "kuznia-ciala")
// 3. Dodaj aplikację Web (+)
// 4. Skopiuj obiekt firebaseConfig poniżej
// 5. W Authentication → Sign-in method włącz "Email/Password"
// 6. W Firestore Database utwórz bazę (tryb testowy na start)
// ============================================

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBM0s2mABAPNDAQBrjS0KNdpghqiQnylbw",
  authDomain: "kuznia-ciala-136bb.firebaseapp.com",
  projectId: "kuznia-ciala-136bb",
  storageBucket: "kuznia-ciala-136bb.firebasestorage.app",
  messagingSenderId: "188779890694",
  appId: "1:188779890694:web:687b6348db8fbb56cd9b87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
