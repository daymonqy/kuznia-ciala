const Profile = {
  renderView() {
    const user = Storage.getUser();
    if (!user) return '<div class="empty-state"><p>Brak profilu</p></div>';
    const stats = Storage.getTotalStats();
    const bodyLog = Storage.getBodyLog();
    const email = user.email || (typeof firebase !== 'undefined' && firebase.auth().currentUser?.email) || '';

    return `
      <div class="profile-header">
        <div class="profile-avatar-lg">${user.avatar || 'U'}</div>
        <div>
          <div class="profile-name">${user.username || 'Użytkownik'}</div>
          <div class="profile-goal">${email}</div>
          <div class="text-sm text-muted mt-8">${GOALS.find(g => g.id === user.goal)?.name || ''} · ${LEVELS.find(l => l.id === user.level)?.name || ''}</div>
        </div>
      </div>

      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${stats.workouts}</div><div class="stat-label">Treningi</div></div>
        <div class="stat-box"><div class="stat-value">${stats.sets}</div><div class="stat-label">Serie</div></div>
        <div class="stat-box"><div class="stat-value">${(stats.tonnage/1000).toFixed(1)}t</div><div class="stat-label">Tonnage</div></div>
      </div>
      <div class="stats-row">
        <div class="stat-box"><div class="stat-value">${stats.avgRir ?? '–'}</div><div class="stat-label">Śr. RIR</div></div>
        <div class="stat-box"><div class="stat-value">${stats.avgRpe ?? '–'}</div><div class="stat-label">Śr. RPE</div></div>
        <div class="stat-box"><div class="stat-value">${Utils.formatDuration(stats.duration)}</div><div class="stat-label">Czas</div></div>
      </div>

      <div class="card mt-16">
        <div class="card-title">Dane profilu</div>
        <div class="text-sm text-secondary" style="line-height:1.8">
          Wiek: ${user.age || '–'} · Wzrost: ${user.height ? user.height + ' cm' : '–'} · Masa: ${user.weight ? user.weight + ' kg' : '–'}<br>
          Konto: dane treningowe są zapisywane w chmurze
        </div>
        <button class="btn btn-secondary btn-block mt-12" id="btn-edit-profile">Edytuj profil</button>
      </div>

      <div class="card">
        <div class="card-title">Historia masy ciała</div>
        ${bodyLog.length === 0 ? '<p class="text-secondary text-sm">Brak wpisów. Dodaj pomiar w ustawieniach.</p>' :
          bodyLog.slice(0, 5).map(b => `<div class="flex-between text-sm mb-8"><span>${Utils.formatDate(b.date)}</span><span class="font-bold">${b.weight} kg</span></div>`).join('')}
      </div>

      <button class="btn btn-secondary btn-block mt-16" id="btn-settings">Ustawienia</button>
      <button class="btn btn-ghost btn-block mt-8" id="btn-logout" style="color:var(--danger)">Wyloguj</button>
    `;
  },

  bindView() {
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => this.showEditModal());
    document.getElementById('btn-settings')?.addEventListener('click', () => App.navigate('settings'));
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      if (!Utils.confirm('Wylogować się? Dane konta zostaną w chmurze.')) return;
      await AuthApp.logout();
    });
  },

  showEditModal() {
    const user = Storage.getUser();
    Utils.showModal(`
      <div class="modal-header">
        <div class="modal-title">Edytuj profil</div>
        <button class="modal-close" onclick="Utils.closeModal()">×</button>
      </div>
      <div class="form-group"><label>Pseudonim</label><input class="form-input" id="edit-username" value="${user.username || ''}"></div>
      <div class="form-group"><label>Wiek</label><input class="form-input" type="number" id="edit-age" value="${user.age || ''}"></div>
      <div class="form-group"><label>Wzrost (cm)</label><input class="form-input" type="number" id="edit-height" value="${user.height || ''}"></div>
      <div class="form-group"><label>Masa (kg)</label><input class="form-input" type="number" step="0.1" id="edit-weight" value="${user.weight || ''}"></div>
      <div class="form-group"><label>Cel</label>
        <select class="form-select" id="edit-goal">${GOALS.map(g => `<option value="${g.id}" ${user.goal===g.id?'selected':''}>${g.name}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label>Poziom</label>
        <select class="form-select" id="edit-level">${LEVELS.map(l => `<option value="${l.id}" ${user.level===l.id?'selected':''}>${l.name}</option>`).join('')}</select>
      </div>
      <button class="btn btn-primary btn-block mt-16" id="save-profile">Zapisz</button>
    `);
    document.getElementById('save-profile').addEventListener('click', () => {
      user.username = document.getElementById('edit-username').value.trim() || user.username;
      user.age = Number(document.getElementById('edit-age').value) || user.age;
      user.height = Number(document.getElementById('edit-height').value) || user.height;
      const newW = Number(document.getElementById('edit-weight').value);
      if (newW && newW !== user.weight) {
        user.weight = newW;
        Storage.addBodyLog({ date: new Date().toISOString(), weight: newW });
      }
      user.goal = document.getElementById('edit-goal').value;
      user.level = document.getElementById('edit-level').value;
      user.avatar = (user.username || 'U')[0].toUpperCase();
      Storage.saveUser(user);
      Utils.closeModal();
      App.navigate('profile');
      Utils.toast('Profil zaktualizowany');
    });
  }
};
