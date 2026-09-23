const AuthApp = {
  init() {
    document.getElementById('tab-login')?.addEventListener('click', () => this.showLogin());
    document.getElementById('tab-register')?.addEventListener('click', () => this.showRegister());
    document.getElementById('btn-do-login')?.addEventListener('click', () => this.login());
    document.getElementById('btn-do-register')?.addEventListener('click', () => this.register());

    ['login-email','login-password'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.login();
      });
    });
    ['reg-name','reg-email','reg-password','reg-password2'].forEach(id => {
      document.getElementById(id)?.addEventListener('keydown', e => {
        if (e.key === 'Enter') this.register();
      });
    });
  },

  showLogin() {
    document.getElementById('form-login')?.classList.remove('hidden');
    document.getElementById('form-register')?.classList.add('hidden');
    document.getElementById('tab-login')?.classList.add('active');
    document.getElementById('tab-register')?.classList.remove('active');
    this.clearMsg();
  },

  showRegister() {
    document.getElementById('form-login')?.classList.add('hidden');
    document.getElementById('form-register')?.classList.remove('hidden');
    document.getElementById('tab-login')?.classList.remove('active');
    document.getElementById('tab-register')?.classList.add('active');
    this.clearMsg();
  },

  msg(text, type) {
    const el = document.getElementById('auth-message');
    if (!el) return;
    el.textContent = text;
    el.className = 'auth-message ' + (type || '');
    el.style.display = text ? 'block' : 'none';
  },

  clearMsg() { this.msg(''); },

  errText(error) {
    const c = error?.code || '';
    if (c === 'auth/invalid-email') return 'Nieprawidłowy e-mail';
    if (c === 'auth/user-not-found' || c === 'auth/wrong-password' || c === 'auth/invalid-credential') return 'Błędny e-mail lub hasło';
    if (c === 'auth/email-already-in-use') return 'Ten e-mail jest już zajęty';
    if (c === 'auth/weak-password') return 'Hasło min. 6 znaków';
    if (c === 'auth/too-many-requests') return 'Za dużo prób — spróbuj później';
    if (c === 'auth/network-request-failed') return 'Brak połączenia z siecią';
    return error?.message || 'Błąd logowania';
  },

  async login() {
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    if (!email || !password) {
      this.msg('Podaj e-mail i hasło', 'error');
      return;
    }
    this.msg('Logowanie...', 'info');
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      this.msg('Zalogowano!', 'success');
    } catch (e) {
      this.msg(this.errText(e), 'error');
    }
  },

  async register() {
    const name = document.getElementById('reg-name')?.value.trim();
    const email = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;
    const password2 = document.getElementById('reg-password2')?.value;
    if (!name || !email || !password) {
      this.msg('Wypełnij imię, e-mail i hasło', 'error');
      return;
    }
    if (password.length < 6) {
      this.msg('Hasło min. 6 znaków', 'error');
      return;
    }
    if (password !== password2) {
      this.msg('Hasła nie są takie same', 'error');
      return;
    }
    this.msg('Tworzenie konta...', 'info');
    try {
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
      const profile = {
        id: cred.user.uid,
        username: name,
        email,
        avatar: name[0].toUpperCase(),
        goal: 'general',
        level: 'beginner',
        createdAt: new Date().toISOString()
      };
      Storage.saveUser(profile);
      Storage.setAuthUid(cred.user.uid);
      await firebase.firestore().collection('users').doc(cred.user.uid).set({
        profile,
        workouts: [],
        plans: [],
        customEx: [],
        settings: Storage.getSettings(),
        bodyLog: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      this.msg('Konto utworzone!', 'success');
    } catch (e) {
      this.msg(this.errText(e), 'error');
    }
  },

  async logout() {
    try {
      Storage.setAuthUid(null);
      Storage.clearLocalUserData();
      await firebase.auth().signOut();
    } catch (e) {
      console.warn(e);
    }
  }
};
