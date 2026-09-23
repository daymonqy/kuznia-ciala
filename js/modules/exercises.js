const Exercises = {
  filterMuscle: 'all',
  filterEquip: 'all',
  search: '',

  render() {
    const all = Utils.allExercises();
    let list = all.filter(ex => {
      if (this.search) {
        const q = this.search.toLowerCase();
        if (!ex.name.toLowerCase().includes(q) && !(ex.nameEn || '').toLowerCase().includes(q)) return false;
      }
      if (this.filterMuscle !== 'all' && ex.musclePrimary !== this.filterMuscle) return false;
      if (this.filterEquip !== 'all' && !(ex.equipment || []).includes(this.filterEquip)) return false;
      return true;
    });

    return `
      <div class="flex-between mb-16">
        <div class="section-title" style="margin:0">Ćwiczenia</div>
        <button class="btn btn-primary" id="btn-add-exercise" style="padding:10px 16px;font-size:13px">+ Własne</button>
      </div>

      <div class="search-bar">
        <input class="search-input" id="ex-search" placeholder="Szukaj ćwiczenia..." value="${this.search}">
      </div>

      <div class="filter-chips" id="muscle-filters">
        <div class="filter-chip ${this.filterMuscle==='all'?'active':''}" data-m="all">Wszystkie</div>
        ${MUSCLE_GROUPS.map(m => `<div class="filter-chip ${this.filterMuscle===m.id?'active':''}" data-m="${m.id}">${m.short}</div>`).join('')}
      </div>

      <div class="filter-chips" id="equip-filters">
        <div class="filter-chip ${this.filterEquip==='all'?'active':''}" data-e="all">Sprzęt</div>
        ${['sztanga','hantle','maszyny','wyciag','masa ciała','drazek'].map(e =>
          `<div class="filter-chip ${this.filterEquip===e?'active':''}" data-e="${e}">${e}</div>`).join('')}
      </div>

      <div class="text-sm text-muted mb-8">${list.length} ćwiczeń</div>

      ${list.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Brak wyników</h3>
          <p>Zmień filtry lub dodaj własne ćwiczenie.</p>
        </div>
      ` : list.map(ex => `
        <div class="exercise-item" data-id="${ex.id}">
          <div class="ex-thumb">${ex.icon || '🏋️'}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">
              <span class="ex-badge">${Utils.muscleShort(ex.musclePrimary)}</span>
              <span>${(ex.equipment || []).slice(0,2).join(', ')}</span>
              <span>${ex.difficulty || ''}</span>
            </div>
          </div>
        </div>
      `).join('')}
    `;
  },

  bind() {
    document.getElementById('ex-search')?.addEventListener('input', e => {
      this.search = e.target.value;
      App.refresh();
    });
    document.querySelectorAll('#muscle-filters .filter-chip').forEach(c => {
      c.addEventListener('click', () => {
        this.filterMuscle = c.dataset.m;
        App.refresh();
      });
    });
    document.querySelectorAll('#equip-filters .filter-chip').forEach(c => {
      c.addEventListener('click', () => {
        this.filterEquip = c.dataset.e;
        App.refresh();
      });
    });
    document.querySelectorAll('.exercise-item').forEach(item => {
      item.addEventListener('click', () => this.showDetail(item.dataset.id));
    });
    document.getElementById('btn-add-exercise')?.addEventListener('click', () => this.showAddModal());
  },

  showDetail(id) {
    const ex = Utils.getExerciseById(id);
    if (!ex) return;
    const history = Storage.getExerciseHistory(id);
    const last = history[0];
    const lastSets = last?.sets?.filter(s => s.type !== 'warmup').slice(0, 3) || [];

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${ex.name}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="text-center mb-16" style="font-size:48px">${ex.icon || '🏋️'}</div>
      <div class="ex-meta mb-16" style="justify-content:center">
        <span class="ex-badge">${Utils.muscleName(ex.musclePrimary)}</span>
        ${(ex.muscleSecondary || []).map(m => `<span class="ex-badge" style="background:var(--bg-card);color:var(--text-secondary)">${Utils.muscleShort(m)}</span>`).join('')}
      </div>
      <p class="text-sm text-secondary mb-16">${ex.description || ''}</p>

      <div class="card" style="padding:14px">
        <div class="card-title">Instrukcja</div>
        <p class="text-sm">${ex.instructions || 'Brak'}</p>
      </div>
      ${ex.mistakes?.length ? `
      <div class="card" style="padding:14px">
        <div class="card-title">Najczęstsze błędy</div>
        <ul class="text-sm" style="padding-left:18px;color:var(--text-secondary)">
          ${ex.mistakes.map(m => `<li>${m}</li>`).join('')}
        </ul>
      </div>` : ''}
      ${ex.tips?.length ? `
      <div class="card" style="padding:14px">
        <div class="card-title">Wskazówki</div>
        <ul class="text-sm" style="padding-left:18px;color:var(--text-secondary)">
          ${ex.tips.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </div>` : ''}

      <div class="card" style="padding:14px">
        <div class="card-title">Ostatnie wyniki</div>
        ${lastSets.length ? lastSets.map(s => `
          <div class="flex-between text-sm mb-8">
            <span>${s.weight} kg × ${s.reps}</span>
            <span class="text-muted">RIR ${s.rir ?? '–'} · RPE ${s.rpe ?? '–'}</span>
          </div>
        `).join('') : '<p class="text-sm text-muted">Brak historii</p>'}
      </div>

      <div class="text-xs text-muted mt-8">Sprzęt: ${(ex.equipment || []).join(', ')} · ${ex.difficulty || ''} · ${(ex.type || []).join(', ')}</div>
      ${ex.custom ? `<button class="btn btn-secondary btn-block mt-16" id="btn-delete-ex" data-id="${ex.id}">Usuń własne ćwiczenie</button>` : ''}
    `);

    document.getElementById('btn-delete-ex')?.addEventListener('click', () => {
      if (!Utils.confirm('Usunąć to ćwiczenie?')) return;
      const list = Storage.getCustomExercises().filter(e => e.id !== id);
      Storage.saveCustomExercises(list);
      Utils.closeModal();
      App.refresh();
      Utils.toast('Usunięto');
    });
  },

  showAddModal() {
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Nowe ćwiczenie</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="form-group"><label>Nazwa</label><input class="form-input" id="cex-name" placeholder="np. Face Pull z liną"></div>
      <div class="form-group"><label>Główna partia</label>
        <select class="form-select" id="cex-muscle">${MUSCLE_GROUPS.map(m => `<option value="${m.id}">${m.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Sprzęt</label>
        <select class="form-select" id="cex-equip">${EQUIPMENT_LIST.map(e => `<option value="${e}">${e}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Poziom</label>
        <select class="form-select" id="cex-diff">
          <option value="początkujący">Początkujący</option>
          <option value="średni">Średni</option>
          <option value="zaawansowany">Zaawansowany</option>
        </select>
      </div>
      <div class="form-group"><label>Opis / instrukcja</label><textarea class="form-textarea" id="cex-desc"></textarea></div>
      <button class="btn btn-primary btn-block mt-16" id="cex-save">Zapisz ćwiczenie</button>
    `);
    document.getElementById('cex-save').addEventListener('click', () => {
      const name = document.getElementById('cex-name').value.trim();
      if (!name) { Utils.toast('Podaj nazwę'); return; }
      const ex = {
        id: 'custom_' + Utils.uid(),
        name,
        musclePrimary: document.getElementById('cex-muscle').value,
        muscleSecondary: [],
        equipment: [document.getElementById('cex-equip').value],
        type: ['hipertrofia'],
        difficulty: document.getElementById('cex-diff').value,
        description: document.getElementById('cex-desc').value.trim(),
        instructions: document.getElementById('cex-desc').value.trim(),
        mistakes: [],
        tips: [],
        icon: '⭐',
        custom: true
      };
      const list = Storage.getCustomExercises();
      list.push(ex);
      Storage.saveCustomExercises(list);
      Utils.closeModal();
      App.refresh();
      Utils.toast('Dodano ćwiczenie');
    });
  }
};
