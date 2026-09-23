const Exercises = {
  search: '',
  filterMuscle: 'all',
  filterEquip: 'all',
  treeOpen: false,
  pendingMedia: null,
  editingId: null,
  MAX_MEDIA_KB: 400,

  render() {
    const list = this.getFiltered();
    const filterLabel = this.filterMuscle === 'all'
      ? 'Wszystkie partie'
      : (MuscleTree.label(this.filterMuscle) || this.filterMuscle);

    return `
      <div class="flex-between mb-16">
        <div class="section-title" style="margin:0">Ćwiczenia</div>
        <button class="btn btn-primary" id="btn-add-exercise" style="padding:10px 14px;font-size:13px">+ Utwórz</button>
      </div>

      <div class="ex-filter-bar">
        <div class="ex-filter-muscle">
          <label class="ex-filter-label">Partia mięśniowa</label>
          <button type="button" class="form-select mt-filter-btn" id="ex-muscle-open">${filterLabel}</button>
        </div>
        <div class="ex-filter-search">
          <label class="ex-filter-label">Szukaj</label>
          <input class="search-input" id="ex-search" placeholder="Nazwa ćwiczenia..." value="${this.search.replace(/"/g, '&quot;')}">
        </div>
      </div>

      <div id="ex-muscle-panel" class="mt-filter-panel" ${this.treeOpen ? '' : 'hidden'}>
        <div class="mt-filter-actions">
          <button type="button" class="btn btn-ghost" id="ex-muscle-clear" style="padding:8px 12px;font-size:13px">Wyczyść (wszystkie)</button>
        </div>
        <div id="ex-muscle-tree">${MuscleTree.renderCheckboxTree(
          this.filterMuscle && this.filterMuscle !== 'all' ? [this.filterMuscle] : [],
          'filter'
        )}</div>
      </div>

      <div class="filter-chips mb-12" id="equip-filters">
        <div class="filter-chip ${this.filterEquip==='all'?'active':''}" data-e="all">Sprzęt: wszystkie</div>
        ${EQUIPMENT_LIST.map(e =>
          `<div class="filter-chip ${this.filterEquip===e?'active':''}" data-e="${e}">${e}</div>`
        ).join('')}
      </div>

      <div class="text-sm text-muted mb-8">${list.length} ćwiczeń w bazie</div>

      ${list.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Brak wyników</h3>
          <p>Zmień partię lub frazę wyszukiwania.</p>
        </div>
      ` : list.map(ex => {
        const main = (ex.musclesMain && ex.musclesMain[0]) || ex.musclePrimary;
        const thumb = ex.media?.dataUrl && ex.media.type === 'image'
          ? `<img class="ex-thumb-img" src="${ex.media.dataUrl}" alt="">`
          : (ex.icon || '🏋️');
        return `
        <div class="exercise-item" data-id="${ex.id}">
          <div class="ex-thumb">${thumb}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">
              <span class="ex-badge">${MuscleTree.short(main)}</span>
              ${(ex.musclesSupport || ex.muscleSecondary || []).slice(0, 2).map(m =>
                `<span class="ex-badge" style="background:var(--bg-elevated);color:var(--text-secondary)">${MuscleTree.short(m)}</span>`
              ).join('')}
              <span>${(ex.equipment || []).slice(0, 2).join(', ')}</span>
            </div>
          </div>
        </div>`;
      }).join('')}
    `;
  },

  getFiltered() {
    let list = (typeof EXERCISE_DB !== 'undefined' ? EXERCISE_DB : []).slice();
    if (this.search) {
      const q = this.search.toLowerCase().trim();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.nameEn || '').toLowerCase().includes(q)
      );
    }
    if (this.filterMuscle && this.filterMuscle !== 'all') {
      list = list.filter(e =>
        MuscleTree.matchesFilter(this.filterMuscle, MuscleTree.exerciseTags(e))
      );
    }
    if (this.filterEquip !== 'all') {
      list = list.filter(e => (e.equipment || []).includes(this.filterEquip));
    }
    return list;
  },

  bind() {
    document.getElementById('ex-search')?.addEventListener('input', e => {
      this.search = e.target.value;
      App.refresh();
    });
    document.getElementById('ex-muscle-open')?.addEventListener('click', () => {
      this.treeOpen = !this.treeOpen;
      App.refresh();
    });
    document.getElementById('ex-muscle-clear')?.addEventListener('click', () => {
      this.filterMuscle = 'all';
      this.treeOpen = false;
      App.refresh();
    });
    const treeRoot = document.getElementById('ex-muscle-tree');
    if (treeRoot) {
      MuscleTree.bindTreeToggles(treeRoot);
      treeRoot.querySelectorAll('input[data-mode="filter"]').forEach(cb => {
        cb.addEventListener('change', () => {
          if (cb.checked) {
            this.filterMuscle = cb.dataset.muscle;
            this.treeOpen = false;
          } else {
            this.filterMuscle = 'all';
          }
          App.refresh();
        });
      });
    }
    document.querySelectorAll('#equip-filters .filter-chip').forEach(c => {
      c.addEventListener('click', () => {
        this.filterEquip = c.dataset.e;
        App.refresh();
      });
    });
    document.querySelectorAll('.exercise-item').forEach(item => {
      item.addEventListener('click', () => this.showDetail(item.dataset.id));
    });
    document.getElementById('btn-add-exercise')?.addEventListener('click', () => this.showCreateForm());
  },

  showDetail(id) {
    const ex = Utils.getExerciseById(id) || (EXERCISE_DB || []).find(e => e.id === id);
    if (!ex) return;
    const history = Storage.getExerciseHistory(id);
    const last = history[0];
    const lastSets = last?.sets?.filter(s => s.type !== 'warmup').slice(0, 3) || [];
    const main = ex.musclesMain || (ex.musclePrimary ? [ex.musclePrimary] : []);
    const support = ex.musclesSupport || ex.muscleSecondary || [];
    const mediaHtml = ex.media?.dataUrl
      ? (ex.media.type === 'image'
        ? `<img src="${ex.media.dataUrl}" style="max-width:100%;max-height:180px;border-radius:10px;margin:0 auto 16px;display:block">`
        : `<video src="${ex.media.dataUrl}" controls style="max-width:100%;max-height:180px;border-radius:10px;margin:0 auto 16px;display:block"></video>`)
      : `<div class="text-center mb-16" style="font-size:48px">${ex.icon || '🏋️'}</div>`;

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${ex.name}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      ${mediaHtml}
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="card-title">Mięśnie główne</div>
        <div class="ex-meta" style="flex-wrap:wrap">${main.map(m =>
          `<span class="ex-badge">${MuscleTree.label(m)}</span>`
        ).join('') || '<span class="text-muted text-sm">—</span>'}</div>
      </div>
      <div class="card" style="padding:14px;margin-bottom:12px">
        <div class="card-title">Mięśnie wspierające</div>
        <div class="ex-meta" style="flex-wrap:wrap">${support.map(m =>
          `<span class="ex-badge" style="background:var(--bg-elevated);color:var(--text-secondary)">${MuscleTree.label(m)}</span>`
        ).join('') || '<span class="text-muted text-sm">—</span>'}</div>
      </div>
      <p class="text-sm text-secondary mb-16">${ex.description || ex.instructions || ''}</p>
      <div class="card" style="padding:14px">
        <div class="card-title">Ostatnie wyniki</div>
        ${lastSets.length ? lastSets.map(s => `
          <div class="flex-between text-sm mb-8">
            <span>${s.weight} kg × ${s.reps}</span>
            <span class="text-muted">RIR ${s.rir ?? '–'}</span>
          </div>
        `).join('') : '<p class="text-sm text-muted">Brak historii</p>'}
      </div>
      <div class="text-xs text-muted mt-8">Sprzęt: ${(ex.equipment || []).join(', ') || '–'} · ${ex.difficulty || ''}</div>
      ${ex.custom ? `
        <button class="btn btn-secondary btn-block mt-16" id="btn-edit-ex">Edytuj</button>
        <button class="btn btn-ghost btn-block mt-8" id="btn-delete-ex" style="color:var(--danger)">Usuń</button>
      ` : ''}
    `);

    document.getElementById('btn-edit-ex')?.addEventListener('click', () => {
      Utils.closeModal();
      this.showCreateForm(ex);
    });
    document.getElementById('btn-delete-ex')?.addEventListener('click', () => {
      if (!Utils.confirm('Usunąć to ćwiczenie?')) return;
      Storage.saveCustomExercises(Storage.getCustomExercises().filter(e => e.id !== id));
      Utils.closeModal();
      App.refresh();
      Utils.toast('Usunięto');
    });
  },

  showCreateForm(existing = null) {
    this.editingId = existing?.id || null;
    this.pendingMedia = existing?.media
      ? { type: existing.media.type, dataUrl: existing.media.dataUrl, name: existing.media.name || '' }
      : null;
    const mainSel = existing?.musclesMain || (existing?.musclePrimary ? [existing.musclePrimary] : []);
    const supportSel = existing?.musclesSupport || existing?.muscleSecondary || [];
    const equipSelected = new Set(existing?.equipment || []);
    const isEdit = !!existing;

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${isEdit ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="form-group">
        <label>Nazwa</label>
        <input class="form-input" id="cex-name" value="${(existing?.name || '').replace(/"/g, '&quot;')}">
      </div>
      <div class="form-group">
        <label>Mięśnie główne (wielokrotny wybór)</label>
        <p class="text-xs text-muted mb-8">Możesz wybrać kategorię nadrzędną (np. Barki) lub konkretny akton.</p>
        <div id="cex-main" class="mt-picker">${MuscleTree.renderCheckboxTree(mainSel, 'main')}</div>
      </div>
      <div class="form-group">
        <label>Mięśnie wspierające (wielokrotny wybór)</label>
        <div id="cex-support" class="mt-picker">${MuscleTree.renderCheckboxTree(supportSel, 'support')}</div>
      </div>
      <div class="form-group">
        <label>Sprzęt</label>
        <div class="equip-chips" id="cex-equip">
          ${EQUIPMENT_LIST.map(e => `
            <button type="button" class="filter-chip ${equipSelected.has(e)?'active':''}" data-eq="${e}">${e}</button>
          `).join('')}
        </div>
      </div>
      <div class="form-group">
        <label>Opis</label>
        <textarea class="form-textarea" id="cex-desc">${existing?.description || existing?.instructions || ''}</textarea>
      </div>
      <button class="btn btn-primary btn-block mt-16" id="cex-save">${isEdit ? 'Zapisz zmiany' : 'Zapisz na konto'}</button>
    `);

    MuscleTree.bindTreeToggles(document.getElementById('cex-main'));
    MuscleTree.bindTreeToggles(document.getElementById('cex-support'));
    document.querySelectorAll('#cex-equip .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });
    document.getElementById('cex-save')?.addEventListener('click', () => this.saveCustom());
  },

  saveCustom() {
    const name = document.getElementById('cex-name')?.value.trim();
    if (!name) { Utils.toast('Podaj nazwę'); return; }
    const main = MuscleTree.collectChecked(document.getElementById('cex-main'), 'main');
    const support = MuscleTree.collectChecked(document.getElementById('cex-support'), 'support');
    if (!main.length) { Utils.toast('Wybierz co najmniej jeden mięsień główny'); return; }
    const equipment = Array.from(document.querySelectorAll('#cex-equip .filter-chip.active')).map(c => c.dataset.eq);
    const desc = document.getElementById('cex-desc')?.value.trim() || '';
    const list = Storage.getCustomExercises();
    const rootOf = (id) => {
      id = MuscleTree.normalize(id);
      let n = MuscleTree._index()[id];
      while (n && n.parentId) n = MuscleTree._index()[n.parentId];
      return n ? n.id : id;
    };
    const payload = {
      name,
      musclesMain: main,
      musclesSupport: support,
      musclePrimary: rootOf(main[0]),
      muscleSecondary: support.map(rootOf).filter((v, i, a) => a.indexOf(v) === i && v !== rootOf(main[0])),
      equipment: equipment.length ? equipment : ['masa ciała'],
      type: ['hipertrofia'],
      difficulty: 'średni',
      description: desc,
      instructions: desc,
      mistakes: [],
      tips: [],
      icon: '⭐',
      custom: true,
      updatedAt: new Date().toISOString()
    };
    if (this.editingId) {
      const idx = list.findIndex(e => e.id === this.editingId);
      if (idx >= 0) list[idx] = { ...list[idx], ...payload, id: this.editingId, createdAt: list[idx].createdAt || new Date().toISOString() };
      Storage.saveCustomExercises(list);
      Utils.toast('Zapisano zmiany');
    } else {
      list.unshift({ ...payload, id: 'custom_' + Utils.uid(), createdAt: new Date().toISOString() });
      Storage.saveCustomExercises(list);
      Utils.toast('Ćwiczenie zapisane na koncie');
    }
    this.editingId = null;
    Utils.closeModal();
    App.refresh();
  }
};
