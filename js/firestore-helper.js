// Wspólne funkcje Firestore z ponawianiem przy offline
async function firestoreGetUserDoc(db, uid, retries) {
  retries = retries == null ? 3 : retries;
  var lastErr = null;
  for (var i = 0; i < retries; i++) {
    try {
      await db.enableNetwork();
      var snap = await db.collection('users').doc(uid).get({ source: 'server' });
      return snap;
    } catch (e) {
      lastErr = e;
      console.warn('Firestore get attempt ' + (i + 1), e);
      await new Promise(function (r) { setTimeout(r, 800 * (i + 1)); });
    }
  }
  // ostatnia próba: cache
  try {
    return await db.collection('users').doc(uid).get();
  } catch (e2) {
    throw lastErr || e2;
  }
}

async function firestoreSaveUserData(db, uid, data) {
  await db.enableNetwork();
  await db.collection('users').doc(uid).set(data, { merge: true });
}

function firestoreOfflineHint(err) {
  var m = (err && (err.message || err.code || '')) || '';
  if (m.indexOf('offline') !== -1 || m.indexOf('unavailable') !== -1) {
    return (
      'Firestore jest offline / niedostępne. Sprawdź:\n' +
      '1) Internet\n' +
      '2) Firebase Console → Firestore Database → Create database (tryb testowy na start)\n' +
      '3) Reguły: allow read, write if request.auth.uid == userId\n' +
      '4) Odśwież stronę (Ctrl+F5)'
    );
  }
  if (err && err.code === 'permission-denied') {
    return 'Brak uprawnień Firestore (permission-denied). Ustaw reguły dla /users/{userId}.';
  }
  return 'Błąd Firestore: ' + m;
}
