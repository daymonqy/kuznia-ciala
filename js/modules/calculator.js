const Calculator = {
  render() {
    const sets = Storage.getEquipmentSets();
    const current = sets[0] || { plates: {}, bars: [{ name: 'Olimpijska', weight: 20 }] };
    return `
      <div class="section-title">Kalkulator ciężaru</div>
      <p class="text-sm text-secondary mb-16">Rozkład talerzy i maksymalny ciężar z dostępnego sprzętu.</p>

      <div class="card">
        <div class="form-group">
          <label>Docelowy ciężar (kg)</label>
          <input class="form-input" type="number" id="calc-target" step="0.5" min="0" placeholder="np. 87.5" value="87.5">
        </div>
        <div class="form-group">
          <label>Sztanga</label>
          <select class="form-select" id="calc-bar">
            ${(current.bars || [{ name: 'Olimpijska', weight: 20 }]).map(b =>
              `<option value="${b.weight}">${b.name} (${b.weight} kg)</option>`
            ).join('')}
            <option value="0">Bez sztangi / hantle</option>
          </select>
        </div>
        <button class="btn btn-primary btn-block" id="btn-calc">Oblicz rozkład</button>
        <div id="calc-result"></div>
      </div>

      <div class="card mt-16">
        <div class="card-title">Maksymalny ciężar</div>
        <div class="text-sm text-secondary mb-12">Na podstawie zdefiniowanych talerzy</div>
        <div class="stat-value" id="max-weight">${Utils.maxWeight(20, current.plates || {})} kg</div>
      </div>

      <div class="card mt-16">
        <div class="card-title">Dostępne talerze (zestaw: ${current.name || 'Dom'})</div>
        <div class="calc-plates">
          ${Object.entries(current.plates || {}).map(([p, c]) =>
            `<div class="plate">${p} kg × ${c}</div>`
          ).join('') || '<span class="text-muted">Brak</span>'}
        </div>
        <button class="btn btn-secondary btn-block mt-16" id="btn-edit-plates">Edytuj sprzęt</button>
      </div>

      <div class="card mt-16">
        <div class="card-title">Szacowane 1RM</div>
        <div class="flex gap-8">
          <div class="form-group" style="flex:1"><label>Ciężar</label><input class="form-input" type="number" id="e1rm-w" step="0.5" placeholder="kg"></div>
          <div class="form-group" style="flex:1"><label>Powtórzenia</label><input class="form-input" type="number" id="e1rm-r" placeholder="powt"></div>
        </div>
        <button class="btn btn-secondary btn-block" id="btn-e1rm">Oblicz 1RM</button>
        <div id="e1rm-result" class="text-center mt-12 font-bold" style="font-size:24px"></div>
        <p class="text-xs text-muted text-center mt-8">Estymacja (wzór Epleya). Nie jest dokładnym pomiarem siły.</p>
      </div>
    `;
  },

  bind() {
    document.getElementById('btn-calc')?.addEventListener('click', () => {
      const target = Number(document.getElementById('calc-target').value);
      const bar = Number(document.getElementById('calc-bar').value);
      const sets = Storage.getEquipmentSets();
      const plates = sets[0]?.plates || {};
      const result = Utils.calculatePlates(target, bar, plates);
      const el = document.getElementById('calc-result');
      if (result.error) {
        el.innerHTML = `<div class="calc-result text-secondary">${result.error}</div>`;
        return;
      }
      el.innerHTML = `
        <div class="calc-result">
          <div class="text-sm text-muted mb-8">Na każdą stronę:</div>
          <div class="calc-plates">
            ${result.plates.length ? result.plates.map(p => `<div class="plate">${p} kg</div>`).join('') : '<span>brak talerzy</span>'}
          </div>
          ${!result.exact ? `<p class="text-sm mt-12" style="color:var(--warning)">Pozostało ${result.remaining} kg — brak dokładnego rozkładu</p>` : '<p class="text-sm mt-12" style="color:var(--accent)">Dokładny rozkład ✓</p>'}
        </div>
      `;
    });

    document.getElementById('btn-e1rm')?.addEventListener('click', () => {
      const w = Number(document.getElementById('e1rm-w').value);
      const r = Number(document.getElementById('e1rm-r').value);
      if (!w || !r) return;
      const e1rm = Utils.estimate1RM(w, r);
      document.getElementById('e1rm-result').textContent = `≈ ${e1rm} kg`;
    });

    document.getElementById('btn-edit-plates')?.addEventListener('click', () => {
      Utils.toast('Edycja sprzętu — w pełnej wersji dostępna w ustawieniach lokalizacji');
    });
  }
};
