const Workout = {
  active: null,
  restTimer: null,
  restSeconds: 0,
  elapsedTimer: null,
  startTime: null,

  start(planDay = null) {
    const settings = Storage.getSettings();
    this.active = {
      id: Utils.uid(),
      name: planDay?.name || 'Trening',
      date: new Date().toISOString(),
      exercises: [],
      duration: 0,
      tonnage: 0,
      notes: '',
      feelingBefore: null,
      feelingAfter: null
    };
    this.startTime = Date.now();

    if (planDay?.exercises) {
      planDay.exercises.forEach(pe => {
        const ex = Utils.getExerciseById(pe.exerciseId);
        if (!ex) return;
        const hist = Storage.getExerciseHistory(pe.exerciseId);
        const suggestion = Utils.suggestWeight(hist);
        this.active.exercises.push({
          exerciseId: pe.exerciseId,
          name: ex.name,
          musclePrimary: ex.musclePrimary,
          muscleSecondary: ex.muscleSecondary || [],
          plannedSets: pe.sets || 3,
          plannedReps: pe.reps || '8-12',
          plannedRir: pe.rir ?? 2,
          rest: pe.rest || settings.restDefault,
          suggestedWeight: suggestion?.weight || null,
          sets: [],
          currentSet: 0
        });
      });
    }

    this.startElapsed();
    App.navigate('live');
  },

  startElapsed() {
    clearInterval(this.elapsedTimer);
    this.elapsedTimer = setInterval(() => {
      if (!this.active) return;
      this.active.duration = Math.floor((Date.now() - this.startTime) / 1000);
      const el = document.getElementById('live-elapsed');
      if (el) el.textContent = Utils.formatDuration(this.active.duration);
    }, 1000);
  },

  render() {
    if (!this.active) {
      const plans = Storage.getPlans();
      const plan = plans[0];
      return `
        <div class="section-title">Rozpocznij trening</div>
        ${plan ? `
          <div class="card">
            <div class="card-title">Z planu: ${plan.name}</div>
            ${(plan.days || []).map((d, i) => `
              <button class="btn btn-secondary btn-block mb-8 start-plan-day" data-day="${i}">
                ${d.name} · ${d.exercises?.length || 0} ćw.
              </button>
            `).join('')}
          </div>
        ` : ''}
        <button class="btn btn-primary btn-lg btn-block mt-16" id="start-empty">
          Pusty trening (dodaj ćwiczenia)
        </button>
        <button class="btn btn-secondary btn-block mt-12" id="start-quick">
          Szybki tryb (minimalny)
        </button>
        <p class="text-sm text-muted text-center mt-16">Przed treningiem możesz ocenić samopoczucie</p>
        <button class="btn btn-ghost btn-block" id="btn-feeling-before">Oceń energię / sen / stres</button>
      `;
    }

    const settings = Storage.getSettings();
    const isBeginner = settings.mode === 'beginner';
    const exIdx = this.active._currentEx ?? 0;
    const ex = this.active.exercises[exIdx];

    if (!ex) {
      return this.renderEmptyLive();
    }

    const hist = Storage.getExerciseHistory(ex.exerciseId);
    const lastSets = hist[0]?.sets?.filter(s => s.type !== 'warmup').slice(0, 3) || [];
    const completedSets = ex.sets.length;
    const targetSets = ex.plannedSets || 3;

    return `
      <div class="live-header">
        <div>
          <div class="text-sm text-muted">Trening · <span id="live-elapsed">${Utils.formatDuration(this.active.duration)}</span></div>
          <div class="font-bold">${this.active.name}</div>
        </div>
        <button class="btn btn-secondary" id="btn-finish-workout" style="padding:8px 14px;font-size:13px">Zakończ</button>
      </div>

      <div class="flex gap-8 mb-16" style="overflow-x:auto">
        ${this.active.exercises.map((e, i) => `
          <button class="chip ${i === exIdx ? 'active' : ''}" data-exidx="${i}" style="flex-shrink:0">
            ${i + 1}. ${e.name.split(' ').slice(0, 2).join(' ')}
          </button>
        `).join('')}
        <button class="chip" id="btn-add-ex-live" style="flex-shrink:0">+ Ćwiczenie</button>
      </div>

      <div class="exercise-live-card">
        <div class="ex-live-name">${ex.name}</div>
        <div class="ex-live-prev">
          ${lastSets.length ? 'Poprzednio: ' + lastSets.map(s => `${s.weight}×${s.reps}`).join(' · ') : 'Brak historii'}
          ${ex.suggestedWeight ? ` · Sugerowane: <strong>${ex.suggestedWeight} kg</strong>` : ''}
        </div>

        <div class="set-labels">
          <div>#</div>
          <div>Ciężar</div>
          <div>Powt.</div>
          <div>${isBeginner ? 'OK' : 'RIR'}</div>
        </div>

        ${ex.sets.map((s, i) => `
          <div class="set-row completed">
            <div class="set-num">${i + 1}</div>
            <div class="text-center font-bold">${s.weight}</div>
            <div class="text-center font-bold">${s.reps}</div>
            <div class="text-center text-sm">${s.rir ?? '–'}</div>
          </div>
        `).join('')}

        <div class="set-row" id="current-set-row">
          <div class="set-num">${completedSets + 1}</div>
          <input class="set-input" type="number" id="set-weight" step="0.5" min="0"
            value="${ex.suggestedWeight || (lastSets[0]?.weight ?? '')}" placeholder="kg">
          <input class="set-input" type="number" id="set-reps" min="0" max="100"
            value="" placeholder="powt">
          ${isBeginner
            ? `<button class="btn btn-accent" id="btn-save-set" style="padding:10px">✓</button>`
            : `<input class="set-input" type="number" id="set-rir" min="0" max="5" step="1" value="${ex.plannedRir ?? 2}" placeholder="RIR">`
          }
        </div>

        ${!isBeginner ? `
        <div class="rir-slider-wrap">
          <div class="text-xs text-muted text-center mb-8">RIR — ile powtórzeń w zapasie</div>
          <input type="range" class="rir-slider" id="rir-slider" min="0" max="5" step="1" value="${ex.plannedRir ?? 2}">
          <div class="rir-value" id="rir-display">${ex.plannedRir ?? 2}</div>
          <div class="rir-desc" id="rir-desc">${this.rirLabel(ex.plannedRir ?? 2)}</div>
        </div>

        <div class="flex gap-8 mt-12">
          <div class="form-group" style="flex:1;margin:0">
            <label>RPE (1-10)</label>
            <input class="form-input" type="number" id="set-rpe" min="1" max="10" step="0.5" placeholder="opc.">
          </div>
          <div class="form-group" style="flex:1;margin:0">
            <label>RIP (1-5)</label>
            <input class="form-input" type="number" id="set-rip" min="1" max="5" placeholder="opc.">
          </div>
        </div>

        <div class="form-group mt-12">
          <label>Typ serii</label>
          <select class="form-select" id="set-type">
            ${SET_TYPES.map(t => `<option value="${t.id}">${t.name}</option>`).join('')}
          </select>
        </div>
        ` : ''}

        <button class="btn btn-primary btn-lg btn-block mt-16" id="btn-save-set">
          Zapisz serię ${completedSets + 1}
        </button>

        <div class="flex gap-8 mt-12">
          <button class="btn btn-secondary" id="btn-skip-set" style="flex:1">Pomiń</button>
          <button class="btn btn-secondary" id="btn-add-set" style="flex:1">+ Seria</button>
        </div>
      </div>

      <div class="text-sm text-muted text-center">
        Seria ${completedSets + 1} / ${targetSets}
        ${completedSets >= targetSets ? ' · Możesz dodać ekstra' : ''}
      </div>
    `;
  },

  renderEmptyLive() {
    return `
      <div class="live-header">
        <div class="font-bold">${this.active.name}</div>
        <button class="btn btn-secondary" id="btn-finish-workout" style="padding:8px 14px;font-size:13px">Zakończ</button>
      </div>
      <div class="empty-state">
        <div class="empty-icon">➕</div>
        <h3>Dodaj ćwiczenia</h3>
        <p>Wybierz ćwiczenia do wykonania w tym treningu.</p>
        <button class="btn btn-primary" id="btn-add-ex-live">Dodaj ćwiczenie</button>
      </div>
    `;
  },

  rirLabel(v) {
    const labels = {
      0: '0 RIR — brak możliwości kolejnego powtórzenia',
      1: '1 RIR — jeszcze 1 powtórzenie',
      2: '2 RIR — jeszcze 2 powtórzenia',
      3: '3 RIR — komfortowy zapas',
      4: '4 RIR — łatwa seria',
      5: '5+ RIR — bardzo lekka'
    };
    return labels[v] || labels[5];
  },

  bind() {
    if (!this.active) {
      document.getElementById('start-empty')?.addEventListener('click', () => this.start());
      document.getElementById('start-quick')?.addEventListener('click', () => {
        const s = Storage.getSettings();
        s.mode = 'beginner';
        Storage.saveSettings(s);
        this.start();
      });
      document.querySelectorAll('.start-plan-day').forEach(btn => {
        btn.addEventListener('click', () => {
          const plans = Storage.getPlans();
          const day = plans[0]?.days?.[Number(btn.dataset.day)];
          this.start(day);
        });
      });
      document.getElementById('btn-feeling-before')?.addEventListener('click', () => this.showFeelingModal('before'));
      return;
    }

    document.getElementById('btn-finish-workout')?.addEventListener('click', () => this.finish());
    document.getElementById('btn-add-ex-live')?.addEventListener('click', () => this.showAddExercise());
    document.querySelectorAll('[data-exidx]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.active._currentEx = Number(btn.dataset.exidx);
        App.refresh();
      });
    });

    const rirSlider = document.getElementById('rir-slider');
    if (rirSlider) {
      rirSlider.addEventListener('input', () => {
        const v = Number(rirSlider.value);
        document.getElementById('rir-display').textContent = v;
        document.getElementById('rir-desc').textContent = this.rirLabel(v);
        const rirInput = document.getElementById('set-rir');
        if (rirInput) rirInput.value = v;
      });
    }

    document.getElementById('btn-save-set')?.addEventListener('click', () => this.saveSet());
    document.getElementById('btn-skip-set')?.addEventListener('click', () => {
      Utils.toast('Pominięto serię');
    });
    document.getElementById('btn-add-set')?.addEventListener('click', () => {
      const ex = this.active.exercises[this.active._currentEx ?? 0];
      if (ex) { ex.plannedSets = (ex.plannedSets || 3) + 1; App.refresh(); }
    });
  },

  saveSet() {
    const exIdx = this.active._currentEx ?? 0;
    const ex = this.active.exercises[exIdx];
    if (!ex) return;

    const weight = Number(document.getElementById('set-weight')?.value);
    const reps = Number(document.getElementById('set-reps')?.value);
    if (!weight && weight !== 0) { Utils.toast('Podaj ciężar'); return; }
    if (!reps || reps < 1) { Utils.toast('Podaj powtórzenia'); return; }
    if (weight < 0 || reps < 0) { Utils.toast('Wartości nie mogą być ujemne'); return; }

    const settings = Storage.getSettings();
    const set = {
      weight,
      reps,
      rir: settings.mode === 'beginner' ? null : (Number(document.getElementById('set-rir')?.value) ?? null),
      rpe: Number(document.getElementById('set-rpe')?.value) || null,
      rip: Number(document.getElementById('set-rip')?.value) || null,
      type: document.getElementById('set-type')?.value || 'working',
      note: '',
      timestamp: new Date().toISOString()
    };

    if (set.rir != null && set.rpe == null) set.rpe = Utils.rirToRpe(set.rir);

    ex.sets.push(set);

    const prs = Storage.getPersonalRecords();
    const prev = prs[ex.exerciseId];
    if (!prev || weight > prev.maxWeight) {
      Utils.toast('🏆 NOWY REKORD — największy ciężar!', 'record');
    } else if (weight * reps > (prev?.maxTonnage || 0)) {
      Utils.toast('🏆 NOWY REKORD — tonnage!', 'record');
    } else {
      Utils.toast('Seria zapisana ✓', 'success');
    }

    const rest = ex.rest || Storage.getSettings().restDefault || 90;
    this.startRest(rest);
    App.refresh();
  },

  startRest(seconds) {
    this.restSeconds = seconds;
    clearInterval(this.restTimer);
    const overlay = document.createElement('div');
    overlay.className = 'rest-timer-overlay';
    overlay.id = 'rest-overlay';
    overlay.innerHTML = `
      <div class="text-sm text-muted mb-8">PRZERWA</div>
      <div class="rest-time" id="rest-display">${Utils.formatTime(this.restSeconds)}</div>
      <div class="rest-controls">
        <button class="btn btn-secondary" id="rest-minus">−30s</button>
        <button class="btn btn-primary" id="rest-skip">Pomiń</button>
        <button class="btn btn-secondary" id="rest-plus">+30s</button>
      </div>
    `;
    document.body.appendChild(overlay);

    this.restTimer = setInterval(() => {
      this.restSeconds--;
      const el = document.getElementById('rest-display');
      if (el) el.textContent = Utils.formatTime(Math.max(0, this.restSeconds));
      if (this.restSeconds <= 0) {
        this.endRest();
        Utils.toast('Koniec przerwy — czas na serię!');
      }
    }, 1000);

    document.getElementById('rest-skip')?.addEventListener('click', () => this.endRest());
    document.getElementById('rest-plus')?.addEventListener('click', () => { this.restSeconds += 30; });
    document.getElementById('rest-minus')?.addEventListener('click', () => { this.restSeconds = Math.max(0, this.restSeconds - 30); });
  },

  endRest() {
    clearInterval(this.restTimer);
    document.getElementById('rest-overlay')?.remove();
  },

  showAddExercise() {
    const all = Utils.allExercises();
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Dodaj ćwiczenie</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <input class="search-input mb-16" id="live-ex-search" placeholder="Szukaj...">
      <div id="live-ex-list" style="max-height:50vh;overflow-y:auto">
        ${all.slice(0, 30).map(ex => `
          <div class="exercise-item live-add-ex" data-id="${ex.id}">
            <div class="ex-thumb">${ex.icon || '🏋️'}</div>
            <div class="ex-info">
              <div class="ex-name">${ex.name}</div>
              <div class="ex-meta"><span class="ex-badge">${Utils.muscleShort(ex.musclePrimary)}</span></div>
            </div>
          </div>
        `).join('')}
      </div>
    `);
    document.querySelectorAll('.live-add-ex').forEach(item => {
      item.addEventListener('click', () => {
        const ex = Utils.getExerciseById(item.dataset.id);
        if (!ex) return;
        this.active.exercises.push({
          exerciseId: ex.id,
          name: ex.name,
          musclePrimary: ex.musclePrimary,
          muscleSecondary: ex.muscleSecondary || [],
          plannedSets: 3,
          plannedReps: '8-12',
          plannedRir: 2,
          rest: 90,
          sets: [],
          currentSet: 0
        });
        this.active._currentEx = this.active.exercises.length - 1;
        Utils.closeModal();
        App.refresh();
      });
    });
  },

  showFeelingModal(when) {
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Samopoczucie ${when === 'before' ? 'przed' : 'po'} treningu</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      ${['Energia', 'Sen', 'Stres', 'Motywacja', 'Bolesność'].map((label, i) => `
        <div class="form-group">
          <label>${label} (1-5)</label>
          <input type="range" class="rir-slider" id="feel-${i}" min="1" max="5" value="3">
          <div class="text-center font-bold" id="feel-val-${i}">3</div>
        </div>
      `).join('')}
      <button class="btn btn-primary btn-block mt-16" id="save-feeling">Zapisz</button>
    `);
    for (let i = 0; i < 5; i++) {
      document.getElementById(`feel-${i}`)?.addEventListener('input', e => {
        document.getElementById(`feel-val-${i}`).textContent = e.target.value;
      });
    }
    document.getElementById('save-feeling')?.addEventListener('click', () => {
      const data = {
        energy: Number(document.getElementById('feel-0').value),
        sleep: Number(document.getElementById('feel-1').value),
        stress: Number(document.getElementById('feel-2').value),
        motivation: Number(document.getElementById('feel-3').value),
        soreness: Number(document.getElementById('feel-4').value)
      };
      if (this.active) {
        if (when === 'before') this.active.feelingBefore = data;
        else this.active.feelingAfter = data;
      }
      Utils.closeModal();
      Utils.toast('Zapisano ocenę');
    });
  },

  finish() {
    if (!this.active) return;
    if (this.active.exercises.every(e => e.sets.length === 0)) {
      if (!Utils.confirm('Brak zapisanych serii. Anulować trening?')) return;
      this.active = null;
      clearInterval(this.elapsedTimer);
      App.navigate('dashboard');
      return;
    }

    let tonnage = 0, totalSets = 0, totalReps = 0;
    this.active.exercises.forEach(ex => {
      ex.sets.forEach(s => {
        if (s.type === 'warmup') return;
        tonnage += (s.weight || 0) * (s.reps || 0);
        totalSets++;
        totalReps += s.reps || 0;
      });
    });
    this.active.tonnage = tonnage;
    this.active.duration = Math.floor((Date.now() - this.startTime) / 1000);

    const muscleEng = {};
    this.active.exercises.forEach(ex => {
      const add = (m, factor) => {
        if (!muscleEng[m]) muscleEng[m] = { sets: 0, tonnage: 0 };
        muscleEng[m].sets += factor;
      };
      ex.sets.filter(s => s.type !== 'warmup').forEach(() => {
        add(ex.musclePrimary, 1);
        (ex.muscleSecondary || []).forEach(m => add(m, 0.5));
      });
    });

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Podsumowanie treningu</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${Utils.formatDuration(this.active.duration)}</div><div class="stat-label">Czas</div></div>
        <div class="stat-box"><div class="stat-value">${totalSets}</div><div class="stat-label">Serie</div></div>
        <div class="stat-box"><div class="stat-value">${Math.round(tonnage)}</div><div class="stat-label">Tonnage</div></div>
      </div>
      <div class="card mt-16">
        <div class="card-title">Zaangażowanie mięśni</div>
        ${Object.entries(muscleEng).map(([m, v]) => `
          <div class="flex-between text-sm mb-8">
            <span>${Utils.muscleShort(m)}</span>
            <span>${Math.round(v.sets)} serii</span>
          </div>
        `).join('')}
      </div>
      <p class="text-xs text-muted mt-8">Dane wykorzystane do analizy regeneracji i progresu.</p>
      <button class="btn btn-primary btn-block mt-16" id="confirm-finish">Zapisz trening</button>
      <button class="btn btn-ghost btn-block mt-8" id="btn-feeling-after">Oceń samopoczucie po</button>
    `);

    document.getElementById('confirm-finish')?.addEventListener('click', () => {
      Storage.addWorkout(this.active);
      this.active = null;
      clearInterval(this.elapsedTimer);
      this.endRest();
      Utils.closeModal();
      App.navigate('dashboard');
      Utils.toast('Trening zapisany! 💪', 'success');
    });
    document.getElementById('btn-feeling-after')?.addEventListener('click', () => this.showFeelingModal('after'));
  }
};
