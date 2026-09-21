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

const firebaseConfig = {
  apiKey: "WSTAW_SWOJ_API_KEY",
  authDomain: "WSTAW_SWOJ_PROJECT_ID.firebaseapp.com",
  projectId: "WSTAW_SWOJ_PROJECT_ID",
  storageBucket: "WSTAW_SWOJ_PROJECT_ID.appspot.com",
  messagingSenderId: "WSTAW_SENDER_ID",
  appId: "WSTAW_SWOJ_APP_ID"
};

// Inicjalizacja (nie ruszaj poniżej)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}