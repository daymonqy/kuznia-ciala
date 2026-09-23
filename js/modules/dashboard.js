const Dashboard = {
  render() {
    const user = Storage.getUser();
    const workouts = Storage.getWorkouts();
    const plans = Storage.getPlans();
    const stats = Storage.getTotalStats();
    const name = user?.username || 'Athlete';

    const last = workouts[0];
    const hoursSince = last ? Math.round((Date.now() - new Date(last.date).getTime()) / 3600000) : null;

    const plan = plans[0];
    const nextDay = plan?.days?.[0];

    const muscles = ['klatka', 'plecy', 'barki', 'czworoglowe', 'dwuglowe'];
    const recoveries = muscles.map(m => ({
      id: m,
      name: Utils.muscleShort(m),
      pct: Utils.estimateRecovery(m, workouts)
    }));

    const prs = Storage.getPersonalRecords();
    const prList = Object.values(prs).slice(0, 3);

    return `
      <div class="greeting">Cześć, <span>${name}</span> 👋</div>
      <p class="subtitle-text">${this.getMotivational()}</p>

      ${nextDay ? `
      <div class="workout-card">
        <h3>${nextDay.name || 'Dzisiejszy trening'}</h3>
        <div class="workout-meta">
          <span>${nextDay.exercises?.length || 0} ćwiczeń</span>
          <span>${plan?.name || ''}</span>
        </div>
        <button class="btn-start-workout" id="dash-start">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          Rozpocznij trening
        </button>
      </div>
      ` : `
      <div class="workout-card">
        <h3>Brak planu</h3>
        <div class="workout-meta">Stwórz plan lub rozpocznij pusty trening</div>
        <button class="btn-start-workout" id="dash-start">Rozpocznij trening</button>
      </div>
      `}

      <div class="tiles-grid">
        <div class="tile" data-nav="recovery">
          <div class="tile-icon green">💚</div>
          <div class="tile-label">Regeneracja</div>
          <div class="tile-sub">${hoursSince != null ? hoursSince + 'h od treningu' : 'Brak danych'}</div>
        </div>
        <div class="tile" data-nav="progress">
          <div class="tile-icon blue">📈</div>
          <div class="tile-label">Postęp</div>
          <div class="tile-sub">${stats.workouts} treningów</div>
        </div>
        <div class="tile" data-nav="history">
          <div class="tile-icon purple">📋</div>
          <div class="tile-label">Historia</div>
          <div class="tile-sub">${last ? Utils.formatDate(last.date) : 'Brak'}</div>
        </div>
        <div class="tile" data-nav="calculator">
          <div class="tile-icon orange">⚖️</div>
          <div class="tile-label">Kalkulator</div>
          <div class="tile-sub">Ciężary & talerze</div>
        </div>
        <div class="tile" data-nav="plans">
          <div class="tile-icon blue">📅</div>
          <div class="tile-label">Plany</div>
          <div class="tile-sub">${plans.length} planów</div>
        </div>
        <div class="tile" data-nav="records">
          <div class="tile-icon orange">🏆</div>
          <div class="tile-label">Rekordy</div>
          <div class="tile-sub">${Object.keys(prs).length} PR</div>
        </div>
      </div>

      <div class="section-title">Regeneracja (szacunek)</div>
      <div class="card">
        <div class="recovery-list">
          ${recoveries.map(r => `
            <div class="recovery-item">
              <div class="recovery-name">${r.name}</div>
              <div class="recovery-bar-bg">
                <div class="recovery-bar" style="width:${r.pct}%;background:${Utils.recoveryColor(r.pct)}"></div>
              </div>
              <div class="recovery-pct">${r.pct}%</div>
            </div>
          `).join('')}
        </div>
        <p class="text-xs text-muted mt-12">Szacowany status regeneracji na podstawie objętości, RIR/RPE i czasu. To orientacyjna metryka treningowa, nie pomiar medyczny.</p>
      </div>

      <div class="section-title">Ostatnia aktywność</div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${stats.workouts}</div><div class="stat-label">Treningi</div></div>
        <div class="stat-box"><div class="stat-value">${stats.sets}</div><div class="stat-label">Serie</div></div>
        <div class="stat-box"><div class="stat-value">${stats.tonnage > 1000 ? (stats.tonnage/1000).toFixed(1)+'t' : stats.tonnage+'kg'}</div><div class="stat-label">Tonnage</div></div>
      </div>

      ${last ? `
      <div class="card">
        <div class="card-title">Ostatni trening</div>
        <div class="flex-between">
          <div>
            <div class="font-bold">${last.name || 'Trening'}</div>
            <div class="text-sm text-secondary">${Utils.formatDateTime(last.date)} · ${Utils.formatDuration(last.duration || 0)}</div>
          </div>
          <div class="text-sm font-bold" style="color:var(--primary)">${Math.round(last.tonnage || 0)} kg</div>
        </div>
      </div>
      ` : `
      <div class="empty-state" style="padding:24px">
        <div class="empty-icon">🏋️</div>
        <h3>Nie masz jeszcze żadnych treningów</h3>
        <p>Kliknij „Rozpocznij trening”, aby dodać pierwszy.</p>
      </div>
      `}

      ${prList.length ? `
      <div class="section-title">Ostatnie rekordy</div>
      <div class="card">
        ${prList.map(p => `
          <div class="flex-between mb-8">
            <span class="text-sm">${p.name}</span>
            <span class="font-bold text-sm">${p.maxWeight} kg</span>
          </div>
        `).join('')}
      </div>
      ` : ''}
    `;
  },

  getMotivational() {
    const h = new Date().getHours();
    if (h < 12) return 'Gotowy na poranny trening?';
    if (h < 17) return 'Czas na trening!';
    return 'Wieczorny trening? Dobra decyzja.';
  },

  bind() {
    document.getElementById('dash-start')?.addEventListener('click', () => {
      App.navigate('live');
    });
    document.querySelectorAll('.tile[data-nav]').forEach(t => {
      t.addEventListener('click', () => App.navigate(t.dataset.nav));
    });
  }
};
