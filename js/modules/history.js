const History = {
  render() {
    const workouts = Storage.getWorkouts();
    return `
      <div class="section-title">Historia treningów</div>
      ${workouts.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>Nie masz jeszcze żadnych treningów</h3>
          <p>Dodaj pierwszy trening, aby zobaczyć historię.</p>
        </div>
      ` : workouts.map(w => `
        <div class="history-item" data-id="${w.id}">
          <div>
            <div class="hist-date">${w.name || 'Trening'}</div>
            <div class="hist-meta">${Utils.formatDateTime(w.date)} · ${Utils.formatDuration(w.duration || 0)} · ${w.exercises?.length || 0} ćw.</div>
          </div>
          <div class="hist-tonnage">${Math.round(w.tonnage || 0)} kg</div>
        </div>
      `).join('')}
    `;
  },

  bind() {
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => this.showDetail(item.dataset.id));
    });
  },

  showDetail(id) {
    const w = Storage.getWorkouts().find(x => x.id === id);
    if (!w) return;
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">${w.name || 'Trening'}</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="text-sm text-secondary mb-16">${Utils.formatDateTime(w.date)} · ${Utils.formatDuration(w.duration || 0)}</div>
      <div class="stats-row mb-16">
        <div class="stat-box"><div class="stat-value">${(w.exercises || []).reduce((a,e) => a + (e.sets?.filter(s=>s.type!=='warmup').length||0), 0)}</div><div class="stat-label">Serie</div></div>
        <div class="stat-box"><div class="stat-value">${Math.round(w.tonnage || 0)}</div><div class="stat-label">Tonnage</div></div>
      </div>
      ${(w.exercises || []).map(ex => `
        <div class="card" style="padding:14px">
          <div class="font-bold mb-8">${ex.name}</div>
          ${(ex.sets || []).map((s, i) => `
            <div class="flex-between text-sm mb-8">
              <span>${i+1}. ${s.weight} kg × ${s.reps}</span>
              <span class="text-muted">${s.type !== 'working' ? SET_TYPES.find(t=>t.id===s.type)?.name || s.type : ''} RIR ${s.rir ?? '–'} RPE ${s.rpe ?? '–'}</span>
            </div>
          `).join('')}
        </div>
      `).join('')}
    `);
  }
};
