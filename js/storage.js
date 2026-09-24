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

  _uid: null,
  _syncTimer: null,

  setAuthUid(uid) {
    this._uid = uid || null;
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
    this.scheduleCloudSync();
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  scheduleCloudSync() {
    if (!this._uid || typeof firebase === 'undefined') return;
    clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => this.syncToCloud(), 800);
  },

  async syncToCloud() {
    if (!this._uid || typeof firebase === 'undefined') return;
    try {
      const db = firebase.firestore();
      await db.enableNetwork().catch(() => {});
      await db.collection('users').doc(this._uid).set({
        profile: this.getUser(),
        workouts: this.getWorkouts(),
        plans: this.getPlans(),
        customEx: this.getCustomExercises(),
        settings: this.getSettings(),
        bodyLog: this.getBodyLog(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.warn('Cloud sync failed', e);
    }
  },

  async loadFromCloud(uid) {
    if (!uid || typeof firebase === 'undefined') return false;
    try {
      const db = firebase.firestore();
      await db.enableNetwork().catch(() => {});
      let snap;
      try {
        snap = await db.collection('users').doc(uid).get({ source: 'server' });
      } catch {
        snap = await db.collection('users').doc(uid).get();
      }
      if (!snap.exists) return false;
      const d = snap.data() || {};
      if (d.profile) this.set(this.KEYS.USER, d.profile);
      if (Array.isArray(d.workouts)) this.set(this.KEYS.WORKOUTS, d.workouts);
      if (Array.isArray(d.plans)) this.set(this.KEYS.PLANS, d.plans);
      if (Array.isArray(d.customEx)) this.set(this.KEYS.CUSTOM_EX, d.customEx);
      if (d.settings) this.set(this.KEYS.SETTINGS, d.settings);
      if (Array.isArray(d.bodyLog)) this.set(this.KEYS.BODY_LOG, d.bodyLog);
      return true;
    } catch (e) {
      console.warn('Load from cloud failed', e);
      return false;
    }
  },

  clearLocalUserData() {
    Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
  },

  getUser() { return this.get(this.KEYS.USER, null); },
  saveUser(user) { this.set(this.KEYS.USER, user); },
  getWorkouts() {
    const v = this.get(this.KEYS.WORKOUTS, []);
    return Array.isArray(v) ? v : [];
  },
  saveWorkouts(workouts) { this.set(this.KEYS.WORKOUTS, workouts); },
  addWorkout(workout) {
    const list = this.getWorkouts();
    list.unshift(workout);
    this.saveWorkouts(list);
    return workout;
  },
  getPlans() {
    const v = this.get(this.KEYS.PLANS, []);
    return Array.isArray(v) ? v : [];
  },
  savePlans(plans) { this.set(this.KEYS.PLANS, plans); },
  getCustomExercises() {
    const v = this.get(this.KEYS.CUSTOM_EX, []);
    return Array.isArray(v) ? v : [];
  },
  saveCustomExercises(list) { this.set(this.KEYS.CUSTOM_EX, list); },
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
  saveSettings(s) { this.set(this.KEYS.SETTINGS, s); },
  getBodyLog() {
    const v = this.get(this.KEYS.BODY_LOG, []);
    return Array.isArray(v) ? v : [];
  },
  addBodyLog(entry) {
    const list = this.getBodyLog();
    list.unshift(entry);
    this.set(this.KEYS.BODY_LOG, list);
  },
  isOnboarded() { return true; },
  setOnboarded() { this.set(this.KEYS.ONBOARDED, true); },
  getGoals() {
    const v = this.get(this.KEYS.GOALS, []);
    return Array.isArray(v) ? v : [];
  },
  saveGoals(g) { this.set(this.KEYS.GOALS, g); },
  getEquipmentSets() {
    const def = [{
      name: 'Dom',
      plates: { 25: 2, 20: 2, 15: 2, 10: 2, 5: 2, 2.5: 2, 1.25: 2 },
      bars: [{ name: 'Olimpijska', weight: 20 }]
    }];
    const v = this.get(this.KEYS.EQUIPMENT_SETS, def);
    return Array.isArray(v) ? v : def;
  },
  saveEquipmentSets(s) { this.set(this.KEYS.EQUIPMENT_SETS, s); },
  getExerciseHistory(exerciseId) {
    const workouts = this.getWorkouts();
    const history = [];
    workouts.forEach(w => {
      (w.exercises || []).forEach(ex => {
        if (ex.exerciseId === exerciseId && ex.sets?.length) {
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
          if (s.type === 'warmup' || !s.weight) return;
          const id = ex.exerciseId;
          if (!prs[id]) prs[id] = { name: ex.name, maxWeight: 0, maxReps: 0, maxTonnage: 0, bestE1RM: 0 };
          const tonnage = s.weight * (s.reps || 0);
          const e1rm = typeof Utils !== 'undefined' ? Utils.estimate1RM(s.weight, s.reps || 1) : s.weight;
          if (s.weight > prs[id].maxWeight) prs[id].maxWeight = s.weight;
          if ((s.reps || 0) > prs[id].maxReps) prs[id].maxReps = s.reps;
          if (tonnage > prs[id].maxTonnage) prs[id].maxTonnage = tonnage;
          if (e1rm > prs[id].bestE1RM) prs[id].bestE1RM = e1rm;
        });
      });
    });
    return prs;
  },
  getTotalStats() {
    const workouts = this.getWorkouts();
    let sets = 0, tonnage = 0, duration = 0, rirSum = 0, rirN = 0, rpeSum = 0, rpeN = 0;
    workouts.forEach(w => {
      duration += w.duration || 0;
      tonnage += w.tonnage || 0;
      (w.exercises || []).forEach(ex => {
        (ex.sets || []).forEach(s => {
          if (s.type === 'warmup') return;
          sets++;
          if (s.rir != null) { rirSum += s.rir; rirN++; }
          if (s.rpe != null) { rpeSum += s.rpe; rpeN++; }
        });
      });
    });
    return {
      workouts: workouts.length,
      sets,
      tonnage: Math.round(tonnage),
      duration,
      avgRir: rirN ? Math.round((rirSum / rirN) * 10) / 10 : null,
      avgRpe: rpeN ? Math.round((rpeSum / rpeN) * 10) / 10 : null
    };
  }
};
