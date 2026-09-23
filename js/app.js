const App = {
  currentView: 'dashboard',

  init() {
    setTimeout(() => {
      document.getElementById('loading-screen').classList.remove('active');
      if (!Storage.isOnboarded() || !Storage.getUser()) {
        document.getElementById('onboarding-screen').classList.add('active');
        Profile.start();
      } else {
        this.showMain();
      }
    }, 600);

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
  },

  showMain() {
    document.getElementById('onboarding-screen').classList.remove('active');
    document.getElementById('main-app').classList.add('active');
    const user = Storage.getUser();
    if (user) {
      document.getElementById('header-avatar').textContent = user.avatar || 'U';
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

    let html = '';
    switch (this.currentView) {
      case 'dashboard':
        html = Dashboard.render();
        content.innerHTML = html;
        Dashboard.bind();
        break;
      case 'exercises':
        html = Exercises.render();
        content.innerHTML = html;
        Exercises.bind();
        break;
      case 'workout':
      case 'plans':
        html = Plans.render();
        content.innerHTML = html;
        Plans.bind();
        break;
      case 'live':
        html = Workout.render();
        content.innerHTML = html;
        Workout.bind();
        break;
      case 'progress':
        html = Progress.render();
        content.innerHTML = html;
        Progress.bind();
        break;
      case 'history':
        html = History.render();
        content.innerHTML = html;
        History.bind();
        break;
      case 'recovery':
        html = Recovery.render();
        content.innerHTML = html;
        Recovery.bind();
        break;
      case 'calculator':
        html = Calculator.render();
        content.innerHTML = html;
        Calculator.bind();
        break;
      case 'records':
        html = Progress.render();
        content.innerHTML = html;
        break;
      case 'profile':
        html = Profile.renderView();
        content.innerHTML = html;
        Profile.bindView();
        break;
      case 'settings':
        html = Settings.render();
        content.innerHTML = html;
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
