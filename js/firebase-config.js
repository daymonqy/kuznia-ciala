// ============================================
// KONFIGURACJA FIREBASE
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyBM0s2mABAPNDAQBrjS0KNdpghqiQnylbw",
  authDomain: "kuznia-ciala-136bb.firebaseapp.com",
  projectId: "kuznia-ciala-136bb",
  storageBucket: "kuznia-ciala-136bb.firebasestorage.app",
  messagingSenderId: "188779890694",
  appId: "1:188779890694:web:687b6348db8fbb56cd9b87"
};

// Inicjalizacja (wersja compat – musi być zgodna z auth.js)
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
}
