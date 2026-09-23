/** Hierarchia partii mięśniowych — wybór węzła obejmuje wszystkie potomki. */
const MUSCLE_TREE = [
  { id: 'klatka', name: 'Klatka piersiowa', children: [
    { id: 'klatka-wiekszy', name: 'Mięsień piersiowy większy', children: [
      { id: 'klatka-obojczykowa', name: 'Część obojczykowa' },
      { id: 'klatka-mostkowo-zebrowa', name: 'Część mostkowo-żebrowa' },
      { id: 'klatka-brzuszna', name: 'Część brzuszna' }
    ]},
    { id: 'klatka-mniejszy', name: 'Mięsień piersiowy mniejszy' },
    { id: 'zebaty-przedni', name: 'Mięsień zębaty przedni' }
  ]},
  { id: 'plecy', name: 'Plecy', children: [
    { id: 'najszerszy', name: 'Mięsień najszerszy grzbietu' },
    { id: 'obly-wiekszy', name: 'Mięsień obły większy' },
    { id: 'obly-mniejszy', name: 'Mięsień obły mniejszy' },
    { id: 'nadgrzebieniowy', name: 'Mięsień nadgrzebieniowy' },
    { id: 'podgrzebieniowy', name: 'Mięsień podgrzebieniowy' },
    { id: 'podlopatowy', name: 'Mięsień podłopatkowy' },
    { id: 'rownolegloboczny-wiekszy', name: 'Mięsień równoległoboczny większy' },
    { id: 'rownolegloboczny-mniejszy', name: 'Mięsień równoległoboczny mniejszy' },
    { id: 'dzwigacz-lopatki', name: 'Mięsień dźwigacz łopatki' },
    { id: 'czworoboczny', name: 'Mięsień czworoboczny', children: [
      { id: 'czworoboczny-gorny', name: 'Część górna' },
      { id: 'czworoboczny-srodkowy', name: 'Część środkowa' },
      { id: 'czworoboczny-dolny', name: 'Część dolna' }
    ]},
    { id: 'prostownik-grzbietu', name: 'Prostownik grzbietu', children: [
      { id: 'biodrowo-zebrowy', name: 'Mięsień biodrowo-żebrowy' },
      { id: 'najdluzszy', name: 'Mięsień najdłuższy' },
      { id: 'kolcowy', name: 'Mięsień kolcowy' }
    ]},
    { id: 'wieldzielny', name: 'Mięsień wielodzielny' },
    { id: 'rotatory', name: 'Rotatory' },
    { id: 'czworoboczny-ledzwi', name: 'Mięsień czworoboczny lędźwi' }
  ]},
  { id: 'barki', name: 'Barki', children: [
    { id: 'naramienny', name: 'Mięsień naramienny', children: [
      { id: 'naramienny-przedni', name: 'Akton przedni' },
      { id: 'naramienny-boczny', name: 'Akton boczny' },
      { id: 'naramienny-tylny', name: 'Akton tylny' }
    ]},
    { id: 'barki-nadgrzebieniowy', name: 'Mięsień nadgrzebieniowy' },
    { id: 'barki-podgrzebieniowy', name: 'Mięsień podgrzebieniowy' },
    { id: 'barki-obly-mniejszy', name: 'Mięsień obły mniejszy' },
    { id: 'barki-podlopatowy', name: 'Mięsień podłopatkowy' }
  ]},
  { id: 'biceps', name: 'Biceps i przód ramienia', children: [
    { id: 'dwuglowy-ramienia', name: 'Mięsień dwugłowy ramienia', children: [
      { id: 'biceps-glowa-dluga', name: 'Głowa długa' },
      { id: 'biceps-glowa-krotka', name: 'Głowa krótka' }
    ]},
    { id: 'ramienny', name: 'Mięsień ramienny' },
    { id: 'kruczo-ramienny', name: 'Mięsień kruczo-ramienny' }
  ]},
  { id: 'triceps', name: 'Triceps i tył ramienia', children: [
    { id: 'trojglowy-ramienia', name: 'Mięsień trójgłowy ramienia', children: [
      { id: 'triceps-glowa-dluga', name: 'Głowa długa' },
      { id: 'triceps-glowa-boczna', name: 'Głowa boczna' },
      { id: 'triceps-glowa-prysrodkowa', name: 'Głowa przyśrodkowa' }
    ]},
    { id: 'lokciowy', name: 'Mięsień łokciowy' }
  ]},
  { id: 'przedramiona', name: 'Przedramiona', children: [
    { id: 'zginacze-nadgarstka', name: 'Zginacze nadgarstka i palców' },
    { id: 'prostowniki-nadgarstka', name: 'Prostowniki nadgarstka i palców' },
    { id: 'ramienno-promieniowy', name: 'Mięsień ramienno-promieniowy' },
    { id: 'odwracacz', name: 'Odwracacz' },
    { id: 'nawrotny-obly', name: 'Nawrotny obły' },
    { id: 'nawrotny-czworoboczny', name: 'Nawrotny czworoboczny' }
  ]},
  { id: 'brzuch', name: 'Brzuch i core', children: [
    { id: 'prosty-brzucha', name: 'Mięsień prosty brzucha', children: [
      { id: 'brzuch-gorny', name: 'Górna okolica' },
      { id: 'brzuch-srodkowy', name: 'Środkowa okolica' },
      { id: 'brzuch-dolny', name: 'Dolna okolica' }
    ]},
    { id: 'skosny-zewnetrzny', name: 'Mięsień skośny zewnętrzny' },
    { id: 'skosny-wewnetrzny', name: 'Mięsień skośny wewnętrzny' },
    { id: 'poprzeczny-brzucha', name: 'Mięsień poprzeczny brzucha' },
    { id: 'core-czworoboczny-ledzwi', name: 'Czworoboczny lędźwi' },
    { id: 'core-wieldzielny', name: 'Wieldzielny' },
    { id: 'dno-miednicy', name: 'Mięśnie dna miednicy' }
  ]},
  { id: 'posladki', name: 'Pośladki', children: [
    { id: 'posladkowy-wielki', name: 'Mięsień pośladkowy wielki' },
    { id: 'posladkowy-sredni', name: 'Mięsień pośladkowy średni' },
    { id: 'posladkowy-maly', name: 'Mięsień pośladkowy mały' },
    { id: 'napinacz-powiezi', name: 'Napinacz powięzi szerokiej' },
    { id: 'gruszkowaty', name: 'Gruszkowaty' },
    { id: 'zaslaniacz', name: 'Zasłaniacz wewnętrzny i zewnętrzny' },
    { id: 'blizniaczy', name: 'Bliźniaczy górny i dolny' },
    { id: 'czworoboczny-uda', name: 'Czworoboczny uda' }
  ]},
  { id: 'czworoglowe', name: 'Uda – przód', children: [
    { id: 'czworoglowy-uda', name: 'Mięsień czworogłowy uda', children: [
      { id: 'prosty-uda', name: 'Prosty uda' },
      { id: 'obszerny-boczny', name: 'Obszerny boczny' },
      { id: 'obszerny-prysrodkowy', name: 'Obszerny przyśrodkowy' },
      { id: 'obszerny-posredni', name: 'Obszerny pośredni' }
    ]},
    { id: 'krawiecki', name: 'Mięsień krawiecki' }
  ]},
  { id: 'dwuglowe', name: 'Uda – tył', children: [
    { id: 'kulszowo-goleniowe', name: 'Mięśnie kulszowo-goleniowe', children: [
      { id: 'dwuglowy-uda', name: 'Mięsień dwugłowy uda', children: [
        { id: 'ham-glowa-dluga', name: 'Głowa długa' },
        { id: 'ham-glowa-krotka', name: 'Głowa krótka' }
      ]},
      { id: 'polsciegnisty', name: 'Półścięgnisty' },
      { id: 'polbloniasty', name: 'Półbłoniasty' }
    ]}
  ]},
  { id: 'przywodziciele', name: 'Uda – wewnętrzna strona', children: [
    { id: 'przywodziciel-dlugi', name: 'Przywodziciel długi' },
    { id: 'przywodziciel-krotki', name: 'Przywodziciel krótki' },
    { id: 'przywodziciel-wielki', name: 'Przywodziciel wielki' },
    { id: 'smukly', name: 'Mięsień smukły' },
    { id: 'grzebieniowy', name: 'Grzebieniowy' }
  ]},
  { id: 'odwodziciele', name: 'Biodra – odwodziciele', children: [
    { id: 'odw-posladkowy-sredni', name: 'Pośladkowy średni' },
    { id: 'odw-posladkowy-maly', name: 'Pośladkowy mały' },
    { id: 'odw-napinacz', name: 'Napinacz powięzi szerokiej' }
  ]},
  { id: 'zginacze-biodra', name: 'Zginacze biodra', children: [
    { id: 'biodrowo-ledzwiowy', name: 'Mięsień biodrowo-lędźwiowy', children: [
      { id: 'ledzwiowy-wiekszy', name: 'Lędźwiowy większy' },
      { id: 'biodrowy', name: 'Biodrowy' }
    ]},
    { id: 'zgin-prosty-uda', name: 'Prosty uda' },
    { id: 'zgin-krawiecki', name: 'Krawiecki' },
    { id: 'zgin-napinacz', name: 'Napinacz powięzi szerokiej' }
  ]},
  { id: 'lydki', name: 'Łydki', children: [
    { id: 'brzuchaty-lydki', name: 'Mięsień brzuchaty łydki', children: [
      { id: 'lydka-prysrodkowa', name: 'Głowa przyśrodkowa' },
      { id: 'lydka-boczna', name: 'Głowa boczna' }
    ]},
    { id: 'plaszczkowaty', name: 'Mięsień płaszczkowaty' },
    { id: 'podeszwowy', name: 'Podeszwowy' }
  ]},
  { id: 'piszczelowe', name: 'Przód podudzia', children: [
    { id: 'piszczelowy-przedni', name: 'Piszczelowy przedni' },
    { id: 'prostownik-palcow', name: 'Prostownik długi palców' },
    { id: 'prostownik-palucha', name: 'Prostownik długi palucha' },
    { id: 'strzalkowy-trzeci', name: 'Strzałkowy trzeci' }
  ]},
  { id: 'podudzie-boczne', name: 'Boczna część podudzia', children: [
    { id: 'strzalkowy-dlugi', name: 'Strzałkowy długi' },
    { id: 'strzalkowy-krotki', name: 'Strzałkowy krótki' }
  ]},
  { id: 'podudzie-tylne', name: 'Głęboka tylna część podudzia', children: [
    { id: 'piszczelowy-tylny', name: 'Piszczelowy tylny' },
    { id: 'zginacz-palcow', name: 'Zginacz długi palców' },
    { id: 'zginacz-palucha', name: 'Zginacz długi palucha' },
    { id: 'podkolanowy', name: 'Podkolanowy' }
  ]},
  { id: 'szyja', name: 'Szyja', children: [
    { id: 'mostkowo-obojczykowo-sutkowy', name: 'Mostkowo-obojczykowo-sutkowy' },
    { id: 'platowaty-glowy', name: 'Płatowaty głowy' },
    { id: 'platowaty-szyi', name: 'Płatowaty szyi' },
    { id: 'pochyle', name: 'Mięśnie pochyłe', children: [
      { id: 'pochyly-przedni', name: 'Przedni' },
      { id: 'pochyly-srodkowy', name: 'Środkowy' },
      { id: 'pochyly-tylny', name: 'Tylny' }
    ]},
    { id: 'podpotyliczne', name: 'Mięśnie podpotyliczne' },
    { id: 'glebokie-zginacze-szyi', name: 'Głębokie zginacze szyi' }
  ]},
  { id: 'oddechowe', name: 'Klatka boczna i mięśnie oddechowe', children: [
    { id: 'oddech-zebaty', name: 'Zębaty przedni' },
    { id: 'miedzyzebrowe', name: 'Mięśnie międzyżebrowe' },
    { id: 'poprzeczny-klatki', name: 'Poprzeczny klatki piersiowej' },
    { id: 'przepona', name: 'Przepona' }
  ]},
  { id: 'dlonie', name: 'Mięśnie dłoni', children: [
    { id: 'kleb-kciuka', name: 'Kłąb kciuka' },
    { id: 'klebik', name: 'Kłębik palca małego' },
    { id: 'glistowate-dloni', name: 'Glistowate' },
    { id: 'miedzykostne-dloni', name: 'Międzykostne dłoniowe i grzbietowe' }
  ]},
  { id: 'stopy', name: 'Mięśnie stóp', children: [
    { id: 'krotkie-palucha', name: 'Krótkie palucha' },
    { id: 'krotkie-palca-malego', name: 'Krótkie palca małego' },
    { id: 'glistowate-stop', name: 'Glistowate' },
    { id: 'miedzykostne-stop', name: 'Międzykostne' },
    { id: 'zginacz-krotki-palcow', name: 'Zginacz krótki palców' },
    { id: 'czworoboczny-podeszwy', name: 'Czworoboczny podeszwy' }
  ]},
  { id: 'wielostawowe', name: 'Ćwiczenia wielostawowe i pozostałe', children: [
    { id: 'cale-cialo', name: 'Całe ciało' },
    { id: 'lancuch-przedni', name: 'Łańcuch przedni' },
    { id: 'lancuch-tylny', name: 'Łańcuch tylny' },
    { id: 'stabilizacja-tulowia', name: 'Stabilizacja tułowia' },
    { id: 'stabilizacja-lopatki', name: 'Stabilizacja łopatki' },
    { id: 'stabilizacja-biodra', name: 'Stabilizacja biodra' },
    { id: 'chwyt', name: 'Chwyt' },
    { id: 'miesnie-glebokie', name: 'Mięśnie głębokie' }
  ]}
];

const MUSCLE_LEGACY = {
  kaptury: 'czworoboczny',
  prostowniki: 'prostownik-grzbietu',
  core: 'brzuch',
  inne: 'wielostawowe'
};

const MuscleTree = {
  _byId: null,
  _descCache: {},

  _index() {
    if (this._byId) return this._byId;
    this._byId = {};
    const walk = (nodes, parent) => {
      (nodes || []).forEach(n => {
        this._byId[n.id] = { ...n, parentId: parent ? parent.id : null };
        if (n.children) walk(n.children, n);
      });
    };
    walk(MUSCLE_TREE, null);
    return this._byId;
  },

  normalize(id) {
    if (!id) return id;
    return MUSCLE_LEGACY[id] || id;
  },

  label(id) {
    id = this.normalize(id);
    const n = this._index()[id];
    return n ? n.name : id;
  },

  short(id) {
    id = this.normalize(id);
    const n = this._index()[id];
    if (!n) return id;
    const name = n.name;
    return name.length > 18 ? name.slice(0, 16) + '…' : name;
  },

  descendants(id) {
    id = this.normalize(id);
    if (this._descCache[id]) return this._descCache[id];
    const set = new Set([id]);
    const node = this._index()[id];
    if (!node) {
      this._descCache[id] = set;
      return set;
    }
    const walk = (n) => {
      (n.children || []).forEach(c => {
        set.add(c.id);
        walk(c);
      });
    };
    walk(node);
    this._descCache[id] = set;
    return set;
  },

  matchesFilter(filterId, exerciseTags) {
    if (!filterId || filterId === 'all') return true;
    const scope = this.descendants(filterId);
    return (exerciseTags || []).some(t => scope.has(this.normalize(t)));
  },

  exerciseTags(ex) {
    const tags = [];
    const push = (v) => {
      if (!v) return;
      if (Array.isArray(v)) v.forEach(push);
      else tags.push(this.normalize(v));
    };
    push(ex.musclesMain);
    push(ex.musclesSupport);
    push(ex.musclePrimary);
    push(ex.muscleSecondary);
    push(ex.muscles);
    return [...new Set(tags)];
  },

  roots() { return MUSCLE_TREE; },

  asFlatGroups() {
    return MUSCLE_TREE.map(n => ({
      id: n.id,
      name: n.name,
      short: n.name.length > 12 ? n.name.slice(0, 10) + '…' : n.name
    }));
  },

  renderCheckboxTree(selectedIds, mode) {
    const selected = new Set((selectedIds || []).map(id => this.normalize(id)));
    const walk = (nodes, depth) => nodes.map(n => {
      const hasKids = n.children && n.children.length;
      const checked = selected.has(n.id) ? 'checked' : '';
      const active = selected.has(n.id) ? 'selected' : '';
      return `
        <div class="mt-node" data-depth="${depth}">
          <label class="mt-row ${active}">
            <input type="checkbox" data-muscle="${n.id}" data-mode="${mode}" ${checked}>
            <span class="mt-name">${n.name}</span>
            ${hasKids ? `<button type="button" class="mt-toggle" data-toggle="${n.id}" aria-label="Rozwiń">▸</button>` : ''}
          </label>
          ${hasKids ? `<div class="mt-children" data-parent="${n.id}" hidden>${walk(n.children, depth + 1)}</div>` : ''}
        </div>`;
    }).join('');
    return `<div class="muscle-tree" data-tree-mode="${mode}">${walk(MUSCLE_TREE, 0)}</div>`;
  },

  bindTreeToggles(rootEl) {
    if (!rootEl) return;
    rootEl.querySelectorAll('.mt-toggle').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.toggle;
        const kids = rootEl.querySelector(`.mt-children[data-parent="${id}"]`);
        if (!kids) return;
        const open = kids.hasAttribute('hidden');
        if (open) kids.removeAttribute('hidden');
        else kids.setAttribute('hidden', '');
        btn.textContent = open ? '▾' : '▸';
      });
    });
    rootEl.querySelectorAll('input[data-muscle]').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.mt-row')?.classList.toggle('selected', cb.checked);
      });
    });
  },

  collectChecked(rootEl, mode) {
    if (!rootEl) return [];
    return Array.from(rootEl.querySelectorAll(`input[data-mode="${mode}"]:checked`))
      .map(cb => cb.dataset.muscle);
  }
};

const MUSCLE_GROUPS = MuscleTree.asFlatGroups();
