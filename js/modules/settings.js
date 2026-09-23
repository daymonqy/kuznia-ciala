const Settings = {
  render() {
    const s = Storage.getSettings();
    return `
      <div class="section-title">Ustawienia</div>

      <div class="card">
        <div class="card-title">Tryb interfejsu</div>
        <div class="tabs">
          <button class="tab ${s.mode==='beginner'?'active':''}" data-mode="beginner">Początkujący</button>
          <button class="tab ${s.mode==='advanced'?'active':''}" data-mode="advanced">Zaawansowany</button>
        </div>
        <p class="text-sm text-muted">Początkujący: tylko ciężar i powtórzenia. Zaawansowany: RIR, RPE, RIP, typy serii.</p>
      </div>

      <div class="card">
        <div class="form-group">
          <label>Domyślna przerwa (s)</label>
          <input class="form-input" type="number" id="set-rest" value="${s.restDefault || 90}" min="30" max="600">
        </div>
        <div class="form-group">
          <label>Metoda progresji</label>
          <select class="form-select" id="set-prog">
            <option value="double" ${s.progression==='double'?'selected':''}>Double progression</option>
            <option value="linear" ${s.progression==='linear'?'selected':''}>Linear</option>
            <option value="rir" ${s.progression==='rir'?'selected':''}>RIR-based</option>
            <option value="rpe" ${s.progression==='rpe'?'selected':''}>RPE-based</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block mt-12" id="save-settings">Zapisz ustawienia</button>
      </div>

      <div class="card">
        <div class="card-title">Dodaj pomiar masy</div>
        <div class="form-group">
          <input class="form-input" type="number" step="0.1" id="body-weight" placeholder="kg">
        </div>
        <button class="btn btn-secondary btn-block" id="add-body">Zapisz pomiar</button>
      </div>

      <div class="card">
        <div class="card-title">Dane</div>
        <button class="btn btn-secondary btn-block" id="export-data">Eksportuj dane (JSON)</button>
        <button class="btn btn-ghost btn-block mt-8" id="reset-data" style="color:var(--danger)">Reset wszystkich danych</button>
      </div>
    `;
  },

  bind() {
    document.querySelectorAll('.tab[data-mode]').forEach(t => {
      t.addEventListener('click', () => {
        const s = Storage.getSettings();
        s.mode = t.dataset.mode;
        Storage.saveSettings(s);
        App.refresh();
        Utils.toast('Tryb: ' + (s.mode === 'beginner' ? 'Początkujący' : 'Zaawansowany'));
      });
    });
    document.getElementById('save-settings')?.addEventListener('click', () => {
      const s = Storage.getSettings();
      s.restDefault = Number(document.getElementById('set-rest').value) || 90;
      s.progression = document.getElementById('set-prog').value;
      Storage.saveSettings(s);
      Utils.toast('Zapisano');
    });
    document.getElementById('add-body')?.addEventListener('click', () => {
      const w = Number(document.getElementById('body-weight').value);
      if (!w) return;
      Storage.addBodyLog({ date: new Date().toISOString(), weight: w });
      const user = Storage.getUser();
      if (user) { user.weight = w; Storage.saveUser(user); }
      Utils.toast('Zapisano pomiar');
    });
    document.getElementById('export-data')?.addEventListener('click', () => {
      const data = {
        user: Storage.getUser(),
        workouts: Storage.getWorkouts(),
        plans: Storage.getPlans(),
        customEx: Storage.getCustomExercises(),
        settings: Storage.getSettings(),
        bodyLog: Storage.getBodyLog()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'kuznia-ciala-backup.json';
      a.click();
      Utils.toast('Eksportowano');
    });
    document.getElementById('reset-data')?.addEventListener('click', () => {
      if (Utils.confirm('Na pewno usunąć wszystkie dane?')) {
        localStorage.clear();
        location.reload();
      }
    });
  }
};
