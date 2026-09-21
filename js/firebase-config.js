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

if (typeof firebase !== 'undefined') {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  try {
    var db = firebase.firestore();
    // Pomaga przy problemach "client is offline" w niektórych sieciach / przeglądarkach
    db.settings({ experimentalForceLongPolling: true, merge: true });
    db.enableNetwork().catch(function () {});
  } catch (e) {
    console.warn('Firestore settings:', e);
  }
}
