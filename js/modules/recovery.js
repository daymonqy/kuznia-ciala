const Recovery = {
  render() {
    const workouts = Storage.getWorkouts();
    return `
      <div class="section-title">Regeneracja</div>
      <p class="text-sm text-secondary mb-16">Szacowany status regeneracji na podstawie danych treningowych. To orientacyjna metryka, nie pomiar medyczny.</p>

      <div class="muscle-grid">
        ${MUSCLE_GROUPS.filter(m => m.id !== 'core' && m.id !== 'przedramiona').map(m => {
          const pct = Utils.estimateRecovery(m.id, workouts);
          const vol = Utils.getMuscleVolume(m.id, workouts, 7);
          return `
            <div class="muscle-card" data-muscle="${m.id}">
              <h4>${m.short}</h4>
              <div class="recovery-bar-bg mb-8">
                <div class="recovery-bar" style="width:${pct}%;background:${Utils.recoveryColor(pct)}"></div>
              </div>
              <div class="muscle-stats">
                ${pct}% · ${vol.total} serii / 7 dni
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="card mt-24">
        <div class="card-title">Czy mogę dziś trenować?</div>
        <p class="text-sm text-secondary mb-12">Wybierz partię — pokażemy dane pomocnicze. Decyzja należy do Ciebie.</p>
        <div class="chip-group">
          ${MUSCLE_GROUPS.slice(0, 8).map(m => `
            <div class="chip check-muscle" data-m="${m.id}">${m.short}</div>
          `).join('')}
        </div>
        <div id="can-train-result" class="mt-16"></div>
      </div>
    `;
  },

  bind() {
    document.querySelectorAll('.muscle-card').forEach(c => {
      c.addEventListener('click', () => this.showMuscleDetail(c.dataset.muscle));
    });
    document.querySelectorAll('.check-muscle').forEach(c => {
      c.addEventListener('click', () => this.checkCanTrain(c.dataset.m));
    });
  },

  showMuscleDetail(id) {
    const workouts = Storage.getWorkouts();
    const pct = Utils.estimateRecovery(id, workouts);
    const vol7 = Utils.getMuscleVolume(id, workouts, 7);
    const vol30 = Utils.getMuscleVolume(id, workouts, 30);

    let lastDate = null;
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        if (ex.musclePrimary === id || (ex.muscleSecondary || []).includes(id)) {
          if (!lastDate || new Date(w.date) > new Date(lastDate)) lastDate = w.date;
        }
      });
    });
    const hours = lastDate ? Math.round((Date.now() - new Date(lastDate).getTime()) / 3600000) : null;

    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${Utils.muscleName(id)}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="text-center mb-16">
        <div style="font-size:48px;font-weight:800;color:${Utils.recoveryColor(pct)}">${pct}%</div>
        <div class="text-sm text-muted">Szacowany status regeneracji</div>
      </div>
      <div class="card" style="padding:14px">
        <div class="flex-between text-sm mb-8"><span>Czas od treningu</span><span class="font-bold">${hours != null ? hours + ' h' : '–'}</span></div>
        <div class="flex-between text-sm mb-8"><span>Serie (7 dni)</span><span class="font-bold">${vol7.direct} bezpośrednich + ${vol7.indirect} pośrednich</span></div>
        <div class="flex-between text-sm mb-8"><span>Serie (30 dni)</span><span class="font-bold">${vol30.total}</span></div>
        <div class="flex-between text-sm"><span>Tonnage (7 dni)</span><span class="font-bold">${vol7.tonnage} kg</span></div>
      </div>
      <p class="text-xs text-muted mt-12">Dane pomocnicze. Nie stanowią diagnozy ani porady medycznej.</p>
    `);
  },

  checkCanTrain(id) {
    const workouts = Storage.getWorkouts();
    const pct = Utils.estimateRecovery(id, workouts);
    const vol = Utils.getMuscleVolume(id, workouts, 7);
    let lastDate = null, lastRir = null;
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        if (ex.musclePrimary === id || (ex.muscleSecondary || []).includes(id)) {
          if (!lastDate || new Date(w.date) > new Date(lastDate)) {
            lastDate = w.date;
            const s = (ex.sets || []).filter(x => x.rir != null).pop();
            if (s) lastRir = s.rir;
          }
        }
      });
    });
    const hours = lastDate ? Math.round((Date.now() - new Date(lastDate).getTime()) / 3600000) : null;

    document.getElementById('can-train-result').innerHTML = `
      <div class="card" style="padding:14px">
        <div class="font-bold mb-8">${Utils.muscleName(id)}</div>
        <div class="text-sm text-secondary" style="line-height:1.8">
          Szacowana regeneracja: <strong style="color:${Utils.recoveryColor(pct)}">${pct}%</strong><br>
          Czas od ostatniego: ${hours != null ? hours + ' h' : 'brak danych'}<br>
          Objętość 7 dni: ${vol.total} serii<br>
          Ostatni RIR: ${lastRir ?? '–'}
        </div>
        <p class="text-xs text-muted mt-12">To tylko dane pomocnicze. Decyzję o treningu podejmujesz Ty.</p>
      </div>
    `;
  }
};
