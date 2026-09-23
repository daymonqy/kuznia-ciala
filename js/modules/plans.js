const Plans = {
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
        <div class="card" data-plan="${p.id}">
          <div class="flex-between">
            <div>
              <div class="font-bold" style="font-size:16px">${p.name}</div>
              <div class="text-sm text-secondary mt-8">${p.days?.length || 0} dni · ${GOALS.find(g=>g.id===p.goal)?.name || ''} · ${LEVELS.find(l=>l.id===p.level)?.name || ''}</div>
            </div>
          </div>
          <div class="mt-12 text-sm text-muted">${p.description || ''}</div>
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
      <div class="form-group"><label>Opis</label><textarea class="form-textarea" id="plan-desc"></textarea></div>
      <div class="form-group"><label>Cel</label>
        <select class="form-select" id="plan-goal">${GOALS.map(g => `<option value="${g.id}">${g.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Poziom</label>
        <select class="form-select" id="plan-level">${LEVELS.map(l => `<option value="${l.id}">${l.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Liczba dni</label>
        <select class="form-select" id="plan-days">
          ${[1,2,3,4,5,6].map(n => `<option value="${n}">${n}</option>`).join('')}
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

  showEdit(id) {
    const plan = Storage.getPlans().find(p => p.id === id);
    if (!plan) return;
    const allEx = Utils.allExercises();

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Edycja: ${plan.name}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      ${(plan.days || []).map((day, di) => `
        <div class="card mb-16" style="padding:14px">
          <div class="flex-between mb-12">
            <input class="form-input day-name" data-di="${di}" value="${day.name}" style="flex:1;margin-right:8px">
          </div>
          ${(day.exercises || []).map((ex, ei) => {
            const e = Utils.getExerciseById(ex.exerciseId);
            return `<div class="flex-between text-sm mb-8" style="background:var(--bg-elevated);padding:10px;border-radius:8px">
              <span>${e?.name || ex.exerciseId}</span>
              <span class="text-muted">${ex.sets}×${ex.reps} RIR${ex.rir ?? ''}</span>
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
      btn.addEventListener('click', () => {
        const di = Number(btn.dataset.di);
        const pick = prompt('ID lub nazwa ćwiczenia (np. bp_barbell lub Wyciskanie):');
        if (!pick) return;
        const found = allEx.find(e => e.id === pick || e.name.toLowerCase().includes(pick.toLowerCase()));
        if (!found) { Utils.toast('Nie znaleziono'); return; }
        plan.days[di].exercises.push({
          exerciseId: found.id,
          sets: 3,
          reps: '8-12',
          rir: 2,
          rest: 120
        });
        Storage.savePlans(Storage.getPlans().map(p => p.id === id ? plan : p));
        this.showEdit(id);
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
  }
};
