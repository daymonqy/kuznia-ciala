const Storage = {
  KEYS: {
    USER: 'ff_user',
    WORKOUTS: 'ff_workouts',
    PLANS: 'ff_plans',
    CUSTOM_EX: 'ff_custom_ex',
    SETTINGS: 'ff_settings',
    BODY_LOG: 'ff_body_log',
    GOALS: 'ff_goals',
    EQUIPMENT_SETS: 'ff_equip_sets',
    RECOVERY: 'ff_recovery',
    ONBOARDED: 'ff_onboarded'
  },

  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  getUser() {
    return this.get(this.KEYS.USER, null);
  },

  saveUser(user) {
    this.set(this.KEYS.USER, user);
  },

  getWorkouts() {
    return this.get(this.KEYS.WORKOUTS, []);
  },

  saveWorkouts(workouts) {
    this.set(this.KEYS.WORKOUTS, workouts);
  },

  addWorkout(workout) {
    const list = this.getWorkouts();
    list.unshift(workout);
    this.saveWorkouts(list);
    return workout;
  },

  getPlans() {
    return this.get(this.KEYS.PLANS, []);
  },

  savePlans(plans) {
    this.set(this.KEYS.PLANS, plans);
  },

  getCustomExercises() {
    return this.get(this.KEYS.CUSTOM_EX, []);
  },

  saveCustomExercises(list) {
    this.set(this.KEYS.CUSTOM_EX, list);
  },

  getSettings() {
    return this.get(this.KEYS.SETTINGS, {
      mode: 'advanced',
      restDefault: 90,
      units: 'kg',
      ripScale: { 1: 'Bardzo lekka', 2: 'Lekka', 3: 'Srednia', 4: 'Ciezkie', 5: 'Maksymalny wysilek' },
      notifications: false,
      progression: 'double'
    });
  },

  saveSettings(s) {
    this.set(this.KEYS.SETTINGS, s);
  },

  getBodyLog() {
    return this.get(this.KEYS.BODY_LOG, []);
  },

  addBodyLog(entry) {
    const list = this.getBodyLog();
    list.unshift(entry);
    this.set(this.KEYS.BODY_LOG, list);
  },

  getGoals() {
    return this.get(this.KEYS.GOALS, []);
  },

  saveGoals(g) {
    this.set(this.KEYS.GOALS, g);
  },

  getEquipmentSets() {
    return this.get(this.KEYS.EQUIPMENT_SETS, [
      {
        id: 'home',
        name: 'Dom',
        equipment: ['hantle', 'sztanga', 'lawka', 'masa ciala', 'gumy'],
        plates: { 0.5: 4, 1.25: 4, 2.5: 4, 5: 4, 10: 2, 15: 2, 20: 2 },
        bars: [{ name: 'Olimpijska', weight: 20 }]
      },
      {
        id: 'gym',
        name: 'Silownia',
        equipment: ['sztanga', 'hantle', 'maszyny', 'wyciag', 'lawka', 'stojaki', 'drazek', 'kettlebell'],
        plates: { 0.5: 4, 1.25: 4, 2.5: 6, 5: 6, 10: 4, 15: 4, 20: 4, 25: 2 },
        bars: [{ name: 'Olimpijska', weight: 20 }, { name: 'Lamana', weight: 8 }]
      }
    ]);
  },

  saveEquipmentSets(sets) {
    this.set(this.KEYS.EQUIPMENT_SETS, sets);
  },

  isOnboarded() {
    return !!this.get(this.KEYS.ONBOARDED, false);
  },

  setOnboarded() {
    this.set(this.KEYS.ONBOARDED, true);
  },

  getExerciseHistory(exerciseId) {
    const workouts = this.getWorkouts();
    const history = [];
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        if (ex.exerciseId === exerciseId) {
          history.push({ date: w.date, sets: ex.sets, workoutId: w.id });
        }
      });
    });
    return history;
  },

  getPersonalRecords() {
    const workouts = this.getWorkouts();
    const prs = {};
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => {
          if (s.type === 'warmup' || !s.weight || !s.reps) return;
          const key = ex.exerciseId;
          if (!prs[key]) prs[key] = { maxWeight: 0, maxReps: 0, maxTonnage: 0, bestE1RM: 0, name: ex.name };
          if (s.weight > prs[key].maxWeight) prs[key].maxWeight = s.weight;
          if (s.reps > prs[key].maxReps) prs[key].maxReps = s.reps;
          const ton = s.weight * s.reps;
          if (ton > prs[key].maxTonnage) prs[key].maxTonnage = ton;
          const e1rm = Utils.estimate1RM(s.weight, s.reps);
          if (e1rm > prs[key].bestE1RM) prs[key].bestE1RM = e1rm;
        });
      });
    });
    return prs;
  },

  getTotalStats() {
    const workouts = this.getWorkouts();
    let totalSets = 0, totalReps = 0, totalTonnage = 0, totalDuration = 0;
    let rirSum = 0, rirCount = 0, rpeSum = 0, rpeCount = 0;
    workouts.forEach(w => {
      totalDuration += w.duration || 0;
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => {
          if (s.type === 'warmup') return;
          totalSets++;
          totalReps += s.reps || 0;
          totalTonnage += (s.weight || 0) * (s.reps || 0);
          if (s.rir != null) { rirSum += s.rir; rirCount++; }
          if (s.rpe != null) { rpeSum += s.rpe; rpeCount++; }
        });
      });
    });
    return {
      workouts: workouts.length,
      sets: totalSets,
      reps: totalReps,
      tonnage: Math.round(totalTonnage),
      duration: totalDuration,
      avgRir: rirCount ? +(rirSum / rirCount).toFixed(1) : null,
      avgRpe: rpeCount ? +(rpeSum / rpeCount).toFixed(1) : null
    };
  }
};
