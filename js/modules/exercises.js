const Exercises = {
  search: '',
  filterMuscle: 'all',
  filterEquip: 'all',
  filterSource: 'all',
  filterCollapsed: true,
  pendingMedia: null,
  editingId: null,

  MUSCLE_TABLE: [
    {
      key: 'upper', label: 'Góra ciała',
      items: [
        { id: 'klatka', name: 'Klatka piersiowa', icon: '❤️' },
        { id: 'plecy', name: 'Plecy', icon: '🔙' },
        { id: 'barki', name: 'Barki', icon: '⬆️' },
        { id: 'biceps', name: 'Biceps', icon: '💪' },
        { id: 'triceps', name: 'Triceps', icon: '💪' },
        { id: 'przedramiona', name: 'Przedramiona', icon: '✊' },
        { id: 'kaptury', name: 'Czworoboczne (kaptury)', icon: '🏔️' },
        { id: 'prostowniki', name: 'Prostowniki grzbietu', icon: '📐' },
        { id: 'szyja', name: 'Szyja', icon: '🦒' }
      ]
    },
    {
      key: 'core', label: 'Korpus',
      items: [
        { id: 'brzuch', name: 'Brzuch', icon: '⭕' }
      ]
    },
    {
      key: 'legs', label: 'Nogi',
      items: [
        { id: 'posladki', name: 'Pośladki', icon: '🍑' },
        { id: 'czworoglowe', name: 'Czworogłowe uda', icon: '🦵' },
        { id: 'dwuglowe', name: 'Dwugłowe uda', icon: '🏃' },
        { id: 'przywodziciele', name: 'Przywodziciele ud', icon: '➡️' },
        { id: 'odwodziciele', name: 'Odwodziciele ud', icon: '⬅️' },
        { id: 'lydki', name: 'Łydki', icon: '👟' },
        { id: 'piszczelowe', name: 'Mięśnie piszczelowe', icon: '🦴' }
      ]
    },
    {
      key: 'other', label: 'Pozostałe',
      items: [
        { id: 'cale-cialo', name: 'Całe ciało', icon: '🧍' },
        { id: 'inne', name: 'Inne', icon: '➕' }
      ]
    }
  ],

  MAX_MEDIA_KB: 400,

  render() {
    const list = this.getFiltered();
    const muscleOpts = MUSCLE_GROUPS.map(g =>
      `<option value="${g.id}" ${this.filterMuscle===g.id?'selected':''}>${g.name}</option>`
    ).join('');
    return `
      <div class="flex-between mb-16">
        <div class="section-title" style="margin:0">Ćwiczenia</div>
        <button class="btn btn-primary" id="btn-add-exercise" style="padding:10px 14px;font-size:13px">+ Utwórz</button>
      </div>

      <div class="ex-filter-bar">
        <div class="ex-filter-muscle">
          <label class="ex-filter-label">Partia mięśniowa</label>
          <select class="form-select" id="ex-muscle-filter">
            <option value="all" ${this.filterMuscle==='all'?'selected':''}>Wszystkie partie</option>
            ${muscleOpts}
          </select>
        </div>
        <div class="ex-filter-search">
          <label class="ex-filter-label">Szukaj</label>
          <input class="search-input" id="ex-search" placeholder="Nazwa ćwiczenia..." value="${this.search.replace(/"/g, '"')}">
        </div>
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
        const thumb = ex.media?.dataUrl && ex.media.type === 'image'
          ? `<img class="ex-thumb-img" src="${ex.media.dataUrl}" alt="">`
          : (ex.icon || '🏋️');
        return `
        <div class="exercise-item" data-id="${ex.id}">
          <div class="ex-thumb">${thumb}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}</div>
            <div class="ex-meta">
              <span class="ex-badge">${Utils.muscleShort(ex.musclePrimary)}</span>
              ${(ex.muscleSecondary || []).slice(0, 2).map(m =>
                `<span class="ex-badge" style="background:var(--bg-elevated);color:var(--text-secondary)">${Utils.muscleShort(m)}</span>`
              ).join('')}
              <span>${(ex.equipment || []).slice(0, 2).join(', ')}</span>
            </div>
          </div>
        </div>`;
      }).join('')}
    `;
  },

  renderMuscleTable(selectedIds, mode) {
    const selected = new Set(selectedIds || []);
    return `
      <div class="muscle-table">
        ${this.MUSCLE_TABLE.map(group => `
          <div class="muscle-group">
            <div class="muscle-group-header ${group.key}">${group.label}</div>
            <div class="muscle-grid">
              ${group.items.map(item => `
                <label class="muscle-item ${selected.has(item.id) ? 'selected' : ''}" data-mode="${mode}">
                  <input type="checkbox" data-muscle="${item.id}" data-mode="${mode}" ${selected.has(item.id) ? 'checked' : ''}>
                  <span class="m-icon">${item.icon}</span>
                  <span class="m-name">${item.name}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
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
      const m = this.filterMuscle;
      list = list.filter(e => {
        const all = [e.musclePrimary, ...(e.muscleSecondary || []), ...(e.muscles || [])];
        if (m === 'cale-cialo') {
          return all.includes('cale-cialo') || (e.muscleSecondary || []).length >= 3;
        }
        if (m === 'inne') {
          const known = new Set(MUSCLE_GROUPS.map(g => g.id).filter(id => id !== 'inne' && id !== 'cale-cialo'));
          return e.musclePrimary === 'inne' || !known.has(e.musclePrimary);
        }
        return all.includes(m);
      });
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
    document.getElementById('ex-muscle-filter')?.addEventListener('change', e => {
      this.filterMuscle = e.target.value;
      App.refresh();
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
    document.getElementById('btn-add-exercise')?.addEventListener('click', () => this.showCreateForm());
  },

  showDetail(id) {
    const ex = Utils.getExerciseById(id) || (EXERCISE_DB || []).find(e => e.id === id);
    if (!ex) return;
    const history = Storage.getExerciseHistory(id);
    const last = history[0];
    const lastSets = last?.sets?.filter(s => s.type !== 'warmup').slice(0, 3) || [];
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
      <div class="ex-meta mb-16" style="justify-content:center;flex-wrap:wrap">
        <span class="ex-badge">${Utils.muscleName(ex.musclePrimary)}</span>
        ${(ex.muscleSecondary || []).map(m =>
          `<span class="ex-badge" style="background:var(--bg-card);color:var(--text-secondary)">${Utils.muscleShort(m)}</span>`
        ).join('')}
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
    `);
  },

  showCreateForm(existing = null) {
    this.editingId = existing?.id || null;
    this.pendingMedia = existing?.media
      ? { type: existing.media.type, dataUrl: existing.media.dataUrl, name: existing.media.name || '' }
      : null;

    const selectedMuscles = [];
    if (existing) {
      if (existing.musclePrimary) selectedMuscles.push(existing.musclePrimary);
      (existing.muscleSecondary || []).forEach(m => {
        if (!selectedMuscles.includes(m)) selectedMuscles.push(m);
      });
    }

    const equipSelected = new Set(existing?.equipment || []);
    const isEdit = !!existing;

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${isEdit ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="form-group">
        <label>Nazwa</label>
        <input class="form-input" id="cex-name" placeholder="np. Przysiad bułgarski" value="${(existing?.name || '').replace(/"/g, '"')}">
      </div>
      <div class="form-group">
        <label>Partie mięśniowe (wielokrotny wybór)</label>
        <div id="cex-muscles">${this.renderMuscleTable(selectedMuscles, 'create')}</div>
        <p class="text-xs text-muted mt-8">Pierwsza zaznaczona partia = główna</p>
      </div>
      <div class="form-group">
        <label>Zdjęcie lub wideo (opcjonalnie, max ${this.MAX_MEDIA_KB} KB)</label>
        <div class="media-box">
          <div class="media-btns">
            <label class="btn btn-secondary" style="padding:10px 14px;cursor:pointer">
              📷 Zdjęcie
              <input type="file" id="cex-photo" accept="image/*" hidden>
            </label>
            <label class="btn btn-secondary" style="padding:10px 14px;cursor:pointer">
              🎬 Wideo
              <input type="file" id="cex-video" accept="video/*" hidden>
            </label>
          </div>
          <div id="cex-media-preview" class="media-preview ${this.pendingMedia ? 'show' : ''}"></div>
        </div>
      </div>
      <div class="form-group">
        <label>Sprzęt</label>
        <div class="equip-chips" id="cex-equip">
          ${EQUIPMENT_LIST.map(e => `
            <button type="button" class="filter-chip ${equipSelected.has(e)?'active':''}" data-eq="${e}">${e}</button>
          `).join('')}
        </div>
      </div>
      <div class="form-row-2">
        <div class="form-group">
          <label>Poziom</label>
          <select class="form-select" id="cex-diff">
            ${['początkujący','średni','zaawansowany'].map(d =>
              `<option value="${d}" ${existing?.difficulty===d?'selected':''}>${d}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Ikona</label>
          <select class="form-select" id="cex-icon">
            ${['⭐','🏋️','💪','🦵','🔥','🎯','➡️','⬆️'].map(ic =>
              `<option value="${ic}" ${(existing?.icon||'⭐')===ic?'selected':''}>${ic}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Opis / instrukcja</label>
        <textarea class="form-textarea" id="cex-desc">${existing?.description || existing?.instructions || ''}</textarea>
      </div>
      <button class="btn btn-primary btn-block mt-16" id="cex-save">${isEdit ? 'Zapisz zmiany' : 'Zapisz na konto'}</button>
    `);

    if (this.pendingMedia) this.refreshMediaPreview();

    document.querySelectorAll('#cex-muscles input[data-mode="create"]').forEach(cb => {
      const label = cb.closest('.muscle-item');
      cb.addEventListener('change', () => label?.classList.toggle('selected', cb.checked));
    });
    document.querySelectorAll('#cex-equip .filter-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });

    const loadMedia = (file, type) => {
      if (!file) return;
      if (file.size > this.MAX_MEDIA_KB * 1024) {
        Utils.toast(`Plik za duży (max ${this.MAX_MEDIA_KB} KB)`);
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target.result;
        if (type === 'image') {
          this.compressImage(dataUrl, (compressed) => {
            if (!compressed) return;
            this.pendingMedia = { type, dataUrl: compressed, name: file.name };
            this.refreshMediaPreview();
          });
        } else {
          this.pendingMedia = { type, dataUrl, name: file.name };
          this.refreshMediaPreview();
        }
      };
      reader.readAsDataURL(file);
    };

    document.getElementById('cex-photo')?.addEventListener('change', e => {
      loadMedia(e.target.files?.[0], 'image');
      e.target.value = '';
    });
    document.getElementById('cex-video')?.addEventListener('change', e => {
      loadMedia(e.target.files?.[0], 'video');
      e.target.value = '';
    });
    document.getElementById('cex-save')?.addEventListener('click', () => this.saveCustom());
  },

  refreshMediaPreview() {
    const box = document.getElementById('cex-media-preview');
    if (!box) return;
    if (!this.pendingMedia) {
      box.className = 'media-preview';
      box.innerHTML = '';
      return;
    }
    box.className = 'media-preview show';
    const content = this.pendingMedia.type === 'image'
      ? `<img src="${this.pendingMedia.dataUrl}" alt="">`
      : `<video src="${this.pendingMedia.dataUrl}" controls></video>`;
    box.innerHTML = content + `<button type="button" class="btn btn-ghost media-remove" id="cex-media-remove" style="color:var(--danger)">Usuń media</button>`;
    document.getElementById('cex-media-remove')?.addEventListener('click', () => {
      this.pendingMedia = null;
      this.refreshMediaPreview();
    });
  },

  compressImage(dataUrl, cb) {
    try {
      const img = new Image();
      img.onload = () => {
        const maxW = 800;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        let quality = 0.72;
        let out = canvas.toDataURL('image/jpeg', quality);
        while (out.length > this.MAX_MEDIA_KB * 1024 * 1.37 && quality > 0.35) {
          quality -= 0.08;
          out = canvas.toDataURL('image/jpeg', quality);
        }
        if (out.length > this.MAX_MEDIA_KB * 1024 * 1.37) {
          Utils.toast('Zdjęcie nadal za duże — wybierz mniejsze');
          cb(null);
          return;
        }
        cb(out);
      };
      img.onerror = () => cb(dataUrl);
      img.src = dataUrl;
    } catch { cb(dataUrl); }
  },

  saveCustom() {
    const name = document.getElementById('cex-name')?.value.trim();
    if (!name) { Utils.toast('Podaj nazwę'); return; }
    const muscles = Array.from(document.querySelectorAll('#cex-muscles input[data-mode="create"]:checked'))
      .map(cb => cb.dataset.muscle);
    if (!muscles.length) { Utils.toast('Wybierz co najmniej jedną partię mięśniową'); return; }
    const equipment = Array.from(document.querySelectorAll('#cex-equip .filter-chip.active'))
      .map(c => c.dataset.eq);
    const desc = document.getElementById('cex-desc')?.value.trim() || '';
    const list = Storage.getCustomExercises();
    const payload = {
      name,
      musclePrimary: muscles[0],
      muscleSecondary: muscles.slice(1),
      muscles,
      equipment: equipment.length ? equipment : ['masa ciała'],
      type: ['hipertrofia'],
      difficulty: document.getElementById('cex-diff')?.value || 'średni',
      description: desc,
      instructions: desc,
      mistakes: [],
      tips: [],
      icon: document.getElementById('cex-icon')?.value || '⭐',
      custom: true,
      updatedAt: new Date().toISOString()
    };
    if (this.pendingMedia?.dataUrl) {
      payload.media = {
        type: this.pendingMedia.type,
        dataUrl: this.pendingMedia.dataUrl,
        name: this.pendingMedia.name || ''
      };
    }
    if (this.editingId) {
      const idx = list.findIndex(e => e.id === this.editingId);
      if (idx >= 0) {
        const next = { ...list[idx], ...payload, id: this.editingId, createdAt: list[idx].createdAt || new Date().toISOString() };
        if (!payload.media) delete next.media;
        list[idx] = next;
      }
      Storage.saveCustomExercises(list);
      Utils.toast('Zapisano zmiany');
    } else {
      list.unshift({ ...payload, id: 'custom_' + Utils.uid(), createdAt: new Date().toISOString() });
      Storage.saveCustomExercises(list);
      Utils.toast('Ćwiczenie zapisane na koncie');
    }
    this.editingId = null;
    this.pendingMedia = null;
    Utils.closeModal();
    App.refresh();
  }
};
