// Progress state for the ledger: what is earned, which filter and view are active, whether the
// spoiler guard is on, and the trophy whose guide is open. Everything survives a reload through
// localStorage; the exported file is the same shape minus the view preferences.

const STORAGE_KEY = 'leonida-ledger/progress/v1';

const listeners = new Set();

export const state = {
  earned: new Set(),
  spoiler: true,
  kind: 'all',
  query: '',
  selected: null,
  view: 'tracker',
};

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Restore the saved ledger. Ids are stored as numbers; anything unparsable is dropped. */
export function hydrate(trophies) {
  const known = new Set(trophies.map((t) => t.id));
  const saved = readStored();
  if (saved) {
    const ids = Array.isArray(saved.earned) ? saved.earned : [];
    for (const id of ids) {
      const n = Number(id);
      if (Number.isFinite(n) && known.has(n)) state.earned.add(n);
    }
    if (typeof saved.spoiler === 'boolean') state.spoiler = saved.spoiler;
  }
  const params = new URLSearchParams(location.search);
  const wanted = Number(params.get('id'));
  state.selected = known.has(wanted) ? wanted : firstUnearned(trophies);
  if (params.get('demo') === '1') applyDemo(trophies);
}

function firstUnearned(trophies) {
  const pick = trophies.find((t) => !state.earned.has(t.id));
  return (pick ?? trophies[0]).id;
}

/** A fixed sample of finished work, so a screenshot shows real progress instead of an empty ledger. */
function applyDemo(trophies) {
  const demo = [2, 3, 8, 20, 21, 35, 42, 44, 47, 51, 53];
  for (const id of demo) if (trophies.some((t) => t.id === id)) state.earned.add(id);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(reason = 'change') {
  for (const fn of listeners) fn(reason, state);
}

export function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, earned: [...state.earned].sort((a, b) => a - b), spoiler: state.spoiler }),
    );
  } catch {
    // A browser with storage disabled still gets a working session; the export file is the backup.
  }
}

export function isEarned(id) {
  return state.earned.has(id);
}

export function setEarned(id, on) {
  if (on) state.earned.add(id);
  else state.earned.delete(id);
  persist();
  notify('earned');
}

export function toggleEarned(id) {
  setEarned(id, !state.earned.has(id));
}

export function replaceEarned(ids) {
  state.earned = new Set(ids);
  persist();
  notify('import');
}

export function setKind(kind) {
  state.kind = kind;
  notify('filter');
}

export function setQuery(query) {
  state.query = query;
  notify('filter');
}

export function setSpoiler(on) {
  state.spoiler = on;
  persist();
  notify('spoiler');
}

export function setSelected(id) {
  state.selected = id;
  notify('select');
}

export function setView(view) {
  state.view = view;
  notify('view');
}
