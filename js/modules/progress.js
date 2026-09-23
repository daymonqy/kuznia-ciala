const Progress = {
  render() {
    const stats = Storage.getTotalStats();
    const prs = Storage.getPersonalRecords();
    const workouts = Storage.getWorkouts();
    const prList = Object.entries(prs);

    const volumes = MUSCLE_GROUPS.filter(m => !['core','przedramiona'].includes(m.id)).map(m => {
      const v = Utils.getMuscleVolume(m.id, workouts, 7);
      return { ...m, ...v };
    }).filter(v => v.total > 0);

    return `
      <div class="section-title">Postęp i analityka</div>

      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${stats.workouts}</div><div class="stat-label">Treningi</div></div>
        <div class="stat-box"><div class="stat-value">${stats.sets}</div><div class="stat-label">Serie</div></div>
        <div class="stat-box"><div class="stat-value">${stats.tonnage > 1000 ? (stats.tonnage/1000).toFixed(1)+'t' : stats.tonnage}</div><div class="stat-label">Tonnage</div></div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${stats.avgRir ?? '–'}</div><div class="stat-label">Śr. RIR</div></div>
        <div class="stat-box"><div class="stat-value">${stats.avgRpe ?? '–'}</div><div class="stat-label">Śr. RPE</div></div>
        <div class="stat-box"><div class="stat-value">${Utils.formatDuration(stats.duration)}</div><div class="stat-label">Czas łącznie</div></div>
      </div>

      <div class="section-title mt-24">Objętość tygodniowa</div>
      <div class="card">
        ${volumes.length === 0 ? '<p class="text-sm text-muted">Brak danych z ostatnich 7 dni</p>' :
          volumes.map(v => `
            <div class="flex-between mb-12">
              <span class="text-sm font-bold">${v.short}</span>
              <span class="text-sm">${v.direct} + ${v.indirect} pośrednich = <strong>${v.total}</strong></span>
            </div>
            <div class="recovery-bar-bg mb-16">
              <div class="recovery-bar" style="width:${Math.min(100, v.total * 5)}%;background:var(--primary)"></div>
            </div>
          `).join('')}
      </div>

      <div class="section-title mt-24">Rekordy osobiste</div>
      ${prList.length === 0 ? `
        <div class="empty-state" style="padding:24px">
          <div class="empty-icon">🏆</div>
          <h3>Brak rekordów</h3>
          <p>Wykonaj treningi, aby automatycznie wykryć PR.</p>
        </div>
      ` : `
        <div class="card">
          ${prList.map(([id, p]) => `
            <div class="flex-between mb-12" style="padding-bottom:12px;border-bottom:1px solid var(--border)">
              <div>
                <div class="font-bold text-sm">${p.name}</div>
                <div class="text-xs text-muted">e1RM ≈ ${p.bestE1RM} kg</div>
              </div>
              <div class="text-right">
                <div class="font-bold" style="color:var(--primary)">${p.maxWeight} kg</div>
                <div class="text-xs text-muted">${p.maxReps} powt. max</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}

      <div class="section-title mt-24">Częstotliwość (ok. 4 tyg.)</div>
      <div class="card">
        ${MUSCLE_GROUPS.filter(m => !['core','przedramiona'].includes(m.id)).map(m => {
          const v = Utils.getMuscleVolume(m.id, workouts, 28);
          const freq = (v.total > 0 ? (v.direct / 4) : 0).toFixed(1);
          return `<div class="flex-between text-sm mb-8"><span>${m.short}</span><span>${freq}× / tydzień</span></div>`;
        }).join('')}
      </div>
    `;
  },

  bind() {}
};
