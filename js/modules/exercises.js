const Exercises = {
  search: '',
  filterMuscles: [],
  filterEquip: 'all',
  filterSource: 'all',
  filterCollapsed: true,
  pendingMedia: null,
  editingId: null,

  MUSCLE_TABLE: [
    {
      key: 'push', label: 'Push',
      items: [
        { id: 'klatka', name: 'Klatka piersiowa', icon: '❤️' },
        { id: 'barki', name: 'Barki', icon: '⬆️' },
        { id: 'triceps', name: 'Triceps', icon: '💪' }
      ]
    },
    {
      key: 'pull', label: 'Pull',
      items: [
        { id: 'plecy', name: 'Plecy', icon: '🔙' },
        { id: 'biceps', name: 'Biceps', icon: '💪' },
        { id: 'przedramiona', name: 'Przedramiona', icon: '✊' }
      ]
    },
    {
      key: 'legs', label: 'Nogi',
      items: [
        { id: 'czworoglowe', name: 'Czworogłowy uda', icon: '🦵' },
        { id: 'dwuglowe', name: 'Kulszowo-goleniowe', icon: '🏃' },
        { id: 'posladki', name: 'Biodra / pośladki', icon: '↔️' },
        { id: 'lydki', name: 'Łydki', icon: '👟' }
      ]
    },
    {
      key: 'core', label: 'Korpus',
      items: [
        { id: 'brzuch', name: 'Mięśnie brzucha', icon: '⭕' },
        { id: 'core', name: 'Core', icon: '🎯' }
      ]
    }
  ],

  MAX_MEDIA_KB: 400,

  render() {
    const list = this.getFiltered();
    return `
      <div class="flex-between mb-16">
        <div class="section-title" style="margin:0">Ćwiczenia</div>
        <button class="btn btn-primary" id="btn-add-exercise" style="padding:10px 14px;font-size:13px">+ Utwórz</button>
      </div>

      <div class="search-bar">
        <input class="search-input" id="ex-search" placeholder="Szukaj ćwiczenia..." value="${this.search.replace(/"/g, '&quot;')}">
      </div>

      <div class="source-chips mb-12">
        ${[['all','Wszystkie'],['custom','Moje'],['base','Baza']].map(([id,label]) => `
          <button type="button" class="filter-chip ${this.filterSource===id?'active':''}" data-source="${id}">${label}</button>
        `).join('')}
      </div>

      <div class="filter-panel ${this.filterCollapsed ? 'collapsed' : ''}" id="ex-filter-panel">
        <button type="button" class="filter-toggle" id="ex-filter-toggle">
          Partie mięśniowe
          <span class="chev">${this.filterCollapsed ? '▾' : '▴'}</span>
          ${this.filterMuscles.length ? `<span class="filter-badge">${this.filterMuscles.length}</span>` : ''}
        </button>
        <div class="filter-body" ${this.filterCollapsed ? 'hidden' : ''}>
          ${this.renderMuscleTable(this.filterMuscles, 'filter')}
          <div class="flex gap-8 mt-12">
            <button type="button" class="btn btn-ghost" id="ex-filter-clear" style="flex:1;padding:10px">Wyczyść</button>
          </div>
        </div>
      </div>

      <div class="filter-chips mb-12" id="equip-filters">
        <div class="filter-chip ${this.filterEquip==='all'?'active':''}" data-e="all">Sprzęt: wszystkie</div>
        ${EQUIPMENT_LIST.map(e =>
          `<div class="filter-chip ${this.filterEquip===e?'active':''}" data-e="${e}">${e}</div>`
        ).join('')}
      </div>

      <div class="text-sm text-muted mb-8">${list.length} ćwiczeń</div>

      ${list.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Brak wyników</h3>
          <p>Zmień filtry lub utwórz własne ćwiczenie.</p>
          <button class="btn btn-primary" id="btn-add-exercise-empty">Utwórz ćwiczenie</button>
        </div>
      ` : list.map(ex => {
        const thumb = ex.media?.dataUrl && ex.media.type === 'image'
          ? `<img class="ex-thumb-img" src="${ex.media.dataUrl}" alt="">`
          : (ex.icon || '🏋️');
        return `
        <div class="exercise-item" data-id="${ex.id}">
          <div class="ex-thumb">${thumb}</div>
          <div class="ex-info">
            <div class="ex-name">${ex.name}${ex.custom ? ' <span class="ex-custom-tag">własne</span>' : ''}</div>
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
    let list = Utils.allExercises();
    if (this.filterSource === 'custom') list = list.filter(e => e.custom);
    if (this.filterSource === 'base') list = list.filter(e => !e.custom);
    if (this.search) {
      const q = this.search.toLowerCase();
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.nameEn || '').toLowerCase().includes(q) ||
        (e.muscles || []).some(m => String(m).toLowerCase().includes(q))
      );
    }
    if (this.filterMuscles.length) {
      list = list.filter(e => {
        const all = [e.musclePrimary, ...(e.muscleSecondary || []), ...(e.muscles || [])];
        return this.filterMuscles.some(m => all.includes(m));
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
    document.querySelectorAll('[data-source]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterSource = btn.dataset.source;
        App.refresh();
      });
    });
    document.getElementById('ex-filter-toggle')?.addEventListener('click', () => {
      this.filterCollapsed = !this.filterCollapsed;
      App.refresh();
    });
    document.getElementById('ex-filter-clear')?.addEventListener('click', () => {
      this.filterMuscles = [];
      App.refresh();
    });
    document.querySelectorAll('input[data-mode="filter"]').forEach(cb => {
      cb.addEventListener('change', () => {
        const id = cb.dataset.muscle;
        if (cb.checked) {
          if (!this.filterMuscles.includes(id)) this.filterMuscles.push(id);
        } else {
          this.filterMuscles = this.filterMuscles.filter(m => m !== id);
        }
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
    document.getElementById('btn-add-exercise')?.addEventListener('click', () => this.showCreateForm());
    document.getElementById('btn-add-exercise-empty')?.addEventListener('click', () => this.showCreateForm());
  },

  showDetail(id) {
    const ex = Utils.getExerciseById(id);
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

      ${ex.custom ? `
        <button class="btn btn-secondary btn-block mt-16" id="btn-edit-ex">Edytuj</button>
        <button class="btn btn-ghost btn-block mt-8" id="btn-delete-ex" style="color:var(--danger)">Usuń własne ćwiczenie</button>
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
        <input class="form-input" id="cex-name" placeholder="np. Przysiad bułgarski" value="${(existing?.name || '').replace(/"/g, '&quot;')}">
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
          <div id="cex-media-preview" class="media-preview ${this.pendingMedia ? 'show' : ''}">
            ${this.pendingMedia
              ? (this.pendingMedia.type === 'image'
                ? `<img src="${this.pendingMedia.dataUrl}" alt="">`
                : `<video src="${this.pendingMedia.dataUrl}" controls></video>`)
              : ''}
            ${this.pendingMedia ? `<button type="button" class="btn btn-ghost media-remove" id="cex-media-remove" style="color:var(--danger)">Usuń media</button>` : ''}
          </div>
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
        <textarea class="form-textarea" id="cex-desc" placeholder="Jak wykonać ćwiczenie...">${existing?.description || existing?.instructions || ''}</textarea>
      </div>

      <button class="btn btn-primary btn-block mt-16" id="cex-save">${isEdit ? 'Zapisz zmiany' : 'Zapisz na konto'}</button>
    `);

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
    document.getElementById('cex-media-remove')?.addEventListener('click', () => {
      this.pendingMedia = null;
      this.refreshMediaPreview();
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
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
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
    } catch {
      cb(dataUrl);
    }
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
        const prev = list[idx];
        const next = {
          ...prev,
          ...payload,
          id: this.editingId,
          createdAt: prev.createdAt || new Date().toISOString()
        };
        if (!payload.media) delete next.media;
        list[idx] = next;
      }
      Storage.saveCustomExercises(list);
      Utils.toast('Zapisano zmiany');
    } else {
      list.unshift({
        ...payload,
        id: 'custom_' + Utils.uid(),
        createdAt: new Date().toISOString()
      });
      Storage.saveCustomExercises(list);
      Utils.toast('Ćwiczenie zapisane na koncie');
    }

    this.editingId = null;
    this.pendingMedia = null;
    Utils.closeModal();
    App.refresh();
  }
};
