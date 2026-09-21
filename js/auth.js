// System autoryzacji i danych użytkownika
// Wszystkie akcje użytkownika są zapisywane pod jego UID w Firestore

const auth = firebase.auth();
const db = firebase.firestore();

// Globalny stan użytkownika
let currentUser = null;

// Nasłuchiwanie stanu logowania
auth.onAuthStateChanged((user) => {
  currentUser = user;
  updateUIForAuth(user);
  if (typeof onAuthStateChanged === 'function') {
    onAuthStateChanged(user);
  }
});

// Aktualizacja UI na podstawie stanu logowania
function updateUIForAuth(user) {
  const authStatus = document.getElementById('auth-status');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  const userPanel = document.getElementById('user-panel');
  const authTabs = document.getElementById('auth-tabs');

  if (user) {
    // Zalogowany
    if (authStatus) {
      const label = user.displayName || user.email;
      authStatus.innerHTML = `<i class="fas fa-user-check"></i> ${label}`;
      authStatus.classList.add('logged-in');
    }
    if (formLogin) formLogin.style.display = 'none';
    if (formRegister) formRegister.style.display = 'none';
    if (authTabs) authTabs.style.display = 'none';
    if (userPanel) {
      userPanel.style.display = 'block';
      const emailEl = document.getElementById('user-email');
      if (emailEl) emailEl.textContent = user.email;
      const nameEl = document.getElementById('user-name');
      if (nameEl && user.displayName) nameEl.textContent = user.displayName;
    }
  } else {
    // Niezalogowany – domyślnie rejestracja
    if (authStatus) {
      authStatus.innerHTML = `<i class="fas fa-user"></i> Gość`;
      authStatus.classList.remove('logged-in');
    }
    if (userPanel) userPanel.style.display = 'none';
    if (authTabs) authTabs.style.display = 'flex';
    showRegisterForm();
  }
}

// --- FORMULARZE ---
function showLoginForm() {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  if (formLogin) formLogin.style.display = 'block';
  if (formRegister) formRegister.style.display = 'none';
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  if (tabLogin) tabLogin.classList.add('active');
  if (tabRegister) tabRegister.classList.remove('active');
}

function showRegisterForm() {
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');
  if (formLogin) formLogin.style.display = 'none';
  if (formRegister) formRegister.style.display = 'block';
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  if (tabLogin) tabLogin.classList.remove('active');
  if (tabRegister) tabRegister.classList.add('active');
}

// --- LOGOWANIE ---
async function login(email, password) {
  try {
    showMessage('Logowanie...', 'info');
    await auth.signInWithEmailAndPassword(email, password);
    showMessage('Zalogowano pomyślnie!', 'success');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  }
}

// --- REJESTRACJA (imię + e-mail + hasło) ---
async function register(name, email, password) {
  try {
    showMessage('Tworzenie konta...', 'info');
    const cred = await auth.createUserWithEmailAndPassword(email, password);

    // Ustawiamy imię w profilu Firebase Auth
    await cred.user.updateProfile({ displayName: name });

    // Tworzymy profil użytkownika w Firestore
    await db.collection('users').doc(cred.user.uid).set({
      name: name,
      displayName: name,
      email: email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      workouts: [],
      favorites: [],
      progress: {}
    });

    showMessage('Konto utworzone! Witaj, ' + name + '!', 'success');
  } catch (error) {
    showMessage(getErrorMessage(error), 'error');
  }
}

// --- WYLOGOWANIE ---
async function logout() {
  try {
    await auth.signOut();
    showMessage('Wylogowano', 'info');
  } catch (error) {
    showMessage('Błąd wylogowania', 'error');
  }
}

// --- ZAPISYWANIE DANYCH UŻYTKOWNIKA ---

async function saveUserData(field, value) {
  if (!currentUser) {
    showMessage('Musisz być zalogowany, aby zapisać dane', 'error');
    return false;
  }
  try {
    await db.collection('users').doc(currentUser.uid).update({
      [field]: value,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(error);
    showMessage('Błąd zapisu danych', 'error');
    return false;
  }
}

async function addToUserArray(field, item) {
  if (!currentUser) {
    showMessage('Musisz być zalogowany', 'error');
    return false;
  }
  try {
    await db.collection('users').doc(currentUser.uid).update({
      [field]: firebase.firestore.FieldValue.arrayUnion(item),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error(error);
    showMessage('Błąd zapisu', 'error');
    return false;
  }
}

async function getUserData() {
  if (!currentUser) return null;
  try {
    const doc = await db.collection('users').doc(currentUser.uid).get();
    return doc.exists ? doc.data() : null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function saveWorkout(workout) {
  if (!currentUser) {
    showMessage('Zaloguj się, aby zapisać trening', 'error');
    return false;
  }
  const workoutWithMeta = {
    ...workout,
    id: Date.now().toString(),
    date: new Date().toISOString(),
    userId: currentUser.uid
  };
  return await addToUserArray('workouts', workoutWithMeta);
}

// --- POMOCNICZE ---
function showMessage(text, type = 'info') {
  let el = document.getElementById('auth-message');
  if (!el) {
    el = document.createElement('div');
    el.id = 'auth-message';
    el.className = 'auth-message';
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.className = `auth-message ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3500);
}

function getErrorMessage(error) {
  const map = {
    'auth/email-already-in-use': 'Ten e-mail jest już zajęty',
    'auth/invalid-email': 'Nieprawidłowy adres e-mail',
    'auth/weak-password': 'Hasło musi mieć min. 6 znaków',
    'auth/user-not-found': 'Nie znaleziono konta z tym e-mailem',
    'auth/wrong-password': 'Błędne hasło',
    'auth/invalid-credential': 'Błędny e-mail lub hasło',
    'auth/too-many-requests': 'Zbyt wiele prób. Spróbuj później',
    'auth/network-request-failed': 'Brak połączenia z internetem'
  };
  return map[error.code] || error.message || 'Wystąpił błąd';
}

function isFirebaseConfigured() {
  return typeof firebaseConfig !== 'undefined' && firebaseConfig.apiKey && firebaseConfig.apiKey !== 'WSTAW_SWOJ_API_KEY';
}

// Event listenery formularzy
document.addEventListener('DOMContentLoaded', () => {
  if (!isFirebaseConfigured()) {
    const warning = document.getElementById('firebase-warning');
    if (warning) warning.style.display = 'block';
  }

  const loginFormEl = document.getElementById('form-login');
  if (loginFormEl) {
    loginFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      login(email, password);
    });
  }

  const registerFormEl = document.getElementById('form-register');
  if (registerFormEl) {
    registerFormEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const password2 = document.getElementById('register-password2').value;

      if (!name || name.length < 2) {
        showMessage('Podaj imię (min. 2 znaki)', 'error');
        return;
      }
      if (password !== password2) {
        showMessage('Hasła nie są takie same', 'error');
        return;
      }
      if (password.length < 6) {
        showMessage('Hasło musi mieć min. 6 znaków', 'error');
        return;
      }
      register(name, email, password);
    });
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }
});
