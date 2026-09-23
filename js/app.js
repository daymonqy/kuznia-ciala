const App = {
  currentView: 'dashboard',
  _authReady: false,

  init() {
    AuthApp.init();

    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        if (view === 'live') {
          this.navigate('live');
          return;
        }
        this.navigate(view);
      });
    });

    document.getElementById('btn-profile')?.addEventListener('click', () => this.navigate('profile'));
    document.getElementById('btn-menu')?.addEventListener('click', () => this.showMenu());
    document.getElementById('btn-search')?.addEventListener('click', () => this.showSearch());

    document.getElementById('modal-overlay')?.addEventListener('click', e => {
      if (e.target.id === 'modal-overlay') Utils.closeModal();
    });

    if (typeof firebase === 'undefined') {
      document.getElementById('loading-screen')?.classList.remove('active');
      this.showAuth('Brak Firebase — odśwież stronę');
      return;
    }

    firebase.auth().onAuthStateChanged(async (user) => {
      document.getElementById('loading-screen')?.classList.remove('active');
      if (user) {
        Storage.setAuthUid(user.uid);
        await Storage.loadFromCloud(user.uid);
        let profile = Storage.getUser();
        if (!profile || !profile.username) {
          profile = {
            id: user.uid,
            username: user.displayName || (user.email || 'U').split('@')[0],
            email: user.email || '',
            avatar: ((user.displayName || user.email || 'U')[0] || 'U').toUpperCase(),
            goal: 'general',
            level: 'beginner',
            createdAt: new Date().toISOString()
          };
          Storage.saveUser(profile);
          await Storage.syncToCloud();
        } else if (!profile.email && user.email) {
          profile.email = user.email;
          Storage.saveUser(profile);
        }
        this.showMain();
      } else {
        Storage.setAuthUid(null);
        this.showAuth();
      }
      this._authReady = true;
    });
  },

  showAuth(extraMsg) {
    document.getElementById('main-app')?.classList.remove('active');
    document.getElementById('auth-screen')?.classList.add('active');
    AuthApp.showLogin();
    if (extraMsg) AuthApp.msg(extraMsg, 'error');
  },

  showMain() {
    document.getElementById('auth-screen')?.classList.remove('active');
    document.getElementById('main-app')?.classList.add('active');
    const user = Storage.getUser();
    if (user) {
      const av = document.getElementById('header-avatar');
      if (av) av.textContent = user.avatar || (user.username || 'U')[0].toUpperCase();
    }
    this.navigate('dashboard');
  },

  navigate(view) {
    this.currentView = view;
    document.querySelectorAll('.nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view || (view === 'live' && b.dataset.view === 'live'));
    });
    this.refresh();
  },

  refresh() {
    const content = document.getElementById('content');
    if (!content) return;
    switch (this.currentView) {
      case 'dashboard':
        content.innerHTML = Dashboard.render();
        Dashboard.bind();
        break;
      case 'exercises':
        content.innerHTML = Exercises.render();
        Exercises.bind();
        break;
      case 'workout':
      case 'plans':
        content.innerHTML = Plans.render();
        Plans.bind();
        break;
      case 'live':
        content.innerHTML = Workout.render();
        Workout.bind();
        break;
      case 'progress':
      case 'records':
        content.innerHTML = Progress.render();
        Progress.bind();
        break;
      case 'history':
        content.innerHTML = History.render();
        History.bind();
        break;
      case 'recovery':
        content.innerHTML = Recovery.render();
        Recovery.bind();
        break;
      case 'calculator':
        content.innerHTML = Calculator.render();
        Calculator.bind();
        break;
      case 'profile':
        content.innerHTML = Profile.renderView();
        Profile.bindView();
        break;
      case 'settings':
        content.innerHTML = Settings.render();
        Settings.bind();
        break;
      default:
        content.innerHTML = Dashboard.render();
        Dashboard.bind();
    }
    content.scrollTop = 0;
  },

  showMenu() {
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Menu</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${
          [
            { v: 'dashboard', l: 'Start / Dashboard' },
            { v: 'live', l: 'Rozpocznij trening' },
            { v: 'exercises', l: 'Baza ćwiczeń' },
            { v: 'plans', l: 'Plany treningowe' },
            { v: 'history', l: 'Historia' },
            { v: 'recovery', l: 'Regeneracja' },
            { v: 'progress', l: 'Postęp i rekordy' },
            { v: 'calculator', l: 'Kalkulator ciężaru' },
            { v: 'profile', l: 'Profil' },
            { v: 'settings', l: 'Ustawienia' }
          ].map(i => `
          <button class="btn btn-secondary btn-block menu-nav" data-v="${i.v}" style="justify-content:flex-start;padding:14px 18px">${i.l}</button>
        `).join('')
        }
      </div>
    `);
    document.querySelectorAll('.menu-nav').forEach(btn => {
      btn.addEventListener('click', () => {
        Utils.closeModal();
        this.navigate(btn.dataset.v);
      });
    });
  },

  showSearch() {
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Szukaj</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <input class="search-input" id="global-search" placeholder="Ćwiczenia, plany..." autofocus>
      <div id="search-results" class="mt-16"></div>
    `);
    document.getElementById('global-search')?.addEventListener('input', e => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) { document.getElementById('search-results').innerHTML = ''; return; }
      const ex = Utils.allExercises().filter(x => x.name.toLowerCase().includes(q)).slice(0, 8);
      document.getElementById('search-results').innerHTML = ex.map(x => `
        <div class="exercise-item search-ex" data-id="${x.id}">
          <div class="ex-thumb">${x.icon || '🏋️'}</div>
          <div class="ex-info"><div class="ex-name">${x.name}</div>
          <div class="ex-meta"><span class="ex-badge">${Utils.muscleShort(x.musclePrimary)}</span></div></div>
        </div>
      `).join('') || '<p class="text-muted text-sm">Brak wyników</p>';
      document.querySelectorAll('.search-ex').forEach(item => {
        item.addEventListener('click', () => {
          Utils.closeModal();
          this.navigate('exercises');
          setTimeout(() => Exercises.showDetail(item.dataset.id), 100);
        });
      });
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
