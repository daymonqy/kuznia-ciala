const Plans = {
  _editPlanId: null,

  render() {
    const plans = Storage.getPlans();
    return `
      <div class="flex-between mb-16">
        <div class="section-title" style="margin:0">Plany treningowe</div>
        <button class="btn btn-primary" id="btn-new-plan" style="padding:10px 16px;font-size:13px">+ Nowy</button>
      </div>

      ${plans.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>Nie masz jeszcze planu</h3>
          <p>Utwórz swój pierwszy plan treningowy.</p>
          <button class="btn btn-primary" id="btn-new-plan-empty">Utwórz plan</button>
        </div>
      ` : plans.map(p => `
        <div class="card plan-card" data-plan="${p.id}">
          <div class="flex-between">
            <div>
              <div class="font-bold" style="font-size:16px">${p.name}</div>
              <div class="text-sm text-secondary mt-8">${p.days?.length || 0} dni · ${(typeof GOALS!=='undefined'?GOALS:[]).find(g=>g.id===p.goal)?.name || ''} · ${(typeof LEVELS!=='undefined'?LEVELS:[]).find(l=>l.id===p.level)?.name || ''}</div>
            </div>
          </div>
          ${p.description ? `<div class="mt-12 text-sm text-muted">${p.description}</div>` : ''}
          <div class="flex gap-8 mt-16">
            <button class="btn btn-primary start-plan" data-id="${p.id}" style="flex:1;padding:12px">Rozpocznij</button>
            <button class="btn btn-secondary edit-plan" data-id="${p.id}" style="padding:12px 16px">Edytuj</button>
          </div>
        </div>
      `).join('')}
    `;
  },

  bind() {
    document.getElementById('btn-new-plan')?.addEventListener('click', () => this.showCreate());
    document.getElementById('btn-new-plan-empty')?.addEventListener('click', () => this.showCreate());
    document.querySelectorAll('.start-plan').forEach(btn => {
      btn.addEventListener('click', () => {
        const plan = Storage.getPlans().find(p => p.id === btn.dataset.id);
        if (plan?.days?.[0]) Workout.start(plan.days[0]);
      });
    });
    document.querySelectorAll('.edit-plan').forEach(btn => {
      btn.addEventListener('click', () => this.showEdit(btn.dataset.id));
    });
  },

  showCreate() {
    const goals = typeof GOALS !== 'undefined' ? GOALS : [];
    const levels = typeof LEVELS !== 'undefined' ? LEVELS : [];
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Nowy plan</div>
        <button class="modal-close" type="button" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="form-group"><label>Nazwa</label><input class="form-input" id="plan-name" placeholder="np. Upper/Lower Mass"></div>
      <div class="form-group"><label>Opis</label><textarea class="form-textarea" id="plan-desc" placeholder="Opcjonalnie"></textarea></div>
      <div class="form-group"><label>Cel</label>
        <select class="form-select" id="plan-goal">${goals.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Poziom</label>
        <select class="form-select" id="plan-level">${levels.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Liczba dni</label>
        <select class="form-select" id="plan-days">
          ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${n===3?'selected':''}>${n}</option>`).join('')}
        </select>
      </div>
      <button type="button" class="btn btn-primary btn-block mt-16" id="create-plan">Utwórz i dodaj ćwiczenia</button>
    `);
    document.getElementById('create-plan')?.addEventListener('click', () => {
      const name = document.getElementById('plan-name').value.trim();
      if (!name) { Utils.toast('Podaj nazwę'); return; }
      const daysCount = Number(document.getElementById('plan-days').value);
      const plan = {
        id: Utils.uid(),
        name,
        description: document.getElementById('plan-desc').value.trim(),
        goal: document.getElementById('plan-goal').value,
        level: document.getElementById('plan-level').value,
        days: Array.from({ length: daysCount }, (_, i) => ({
          name: `Dzień ${i + 1}`,
          exercises: []
        })),
        createdAt: new Date().toISOString()
      };
      const plans = Storage.getPlans();
      plans.unshift(plan);
      Storage.savePlans(plans);
      Utils.closeModal();
      this.showEdit(plan.id);
      Utils.toast('Plan utworzony');
    });
  },

  normalizeSetDetails(ex) {
    if (ex.setDetails && Array.isArray(ex.setDetails) && ex.setDetails.length) {
      return ex.setDetails.map(s => ({
        reps: s.reps != null ? String(s.reps) : '8-12',
        type: s.type || 'working',
        rir: s.rir != null && s.rir !== '' ? Number(s.rir) : null,
        rip: s.rip != null && s.rip !== '' ? Number(s.rip) : null
      }));
    }
    const n = Number(ex.sets) || 3;
    const reps = ex.reps != null ? String(ex.reps) : '8-12';
    const type = ex.setType || 'working';
    const rir = ex.rir != null && ex.rir !== '' ? Number(ex.rir) : 2;
    const rip = ex.rip != null && ex.rip !== '' ? Number(ex.rip) : null;
    return Array.from({ length: n }, () => ({ reps, type, rir, rip }));
  },

  formatExMeta(ex) {
    const details = this.normalizeSetDetails(ex);
    const types = typeof SET_TYPES !== 'undefined' ? SET_TYPES : [];
    const short = details.map((s, i) => {
      const t = types.find(x => x.id === s.type);
      const label = t && s.type !== 'working' ? t.name.slice(0, 3) : '';
      const rir = s.rir != null ? ` RIR${s.rir}` : '';
      return `${i + 1}:${s.reps}${label ? ' ' + label : ''}${rir}`;
    });
    const rest = ex.rest ? ` · ${ex.rest}s` : '';
    return short.join(' · ') + rest;
  },

  savePlan(plan) {
    Storage.savePlans(Storage.getPlans().map(p => p.id === plan.id ? plan : p));
  },

  showEdit(id) {
    const plan = Storage.getPlans().find(p => p.id === id);
    if (!plan) { Utils.toast('Nie znaleziono planu'); return; }
    this._editPlanId = id;
    if (!Array.isArray(plan.days)) plan.days = [];
    plan.days.forEach(d => { if (!Array.isArray(d.exercises)) d.exercises = []; });

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Edycja: ${plan.name}</div>
        <button class="modal-close" type="button" onclick="Utils.closeModal()">×</button>
      </div>
      ${plan.days.map((day, di) => `
        <div class="card mb-16 plan-day-card" style="padding:14px">
          <div class="flex-between mb-12">
            <input class="form-input day-name" data-di="${di}" value="${(day.name || '').replace(/"/g, '"')}" style="flex:1">
          </div>
          ${(day.exercises || []).map((ex, ei) => {
            const e = Utils.getExerciseById(ex.exerciseId);
            const canUp = ei > 0;
            const canDown = ei < day.exercises.length - 1;
            return `<div class="plan-ex-row">
              <div class="plan-ex-order">
                <button type="button" class="order-btn move-ex-up" data-di="${di}" data-ei="${ei}" ${canUp ? '' : 'disabled'} title="W górę">↑</button>
                <button type="button" class="order-btn move-ex-down" data-di="${di}" data-ei="${ei}" ${canDown ? '' : 'disabled'} title="W dół">↓</button>
              </div>
              <div class="plan-ex-main">
                <div class="font-bold text-sm">${e?.name || ex.exerciseId}</div>
                <div class="text-xs text-muted">${this.formatExMeta(ex)}</div>
              </div>
              <button type="button" class="btn btn-ghost edit-plan-ex" data-di="${di}" data-ei="${ei}" style="padding:6px 8px;font-size:12px">✎</button>
              <button type="button" class="btn btn-ghost remove-ex" data-di="${di}" data-ei="${ei}" style="padding:4px 8px;color:var(--danger)">×</button>
            </div>`;
          }).join('')}
          <button type="button" class="btn btn-secondary btn-block mt-8 add-ex-to-day" data-di="${di}" style="padding:10px;font-size:13px">+ Ćwiczenie</button>
        </div>
      `).join('')}
      <button type="button" class="btn btn-primary btn-block" id="save-plan-edit">Zapisz zmiany</button>
      <button type="button" class="btn btn-ghost btn-block mt-8" id="delete-plan" style="color:var(--danger)">Usuń plan</button>
    `);

    document.querySelectorAll('.add-ex-to-day').forEach(btn => {
      btn.addEventListener('click', () => {
        const di = Number(btn.dataset.di);
        const plans = Storage.getPlans();
        const p = plans.find(x => x.id === id);
        if (p && p.days[di] && !Array.isArray(p.days[di].exercises)) {
          p.days[di].exercises = [];
          Storage.savePlans(plans);
        }
        this.showAddExerciseModal(id, di);
      });
    });

    document.querySelectorAll('.edit-plan-ex').forEach(btn => {
      btn.addEventListener('click', () => {
        const di = Number(btn.dataset.di);
        const ei = Number(btn.dataset.ei);
        const fresh = Storage.getPlans().find(p => p.id === id);
        const entry = fresh?.days?.[di]?.exercises?.[ei];
        if (!entry) return;
        this.showAddExerciseModal(id, di, entry, ei);
      });
    });

    document.querySelectorAll('.remove-ex').forEach(btn => {
      btn.addEventListener('click', () => {
        const di = Number(btn.dataset.di);
        const ei = Number(btn.dataset.ei);
        const plans = Storage.getPlans();
        const p = plans.find(x => x.id === id);
        if (!p?.days?.[di]?.exercises) return;
        p.days[di].exercises.splice(ei, 1);
        Storage.savePlans(plans);
        this.showEdit(id);
      });
    });

    document.querySelectorAll('.move-ex-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const di = Number(btn.dataset.di);
        const ei = Number(btn.dataset.ei);
        if (ei <= 0) return;
        const plans = Storage.getPlans();
        const p = plans.find(x => x.id === id);
        const arr = p?.days?.[di]?.exercises;
        if (!arr) return;
        [arr[ei - 1], arr[ei]] = [arr[ei], arr[ei - 1]];
        Storage.savePlans(plans);
        this.showEdit(id);
      });
    });

    document.querySelectorAll('.move-ex-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const di = Number(btn.dataset.di);
        const ei = Number(btn.dataset.ei);
        const plans = Storage.getPlans();
        const p = plans.find(x => x.id === id);
        const arr = p?.days?.[di]?.exercises;
        if (!arr || ei >= arr.length - 1) return;
        [arr[ei], arr[ei + 1]] = [arr[ei + 1], arr[ei]];
        Storage.savePlans(plans);
        this.showEdit(id);
      });
    });

    document.getElementById('save-plan-edit')?.addEventListener('click', () => {
      const plans = Storage.getPlans();
      const p = plans.find(x => x.id === id);
      if (!p) return;
      document.querySelectorAll('.day-name').forEach(inp => {
        const di = Number(inp.dataset.di);
        if (p.days[di]) p.days[di].name = inp.value;
      });
      Storage.savePlans(plans);
      Utils.closeModal();
      App.refresh();
      Utils.toast('Zapisano');
    });

    document.getElementById('delete-plan')?.addEventListener('click', () => {
      if (!Utils.confirm('Usunąć plan?')) return;
      Storage.savePlans(Storage.getPlans().filter(p => p.id !== id));
      Utils.closeModal();
      App.refresh();
      Utils.toast('Usunięto');
    });
  },

  defaultSetRow() {
    return { reps: '8-12', type: 'working', rir: 2, rip: '' };
  },

  showAddExerciseModal(planId, dayIndex, existing = null, editIndex = null) {
    const allEx = Utils.allExercises().filter(ex => ex && ex.id && ex.name);
    const isEdit = !!existing;
    const selectedId = existing?.exerciseId || '';
    let setRows = existing
      ? this.normalizeSetDetails(existing).map(s => ({
          reps: s.reps,
          type: s.type,
          rir: s.rir != null ? s.rir : '',
          rip: s.rip != null ? s.rip : ''
        }))
      : [this.defaultSetRow(), this.defaultSetRow(), this.defaultSetRow()];

    const restVal = existing?.rest ?? 120;
    const types = (typeof SET_TYPES !== 'undefined' ? SET_TYPES : [{ id: 'working', name: 'Robocza' }]);

    const typeOptions = (selected) =>
      types.map(t => `<option value="${t.id}" ${selected === t.id ? 'selected' : ''}>${t.name}</option>`).join('');

    const renderSetRowsHtml = () => setRows.map((s, i) => `
      <div class="set-config-row" data-si="${i}">
        <div class="set-config-num">${i + 1}</div>
        <input class="form-input set-cfg-reps" data-si="${i}" value="${String(s.reps ?? '8-12').replace(/"/g, '"')}" placeholder="powt." title="Powtórzenia">
        <select class="form-select set-cfg-type" data-si="${i}" title="Typ serii">${typeOptions(s.type)}</select>
        <input class="form-input set-cfg-rir" data-si="${i}" type="number" min="0" max="5" value="${s.rir}" placeholder="RIR" title="RIR">
        <input class="form-input set-cfg-rip" data-si="${i}" type="number" min="1" max="5" value="${s.rip}" placeholder="RIP" title="RIP">
        <button type="button" class="btn btn-ghost set-cfg-remove" data-si="${i}" style="color:var(--danger);padding:6px 8px" ${setRows.length <= 1 ? 'disabled' : ''}>×</button>
      </div>
    `).join('');

    const muscleFilterOptions = () => {
      if (typeof MUSCLE_TREE !== 'undefined') {
        const out = [];
        const walk = (nodes, depth) => {
          (nodes || []).forEach(n => {
            out.push(`<option value="${n.id}">${'· '.repeat(depth)}${n.name}</option>`);
            if (n.children) walk(n.children, depth + 1);
          });
        };
        walk(MUSCLE_TREE, 0);
        return out.join('');
      }
      const groups = (typeof MUSCLE_GROUPS !== 'undefined' ? MUSCLE_GROUPS : []);
      return groups.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
    };

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${isEdit ? 'Edytuj ćwiczenie' : 'Dodaj ćwiczenie'}</div>
        <button class="modal-close" type="button" onclick="Utils.closeModal()">×</button>
      </div>

      ${!isEdit ? `
      <div class="form-group">
        <label>Szukaj</label>
        <input class="form-input" id="pex-search" placeholder="np. wyciskanie, przysiad..." autocomplete="off">
      </div>
      <div class="form-group">
        <label>Partia mięśniowa</label>
        <select class="form-select" id="pex-muscle">
          <option value="all">Wszystkie partie</option>
          ${muscleFilterOptions()}
        </select>
      </div>
      <div id="pex-list" class="pex-list"></div>
      <input type="hidden" id="pex-id" value="">
      <p class="text-xs text-muted mb-12" id="pex-hint">Kliknij ćwiczenie na liście, potem „Dodaj do dnia”</p>
      ` : `
      <div class="card" style="padding:12px;margin-bottom:14px">
        <div class="font-bold">${(Utils.getExerciseById(selectedId)?.name || selectedId)}</div>
      </div>
      <input type="hidden" id="pex-id" value="${selectedId}">
      `}

      <div class="form-group">
        <label>Serie</label>
        <div class="set-config-labels">
          <span>#</span><span>Powt.</span><span>Typ</span><span>RIR</span><span>RIP</span><span></span>
        </div>
        <div id="set-config-list">${renderSetRowsHtml()}</div>
        <button type="button" class="btn btn-secondary btn-block mt-8" id="add-set-row" style="padding:10px;font-size:13px">+ Dodaj serię</button>
      </div>

      <div class="form-group">
        <label>Przerwa między seriami (sekundy)</label>
        <input class="form-input" type="number" id="pex-rest" min="0" max="600" value="${restVal}">
      </div>

      <button type="button" class="btn btn-primary btn-block mt-16" id="pex-confirm" ${!isEdit ? 'disabled' : ''}>
        ${isEdit ? 'Zapisz zmiany' : 'Dodaj do dnia'}
      </button>
      <button type="button" class="btn btn-ghost btn-block mt-8" id="pex-back">Wróć do planu</button>
    `);

    document.getElementById('modal-content') && (document.getElementById('modal-content').scrollTop = 0);

    const syncRowsFromDom = () => {
      document.querySelectorAll('.set-config-row').forEach(row => {
        const i = Number(row.dataset.si);
        if (!setRows[i]) return;
        setRows[i].reps = row.querySelector('.set-cfg-reps')?.value.trim() || '8-12';
        setRows[i].type = row.querySelector('.set-cfg-type')?.value || 'working';
        setRows[i].rir = row.querySelector('.set-cfg-rir')?.value ?? '';
        setRows[i].rip = row.querySelector('.set-cfg-rip')?.value ?? '';
      });
    };

    const refreshSetRows = () => {
      const el = document.getElementById('set-config-list');
      if (!el) return;
      el.innerHTML = renderSetRowsHtml();
      el.querySelectorAll('.set-cfg-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          syncRowsFromDom();
          const i = Number(btn.dataset.si);
          if (setRows.length <= 1) return;
          setRows.splice(i, 1);
          refreshSetRows();
        });
      });
    };

    refreshSetRows();

    document.getElementById('add-set-row')?.addEventListener('click', () => {
      syncRowsFromDom();
      const last = setRows[setRows.length - 1] || this.defaultSetRow();
      setRows.push({ ...last });
      refreshSetRows();
    });

    const renderList = () => {
      const q = (document.getElementById('pex-search')?.value || '').toLowerCase().trim();
      const muscle = document.getElementById('pex-muscle')?.value || 'all';
      let list = allEx.slice();

      if (q) {
        list = list.filter(ex =>
          (ex.name || '').toLowerCase().includes(q) ||
          (ex.nameEn || '').toLowerCase().includes(q)
        );
      }

      if (muscle && muscle !== 'all') {
        list = list.filter(ex => {
          if (typeof MuscleTree !== 'undefined' && MuscleTree.matchesFilter) {
            return MuscleTree.matchesFilter(muscle, MuscleTree.exerciseTags(ex));
          }
          const tags = [
            ex.musclePrimary,
            ...(ex.muscleSecondary || []),
            ...(ex.musclesMain || []),
            ...(ex.musclesSupport || []),
            ...(ex.muscles || [])
          ].filter(Boolean);
          return tags.includes(muscle);
        });
      }

      list = list.slice(0, 40);
      const el = document.getElementById('pex-list');
      if (!el) return;
      const cur = document.getElementById('pex-id')?.value || '';

      if (!list.length) {
        el.innerHTML = '<p class="text-sm text-muted text-center" style="padding:16px">Brak ćwiczeń — zmień filtr</p>';
        return;
      }

      el.innerHTML = list.map(ex => {
        const main = (ex.musclesMain && ex.musclesMain[0]) || ex.musclePrimary || '';
        const badge = Utils.muscleShort(main) || main;
        return `
        <button type="button" class="pex-item ${cur === ex.id ? 'selected' : ''}" data-id="${ex.id}">
          <span class="pex-icon">${ex.icon || '🏋️'}</span>
          <div class="pex-info">
            <div class="text-sm font-bold">${ex.name}</div>
            <div class="text-xs text-muted">${badge}</div>
          </div>
        </button>`;
      }).join('');

      el.querySelectorAll('.pex-item').forEach(item => {
        item.addEventListener('click', () => {
          const idEl = document.getElementById('pex-id');
          if (idEl) idEl.value = item.dataset.id;
          el.querySelectorAll('.pex-item').forEach(x => x.classList.remove('selected'));
          item.classList.add('selected');
          const btn = document.getElementById('pex-confirm');
          if (btn) {
            btn.disabled = false;
            btn.removeAttribute('disabled');
          }
          const hint = document.getElementById('pex-hint');
          if (hint) hint.textContent = 'Wybrano: ' + (item.querySelector('.font-bold')?.textContent || '');
        });
      });
    };

    if (!isEdit) {
      renderList();
      document.getElementById('pex-search')?.addEventListener('input', renderList);
      document.getElementById('pex-muscle')?.addEventListener('change', renderList);
    }

    document.getElementById('pex-confirm')?.addEventListener('click', () => {
      try {
        const exerciseId = document.getElementById('pex-id')?.value;
        if (!exerciseId) {
          Utils.toast('Wybierz ćwiczenie z listy');
          return;
        }
        syncRowsFromDom();
        if (!setRows.length) {
          Utils.toast('Dodaj co najmniej jedną serię');
          return;
        }

        const setDetails = setRows.map(s => ({
          reps: s.reps || '8-12',
          type: s.type || 'working',
          rir: s.rir === '' || s.rir == null ? null : Number(s.rir),
          rip: s.rip === '' || s.rip == null ? null : Number(s.rip)
        }));

        const entry = {
          exerciseId,
          sets: setDetails.length,
          reps: setDetails[0]?.reps || '8-12',
          rir: setDetails.find(s => s.rir != null)?.rir ?? null,
          rip: setDetails.find(s => s.rip != null)?.rip ?? null,
          setType: setDetails[0]?.type || 'working',
          setDetails,
          rest: Number(document.getElementById('pex-rest')?.value) || 120
        };

        const plans = Storage.getPlans();
        const plan = plans.find(p => p.id === planId);
        if (!plan) {
          Utils.toast('Nie znaleziono planu');
          return;
        }
        if (!Array.isArray(plan.days)) plan.days = [];
        if (!plan.days[dayIndex]) {
          Utils.toast('Nie znaleziono dnia treningowego');
          return;
        }
        if (!Array.isArray(plan.days[dayIndex].exercises)) {
          plan.days[dayIndex].exercises = [];
        }

        if (isEdit && editIndex != null && editIndex >= 0) {
          plan.days[dayIndex].exercises[editIndex] = entry;
        } else {
          plan.days[dayIndex].exercises.push(entry);
        }
        Storage.savePlans(plans);
        Utils.toast(isEdit ? 'Zaktualizowano ćwiczenie' : 'Dodano ćwiczenie do planu');
        this.showEdit(planId);
      } catch (err) {
        console.error(err);
        Utils.toast('Błąd zapisu: ' + (err.message || 'nieznany'));
      }
    });

    document.getElementById('pex-back')?.addEventListener('click', () => this.showEdit(planId));
  }
};
