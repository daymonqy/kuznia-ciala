const Utils = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },

  formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  },

  formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h}h ${m % 60}min`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  },

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  },

  estimate1RM(weight, reps, method = 'epley') {
    if (!weight || !reps || reps < 1) return 0;
    if (reps === 1) return weight;
    if (method === 'epley') return Math.round(weight * (1 + reps / 30) * 10) / 10;
    if (method === 'brzycki') return Math.round(weight * (36 / (37 - reps)) * 10) / 10;
    return Math.round(weight * (1 + reps / 30) * 10) / 10;
  },

  rirToRpe(rir) {
    if (rir == null) return null;
    return Math.min(10, Math.max(1, 10 - rir));
  },

  rpeToRir(rpe) {
    if (rpe == null) return null;
    return Math.max(0, 10 - rpe);
  },

  estimateRecovery(muscleId, workouts) {
    const now = Date.now();
    let lastVolume = 0;
    let lastIntensity = 0;
    let hoursSince = 999;
    let lastRir = 3;

    workouts.forEach(w => {
      const wTime = new Date(w.date).getTime();
      const hours = (now - wTime) / 3600000;
      (w.exercises || []).forEach(ex => {
        const primary = ex.musclePrimary === muscleId;
        const secondary = (ex.muscleSecondary || []).includes(muscleId);
        if (!primary && !secondary) return;
        const factor = primary ? 1 : 0.5;
        (ex.sets || []).forEach(s => {
          if (s.type === 'warmup') return;
          const vol = (s.weight || 0) * (s.reps || 0) * factor;
          if (hours < hoursSince + 48) {
            lastVolume += vol;
            if (s.rir != null) lastRir = Math.min(lastRir, s.rir);
            if (s.rpe != null) lastIntensity = Math.max(lastIntensity, s.rpe);
          }
          if (hours < hoursSince) hoursSince = hours;
        });
      });
    });

    let recovery = Math.min(100, (hoursSince / 72) * 100);
    if (lastVolume > 5000) recovery -= 15;
    else if (lastVolume > 2000) recovery -= 8;
    if (lastRir <= 1) recovery -= 12;
    else if (lastRir <= 2) recovery -= 6;
    if (lastIntensity >= 9) recovery -= 10;

    return Math.max(5, Math.min(100, Math.round(recovery)));
  },

  getMuscleVolume(muscleId, workouts, days = 7) {
    const cutoff = Date.now() - days * 86400000;
    let direct = 0, indirect = 0, tonnage = 0;
    workouts.forEach(w => {
      if (new Date(w.date).getTime() < cutoff) return;
      (w.exercises || []).forEach(ex => {
        const primary = ex.musclePrimary === muscleId;
        const secondary = (ex.muscleSecondary || []).includes(muscleId);
        if (!primary && !secondary) return;
        (ex.sets || []).forEach(s => {
          if (s.type === 'warmup') return;
          if (primary) direct++;
          else indirect++;
          tonnage += (s.weight || 0) * (s.reps || 0) * (primary ? 1 : 0.5);
        });
      });
    });
    return { direct, indirect, total: direct + indirect, tonnage: Math.round(tonnage) };
  },

  suggestWeight(history, targetRir = 2) {
    if (!history || history.length === 0) return null;
    const last = history[0];
    if (!last.sets || last.sets.length === 0) return null;
    const working = last.sets.filter(s => s.type !== 'warmup' && s.weight);
    if (working.length === 0) return null;
    const best = working.reduce((a, b) => (a.weight * a.reps > b.weight * b.reps ? a : b));
    const rir = best.rir != null ? best.rir : 2;
    let suggested = best.weight;
    if (rir >= 3 && best.reps >= 8) suggested = Math.round((best.weight + 2.5) * 2) / 2;
    else if (rir <= 1) suggested = best.weight;
    else if (rir >= 2 && best.reps >= 10) suggested = Math.round((best.weight + 2.5) * 2) / 2;
    return { weight: suggested, basedOn: `${best.weight}kg × ${best.reps} @ RIR ${rir}` };
  },

  calculatePlates(targetWeight, barWeight, availablePlates) {
    const sideWeight = (targetWeight - barWeight) / 2;
    if (sideWeight < 0) return { error: 'Ciężar mniejszy niż sztanga' };
    const plates = Object.keys(availablePlates).map(Number).sort((a, b) => b - a);
    const result = [];
    let remaining = sideWeight;
    for (const p of plates) {
      const maxCount = availablePlates[p] || 0;
      let count = 0;
      while (remaining >= p - 0.01 && count < maxCount) {
        remaining -= p;
        count++;
        result.push(p);
      }
    }
    if (remaining > 0.1) {
      return { plates: result, remaining: Math.round(remaining * 10) / 10, exact: false };
    }
    return { plates: result, remaining: 0, exact: true, perSide: result };
  },

  maxWeight(barWeight, availablePlates) {
    let total = barWeight;
    Object.entries(availablePlates).forEach(([p, count]) => {
      const pairs = Math.floor(count / 2);
      total += Number(p) * pairs * 2;
    });
    return total;
  },

  toast(msg, type = '') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast show ' + type;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2800);
  },

  showModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    if (!overlay || !content) return;
    content.innerHTML = html;
    overlay.classList.add('active');
    content.onclick = (e) => e.stopPropagation();
  },

  closeModal() {
    document.getElementById('modal-overlay')?.classList.remove('active');
  },

  confirm(msg) {
    return window.confirm(msg);
  },

  getExerciseById(id) {
    if (!id) return null;
    const custom = Storage.getCustomExercises();
    const db = (typeof EXERCISE_DB !== 'undefined' && Array.isArray(EXERCISE_DB)) ? EXERCISE_DB : [];
    const found = (Array.isArray(custom) ? custom : []).find(e => e && e.id === id)
      || db.find(e => e && e.id === id);
    return found || null;
  },

  allExercises() {
    const db = (typeof EXERCISE_DB !== 'undefined' && Array.isArray(EXERCISE_DB)) ? EXERCISE_DB : [];
    const custom = Storage.getCustomExercises();
    const extra = Array.isArray(custom) ? custom.filter(e => e && e.id && e.name) : [];
    return db.concat(extra);
  },

  muscleName(id) {
    if (typeof MuscleTree !== 'undefined') return MuscleTree.label(id);
    const m = (typeof MUSCLE_GROUPS !== 'undefined' ? MUSCLE_GROUPS : []).find(x => x.id === id);
    return m ? m.name : id;
  },

  muscleShort(id) {
    if (typeof MuscleTree !== 'undefined') return MuscleTree.short(id);
    const m = (typeof MUSCLE_GROUPS !== 'undefined' ? MUSCLE_GROUPS : []).find(x => x.id === id);
    return m ? m.short : id;
  },

  recoveryColor(pct) {
    if (pct >= 85) return '#22c55e';
    if (pct >= 60) return '#84cc16';
    if (pct >= 40) return '#f59e0b';
    return '#ef4444';
  }
};
