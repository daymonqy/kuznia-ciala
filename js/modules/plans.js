const Plans = {
  _pendingDay: null,
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
              <div class="text-sm text-secondary mt-8">${p.days?.length || 0} dni · ${GOALS.find(g=>g.id===p.goal)?.name || ''} · ${LEVELS.find(l=>l.id===p.level)?.name || ''}</div>
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
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Nowy plan</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="form-group"><label>Nazwa</label><input class="form-input" id="plan-name" placeholder="np. Upper/Lower Mass"></div>
      <div class="form-group"><label>Opis</label><textarea class="form-textarea" id="plan-desc" placeholder="Opcjonalnie"></textarea></div>
      <div class="form-group"><label>Cel</label>
        <select class="form-select" id="plan-goal">${GOALS.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Poziom</label>
        <select class="form-select" id="plan-level">${LEVELS.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Liczba dni</label>
        <select class="form-select" id="plan-days">
          ${[1,2,3,4,5,6].map(n => `<option value="${n}" ${n===3?'selected':''}>${n}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary btn-block mt-16" id="create-plan">Utwórz i dodaj ćwiczenia</button>
    `);
    document.getElementById('create-plan').addEventListener('click', () => {
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

  formatExMeta(ex) {
    const typeName = SET_TYPES.find(t => t.id === (ex.setType || 'working'))?.name || '';
    const parts = [`${ex.sets}×${ex.reps}`];
    if (ex.rir != null && ex.rir !== '') parts.push(`RIR ${ex.rir}`);
    if (ex.rip != null && ex.rip !== '') parts.push(`RIP ${ex.rip}`);
    if (typeName && ex.setType && ex.setType !== 'working') parts.push(typeName);
    if (ex.rest) parts.push(`${ex.rest}s`);
    return parts.join(' · ');
  },

  showEdit(id) {
    const plan = Storage.getPlans().find(p => p.id === id);
    if (!plan) return;
    this._editPlanId = id;

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Edycja: ${plan.name}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      ${(plan.days || []).map((day, di) => `
        <div class="card mb-16 plan-day-card" style="padding:14px">
          <div class="flex-between mb-12">
            <input class="form-input day-name" data-di="${di}" value="${day.name}" style="flex:1">
          </div>
          ${(day.exercises || []).map((ex, ei) => {
            const e = Utils.getExerciseById(ex.exerciseId);
            return `<div class="plan-ex-row">
              <div class="plan-ex-main">
                <div class="font-bold text-sm">${e?.name || ex.exerciseId}</div>
                <div class="text-xs text-muted">${this.formatExMeta(ex)}</div>
              </div>
              <button class="btn btn-ghost edit-plan-ex" data-di="${di}" data-ei="${ei}" style="padding:6px 8px;font-size:12px">✎</button>
              <button class="btn btn-ghost remove-ex" data-di="${di}" data-ei="${ei}" style="padding:4px 8px;color:var(--danger)">×</button>
            </div>`;
          }).join('')}
          <button class="btn btn-secondary btn-block mt-8 add-ex-to-day" data-di="${di}" style="padding:10px;font-size:13px">+ Ćwiczenie</button>
        </div>
      `).join('')}
      <button class="btn btn-primary btn-block" id="save-plan-edit">Zapisz zmiany</button>
      <button class="btn btn-ghost btn-block mt-8" id="delete-plan" style="color:var(--danger)">Usuń plan</button>
    `);

    document.querySelectorAll('.add-ex-to-day').forEach(btn => {
      btn.addEventListener('click', () => this.showAddExerciseModal(id, Number(btn.dataset.di)));
    });

    document.querySelectorAll('.edit-plan-ex').forEach(btn => {
      btn.addEventListener('click', () => {
        const di = Number(btn.dataset.di);
        const ei = Number(btn.dataset.ei);
        this.showAddExerciseModal(id, di, plan.days[di].exercises[ei], ei);
      });
    });

    document.querySelectorAll('.remove-ex').forEach(btn => {
      btn.addEventListener('click', () => {
        const di = Number(btn.dataset.di);
        const ei = Number(btn.dataset.ei);
        plan.days[di].exercises.splice(ei, 1);
        Storage.savePlans(Storage.getPlans().map(p => p.id === id ? plan : p));
        this.showEdit(id);
      });
    });

    document.getElementById('save-plan-edit')?.addEventListener('click', () => {
      document.querySelectorAll('.day-name').forEach(inp => {
        plan.days[Number(inp.dataset.di)].name = inp.value;
      });
      Storage.savePlans(Storage.getPlans().map(p => p.id === id ? plan : p));
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

  showAddExerciseModal(planId, dayIndex, existing = null, editIndex = null) {
    const allEx = Utils.allExercises();
    const isEdit = !!existing;
    const selectedId = existing?.exerciseId || '';

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${isEdit ? 'Edytuj ćwiczenie' : 'Dodaj ćwiczenie'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>

      ${!isEdit ? `
      <div class="form-group">
        <label>Szukaj ćwiczenia</label>
        <input class="form-input" id="pex-search" placeholder="np. wyciskanie, przysiad...">
      </div>
      <div id="pex-list" class="pex-list"></div>
      <input type="hidden" id="pex-id" value="">
      ` : `
      <div class="card" style="padding:12px;margin-bottom:14px">
        <div class="font-bold">${Utils.getExerciseById(selectedId)?.name || selectedId}</div>
      </div>
      <input type="hidden" id="pex-id" value="${selectedId}">
      `}

      <div class="form-row-2">
        <div class="form-group">
          <label>Serie</label>
          <input class="form-input" type="number" id="pex-sets" min="1" max="20" value="${existing?.sets ?? 3}">
        </div>
        <div class="form-group">
          <label>Powtórzenia</label>
          <input class="form-input" id="pex-reps" placeholder="8-12" value="${existing?.reps ?? '8-12'}">
        </div>
      </div>

      <div class="form-row-2">
        <div class="form-group">
          <label>RIR</label>
          <input class="form-input" type="number" id="pex-rir" min="0" max="5" step="1" value="${existing?.rir ?? 2}" placeholder="0–5">
        </div>
        <div class="form-group">
          <label>RIP (1–5)</label>
          <input class="form-input" type="number" id="pex-rip" min="1" max="5" step="1" value="${existing?.rip ?? ''}" placeholder="opc.">
        </div>
      </div>

      <div class="form-group">
        <label>Typ serii</label>
        <select class="form-select" id="pex-type">
          ${SET_TYPES.map(t => `<option value="${t.id}" ${(existing?.setType || 'working') === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
      </div>

      <div class="form-group">
        <label>Przerwa (sekundy)</label>
        <input class="form-input" type="number" id="pex-rest" min="0" max="600" value="${existing?.rest ?? 120}">
      </div>

      <button class="btn btn-primary btn-block mt-16" id="pex-confirm" ${!isEdit ? 'disabled' : ''}>
        ${isEdit ? 'Zapisz zmiany' : 'Dodaj do dnia'}
      </button>
      <button class="btn btn-ghost btn-block mt-8" id="pex-back">Wróć do planu</button>
    `);

    const renderList = () => {
      const q = (document.getElementById('pex-search')?.value || '').toLowerCase().trim();
      const list = allEx.filter(ex => {
        if (!q) return true;
        return ex.name.toLowerCase().includes(q) || (ex.nameEn || '').toLowerCase().includes(q);
      }).slice(0, 25);
      const el = document.getElementById('pex-list');
      if (!el) return;
      el.innerHTML = list.map(ex => `
        <div class="pex-item ${document.getElementById('pex-id').value === ex.id ? 'selected' : ''}" data-id="${ex.id}">
          <span class="pex-icon">${ex.icon || '🏋️'}</span>
          <div>
            <div class="text-sm font-bold">${ex.name}</div>
            <div class="text-xs text-muted">${Utils.muscleShort(ex.musclePrimary)}</div>
          </div>
        </div>
      `).join('') || '<p class="text-sm text-muted text-center">Brak wyników</p>';

      el.querySelectorAll('.pex-item').forEach(item => {
        item.addEventListener('click', () => {
          document.getElementById('pex-id').value = item.dataset.id;
          el.querySelectorAll('.pex-item').forEach(x => x.classList.remove('selected'));
          item.classList.add('selected');
          const btn = document.getElementById('pex-confirm');
          if (btn) btn.disabled = false;
        });
      });
    };

    if (!isEdit) {
      renderList();
      document.getElementById('pex-search')?.addEventListener('input', renderList);
    }

    document.getElementById('pex-confirm')?.addEventListener('click', () => {
      const exerciseId = document.getElementById('pex-id').value;
      if (!exerciseId) { Utils.toast('Wybierz ćwiczenie'); return; }
      const sets = Number(document.getElementById('pex-sets').value) || 3;
      const reps = document.getElementById('pex-reps').value.trim() || '8-12';
      const rirVal = document.getElementById('pex-rir').value;
      const ripVal = document.getElementById('pex-rip').value;
      const setType = document.getElementById('pex-type').value || 'working';
      const rest = Number(document.getElementById('pex-rest').value) || 120;

      const entry = {
        exerciseId,
        sets,
        reps,
        rir: rirVal === '' ? null : Number(rirVal),
        rip: ripVal === '' ? null : Number(ripVal),
        setType,
        rest
      };

      const plans = Storage.getPlans();
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      if (isEdit && editIndex != null) {
        plan.days[dayIndex].exercises[editIndex] = entry;
      } else {
        plan.days[dayIndex].exercises.push(entry);
      }
      Storage.savePlans(plans);
      Utils.toast(isEdit ? 'Zaktualizowano' : 'Dodano');
      this.showEdit(planId);
    });

    document.getElementById('pex-back')?.addEventListener('click', () => this.showEdit(planId));
  }
};
