const Profile = {
  step: 0,
  data: {},

  steps: [
    {
      title: 'Witaj w Kuźni Ciała',
      subtitle: 'Zacznijmy od podstawowych danych. Możesz je później zmienić.',
      fields: [
        { key: 'username', label: 'Pseudonim / Imię', type: 'text', required: true },
        { key: 'age', label: 'Wiek', type: 'number', min: 14, max: 90 },
        { key: 'gender', label: 'Płeć', type: 'chips', options: [{ id: 'm', name: 'Mężczyzna' }, { id: 'f', name: 'Kobieta' }, { id: 'o', name: 'Inna' }] }
      ]
    },
    {
      title: 'Cel treningowy',
      subtitle: 'Jaki jest Twój główny cel?',
      fields: [
        { key: 'goal', label: 'Główny cel', type: 'chips-grid', options: GOALS }
      ]
    },
    {
      title: 'Poziom zaawansowania',
      subtitle: 'Jak oceniasz swój staż?',
      fields: [
        { key: 'level', label: 'Poziom', type: 'chips-grid', options: LEVELS },
        { key: 'experience', label: 'Staż treningowy', type: 'chips', options: [
          { id: '0-6m', name: '0–6 mies.' }, { id: '6-12m', name: '6–12 mies.' },
          { id: '1-3y', name: '1–3 lata' }, { id: '3y+', name: '3+ lata' }
        ]}
      ]
    },
    {
      title: 'Częstotliwość',
      subtitle: 'Ile dni w tygodniu planujesz trenować?',
      fields: [
        { key: 'daysPerWeek', label: 'Treningi / tydzień', type: 'chips', options: [
          { id: 2, name: '2' }, { id: 3, name: '3' }, { id: 4, name: '4' },
          { id: 5, name: '5' }, { id: 6, name: '6' }
        ]},
        { key: 'prefDays', label: 'Preferowane dni', type: 'chips-multi', options: [
          { id: 'pon', name: 'Pon' }, { id: 'wt', name: 'Wt' }, { id: 'sr', name: 'Śr' },
          { id: 'czw', name: 'Czw' }, { id: 'pt', name: 'Pt' }, { id: 'sob', name: 'Sob' }, { id: 'nd', name: 'Nd' }
        ]}
      ]
    },
    {
      title: 'Dostępny sprzęt',
      subtitle: 'Co masz do dyspozycji? (możesz dodać więcej później)',
      fields: [
        { key: 'equipment', label: 'Sprzęt', type: 'chips-multi', options: EQUIPMENT_LIST.map(e => ({ id: e, name: e })) }
      ]
    },
    {
      title: 'Pomiary',
      subtitle: 'Opcjonalnie – pomogą w śledzeniu postępów.',
      fields: [
        { key: 'height', label: 'Wzrost (cm)', type: 'number', min: 120, max: 230 },
        { key: 'weight', label: 'Masa ciała (kg)', type: 'number', min: 30, max: 250, step: 0.1 }
      ]
    },
    {
      title: 'Gotowe!',
      subtitle: 'Możesz od razu stworzyć plan lub przejść do dashboardu.',
      fields: []
    }
  ],

  start() {
    this.step = 0;
    this.data = {
      username: '',
      age: null,
      gender: null,
      goal: null,
      level: null,
      experience: null,
      daysPerWeek: 3,
      prefDays: [],
      equipment: [],
      height: null,
      weight: null,
      createdAt: new Date().toISOString()
    };
    this.render();
  },

  render() {
    const container = document.getElementById('onboarding-steps');
    const progress = document.getElementById('onb-progress');
    const s = this.steps[this.step];
    progress.style.width = `${((this.step + 1) / this.steps.length) * 100}%`;

    let fieldsHtml = '';
    s.fields.forEach(f => {
      if (f.type === 'text' || f.type === 'number') {
        fieldsHtml += `
          <div class="form-group">
            <label>${f.label}</label>
            <input class="form-input" type="${f.type}" id="onb-${f.key}" value="${this.data[f.key] ?? ''}"
              ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''}
              ${f.step ? `step="${f.step}"` : ''} placeholder="${f.label}">
          </div>`;
      } else if (f.type === 'chips' || f.type === 'chips-grid' || f.type === 'chips-multi') {
        const isMulti = f.type === 'chips-multi';
        const grid = f.type === 'chips-grid' ? 'chip-grid' : 'chip-group';
        const opts = f.options.map(o => {
          const id = typeof o === 'string' ? o : o.id;
          const name = typeof o === 'string' ? o : o.name;
          const active = isMulti
            ? (this.data[f.key] || []).includes(id)
            : this.data[f.key] == id;
          return `<div class="chip ${active ? 'active' : ''}" data-key="${f.key}" data-val="${id}" data-multi="${isMulti}">${name}</div>`;
        }).join('');
        fieldsHtml += `
          <div class="form-group">
            <label>${f.label}</label>
            <div class="${grid}">${opts}</div>
          </div>`;
      }
    });

    const isLast = this.step === this.steps.length - 1;
    container.innerHTML = `
      <div class="onb-step">
        <h2>${s.title}</h2>
        <p class="subtitle">${s.subtitle}</p>
        ${fieldsHtml}
        <div class="onb-actions">
          ${this.step > 0 ? `<button class="btn btn-secondary" id="onb-back">Wstecz</button>` : '<div></div>'}
          <button class="btn btn-primary" id="onb-next">${isLast ? 'Zakończ' : 'Dalej'}</button>
        </div>
        ${isLast ? `<button class="btn btn-ghost btn-block mt-12" id="onb-skip-plan">Przejdź do dashboardu</button>` : ''}
      </div>`;

    container.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.key;
        const val = chip.dataset.val;
        const multi = chip.dataset.multi === 'true';
        if (multi) {
          let arr = this.data[key] || [];
          if (arr.includes(val) || arr.includes(Number(val))) {
            arr = arr.filter(x => x != val);
          } else {
            arr.push(isNaN(val) ? val : Number(val));
          }
          this.data[key] = arr;
        } else {
          this.data[key] = isNaN(val) ? val : Number(val);
        }
        this.render();
      });
    });

    document.getElementById('onb-next')?.addEventListener('click', () => this.next());
    document.getElementById('onb-back')?.addEventListener('click', () => { this.step--; this.render(); });
    document.getElementById('onb-skip-plan')?.addEventListener('click', () => this.finish());
  },

  next() {
    this.steps[this.step].fields.forEach(f => {
      if (f.type === 'text' || f.type === 'number') {
        const el = document.getElementById(`onb-${f.key}`);
        if (el) {
          this.data[f.key] = f.type === 'number' ? (el.value ? Number(el.value) : null) : el.value.trim();
        }
      }
    });
    if (this.step === 0 && !this.data.username) {
      Utils.toast('Podaj pseudonim');
      return;
    }
    if (this.step < this.steps.length - 1) {
      this.step++;
      this.render();
    } else {
      this.finish();
    }
  },

  finish() {
    const user = {
      ...this.data,
      id: Utils.uid(),
      avatar: (this.data.username || 'U')[0].toUpperCase(),
      stats: { workouts: 0, sets: 0, tonnage: 0 }
    };
    Storage.saveUser(user);
    Storage.setOnboarded();
    this.seedStarterPlan(user);
    App.showMain();
    Utils.toast('Witaj w Kuźni Ciała! 💪');
  },

  seedStarterPlan(user) {
    const goal = user.goal || 'general';
    const plan = {
      id: Utils.uid(),
      name: goal === 'strength' ? 'Siła – Full Body' : goal === 'mass' ? 'Masa – Upper/Lower' : 'Plan startowy',
      description: 'Automatycznie wygenerowany plan na start. Edytuj według potrzeb.',
      level: user.level || 'beginner',
      goal: goal,
      days: [
        {
          name: 'Trening A',
          exercises: [
            { exerciseId: 'squat_barbell', sets: 3, reps: '6-10', rir: 2, rest: 180 },
            { exerciseId: 'bp_barbell', sets: 3, reps: '6-10', rir: 2, rest: 150 },
            { exerciseId: 'row_barbell', sets: 3, reps: '8-12', rir: 2, rest: 120 },
            { exerciseId: 'ohp_barbell', sets: 3, reps: '6-10', rir: 2, rest: 120 },
            { exerciseId: 'curl_dumbbell', sets: 2, reps: '10-15', rir: 2, rest: 90 }
          ]
        },
        {
          name: 'Trening B',
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: '5-8', rir: 2, rest: 180 },
            { exerciseId: 'incline_bp', sets: 3, reps: '8-12', rir: 2, rest: 120 },
            { exerciseId: 'pullup', sets: 3, reps: '6-10', rir: 2, rest: 120 },
            { exerciseId: 'rdl', sets: 3, reps: '8-12', rir: 2, rest: 120 },
            { exerciseId: 'lateral_raise', sets: 3, reps: '12-15', rir: 2, rest: 60 }
          ]
        }
      ],
      createdAt: new Date().toISOString()
    };
    Storage.savePlans([plan]);
  },

  renderView() {
    const user = Storage.getUser();
    if (!user) return '<div class="empty-state"><p>Brak profilu</p></div>';
    const stats = Storage.getTotalStats();
    const bodyLog = Storage.getBodyLog();

    return `
      <div class="profile-header">
        <div class="profile-avatar-lg">${user.avatar || 'U'}</div>
        <div>
          <div class="profile-name">${user.username || 'Użytkownik'}</div>
          <div class="profile-goal">${GOALS.find(g => g.id === user.goal)?.name || 'Brak celu'} · ${LEVELS.find(l => l.id === user.level)?.name || ''}</div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${stats.workouts}</div><div class="stat-label">Treningi</div></div>
        <div class="stat-box"><div class="stat-value">${stats.sets}</div><div class="stat-label">Serie</div></div>
        <div class="stat-box"><div class="stat-value">${(stats.tonnage/1000).toFixed(1)}t</div><div class="stat-label">Tonnage</div></div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${stats.avgRir ?? '–'}</div><div class="stat-label">Śr. RIR</div></div>
        <div class="stat-box"><div class="stat-value">${stats.avgRpe ?? '–'}</div><div class="stat-label">Śr. RPE</div></div>
        <div class="stat-box"><div class="stat-value">${Utils.formatDuration(stats.duration)}</div><div class="stat-label">Czas</div></div>
      </div>

      <div class="card mt-16">
        <div class="card-title">Dane profilu</div>
        <div class="text-sm text-secondary" style="line-height:1.8">
          Wiek: ${user.age || '–'} · Wzrost: ${user.height ? user.height + ' cm' : '–'} · Masa: ${user.weight ? user.weight + ' kg' : '–'}<br>
          Staż: ${user.experience || '–'} · Dni/tydzień: ${user.daysPerWeek || '–'}
        </div>
        <button class="btn btn-secondary btn-block mt-12" id="btn-edit-profile">Edytuj profil</button>
      </div>

      <div class="card">
        <div class="card-title">Historia masy ciała</div>
        ${bodyLog.length === 0 ? '<p class="text-secondary text-sm">Brak wpisów. Dodaj pomiar w ustawieniach.</p>' :
          bodyLog.slice(0, 5).map(b => `<div class="flex-between text-sm mb-8"><span>${Utils.formatDate(b.date)}</span><span class="font-bold">${b.weight} kg</span></div>`).join('')}
      </div>

      <button class="btn btn-secondary btn-block mt-16" id="btn-settings">Ustawienia</button>
      <button class="btn btn-ghost btn-block mt-8" id="btn-logout" style="color:var(--danger)">Wyloguj / Reset danych</button>
    `;
  },

  bindView() {
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => this.showEditModal());
    document.getElementById('btn-settings')?.addEventListener('click', () => App.navigate('settings'));
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      if (Utils.confirm('Usunąć wszystkie dane lokalne?')) {
        localStorage.clear();
        location.reload();
      }
    });
  },

  showEditModal() {
    const user = Storage.getUser();
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Edytuj profil</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="form-group"><label>Pseudonim</label><input class="form-input" id="edit-username" value="${user.username || ''}"></div>
      <div class="form-group"><label>Wiek</label><input class="form-input" type="number" id="edit-age" value="${user.age || ''}"></div>
      <div class="form-group"><label>Wzrost (cm)</label><input class="form-input" type="number" id="edit-height" value="${user.height || ''}"></div>
      <div class="form-group"><label>Masa (kg)</label><input class="form-input" type="number" step="0.1" id="edit-weight" value="${user.weight || ''}"></div>
      <div class="form-group"><label>Cel</label>
        <select class="form-select" id="edit-goal">${GOALS.map(g => `<option value="${g.id}" ${user.goal===g.id?'selected':''}>${g.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Poziom</label>
        <select class="form-select" id="edit-level">${LEVELS.map(l => `<option value="${l.id}" ${user.level===l.id?'selected':''}>${l.name}</option>`).join('')}</select>
      </div>
      <button class="btn btn-primary btn-block mt-16" id="save-profile">Zapisz</button>
    `);
    document.getElementById('save-profile').addEventListener('click', () => {
      user.username = document.getElementById('edit-username').value.trim() || user.username;
      user.age = Number(document.getElementById('edit-age').value) || user.age;
      user.height = Number(document.getElementById('edit-height').value) || user.height;
      const newW = Number(document.getElementById('edit-weight').value);
      if (newW && newW !== user.weight) {
        user.weight = newW;
        Storage.addBodyLog({ date: new Date().toISOString(), weight: newW });
      }
      user.goal = document.getElementById('edit-goal').value;
      user.level = document.getElementById('edit-level').value;
      user.avatar = user.username[0].toUpperCase();
      Storage.saveUser(user);
      Utils.closeModal();
      App.navigate('profile');
      Utils.toast('Profil zaktualizowany');
    });
  }
};
