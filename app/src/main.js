// Boot and wiring. Loads the trophy data, restores the saved ledger, renders the toolbar, the
// list, the detail pane and the roadmap, and applies the ?shot / ?demo query used for screenshots.

import {
  state,
  hydrate,
  subscribe,
  notify,
  persist,
  setEarned,
  toggleEarned,
  setKind,
  setQuery,
  setSpoiler,
  setSelected,
  setView,
  isEarned,
} from './store.js';
import { renderList } from './list.js';
import { renderDetail } from './detail.js';
import {
  FILTERS,
  KIND_LABELS,
  STAGES,
  CHECKLIST,
  kindCounts,
  stageSummaries,
  missableList,
  totals,
} from './roadmap.js';
import { isMasked, shieldedCount } from './spoiler.js';
import { downloadProgress, importProgressFile } from './io.js';

const els = {
  filters: document.getElementById('filters'),
  search: document.getElementById('search'),
  spoiler: document.getElementById('spoiler-toggle'),
  spoilerState: document.getElementById('spoiler-state'),
  export: document.getElementById('export'),
  import: document.getElementById('import'),
  groups: document.getElementById('groups'),
  detail: document.getElementById('detail'),
  roadmap: document.getElementById('roadmap'),
  viewTracker: document.getElementById('view-tracker'),
  viewRoadmap: document.getElementById('view-roadmap'),
  ring: document.getElementById('ring'),
  fraction: document.getElementById('progress-fraction'),
  pct: document.getElementById('progress-pct'),
  caption: document.getElementById('progress-caption'),
  bar: document.getElementById('bar-fill'),
  statusLeft: document.getElementById('status-left'),
  statusRight: document.getElementById('status-right'),
  tabs: [...document.querySelectorAll('.tab')],
};

let trophies = [];
let flashTimer = 0;

function el(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function flash(message, isError = false) {
  els.statusLeft.textContent = message;
  els.statusLeft.classList.toggle('is-error', isError);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => renderStatus(), 4000);
}

function renderFilters() {
  const counts = kindCounts(trophies);
  els.filters.replaceChildren();
  for (const key of FILTERS) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip${state.kind === key ? ' is-active' : ''}`;
    button.dataset.kind = key;
    button.setAttribute('aria-pressed', String(state.kind === key));
    if (key === 'missable') button.classList.add('chip-missable');
    button.append(el('span', 'chip-label', key === 'all' ? 'All' : KIND_LABELS[key]));
    button.append(el('span', 'chip-count', String(counts[key])));
    button.addEventListener('click', () => {
      setKind(key);
      if (state.view !== 'tracker') setView('tracker');
    });
    els.filters.append(button);
  }
}

function renderHeader() {
  const t = totals(trophies, state.earned);
  els.fraction.textContent = `${t.earned} / ${t.total}`;
  els.pct.textContent = `${t.pct}%`;
  els.bar.style.width = `${t.pct}%`;

  const shielded = shieldedCount(trophies, state.earned);
  const missed = t.missable;
  const gradeLine = [
    `${t.byGrade.platinum} platinum`,
    `${t.byGrade.gold} gold`,
    `${t.byGrade.silver} silver`,
    `${t.byGrade.bronze} bronze`,
  ].join(' · ');
  els.caption.textContent = shielded
    ? `${shielded} story trophies shielded · ${gradeLine}`
    : `${missed} missable · ${gradeLine}`;

  const ring = `conic-gradient(var(--gold) ${t.pct * 3.6}deg, rgba(255,255,255,0.07) 0deg)`;
  els.ring.style.background = ring;
  els.ring.dataset.pct = String(t.pct);

  els.spoilerState.textContent = state.spoiler ? 'on' : 'off';
  els.spoiler.classList.toggle('is-off', !state.spoiler);
  els.spoiler.setAttribute('aria-pressed', String(state.spoiler));
  els.spoiler.title = state.spoiler
    ? `Spoiler guard on: ${shielded} story trophies hidden until earned`
    : 'Spoiler guard off: story trophy names are visible';
}

function renderStatus() {
  const t = totals(trophies, state.earned);
  const shielded = shieldedCount(trophies, state.earned);
  const shown = Number(els.groups.dataset.shown ?? t.total);
  const parts = [`${t.earned} of ${t.total} earned`];
  if (state.kind !== 'all' || state.query) parts.push(`${shown} shown under this filter`);
  if (state.spoiler) parts.push(`${shielded} shielded`);
  if (!els.viewRoadmap.hidden) parts.push('roadmap view');
  els.statusLeft.classList.remove('is-error');
  els.statusLeft.textContent = parts.join(' · ');
}

function buildChecklist() {
  const wrap = el('section', 'panel checklist-panel');
  const head = el('div', 'panel-head');
  head.append(el('h2', 'panel-title', 'The 100% checklist'));
  head.append(el('span', 'panel-note', 'Progress › Stats › 100% Completion'));
  wrap.append(head);
  wrap.append(
    el(
      'p',
      'panel-lede',
      'The checklist appears only after the credits, but work done during the story already counts, so this is a to-do list and not a fresh start. A line whose two numbers match needs every one of its items; every other line only needs the number shown.',
    ),
  );

  const grid = el('div', 'checklist-grid');
  for (const row of CHECKLIST) {
    // Whether this line needs every one of its items is a fact about the numbers, so derive it
    // instead of hand-typing a scope that can disagree with the target it sits beside.
    const full = row.target >= row.total;
    const item = el('div', `checklist-item ${full ? 'is-full' : 'is-part'}`);
    item.append(el('span', 'checklist-label', row.label));
    const track = el('div', 'checklist-track');
    const fill = el('i');
    fill.style.width = `${Math.round((row.target / row.total) * 100)}%`;
    track.append(fill);
    item.append(track);
    item.append(el('span', 'checklist-target', `${row.target}/${row.total}`));
    item.title = full ? `${row.label}: needs every one of the ${row.total}` : `${row.label}: ${row.target} of ${row.total} is enough for the checklist`;
    grid.append(item);
  }
  wrap.append(grid);
  return wrap;
}

function buildStageRail() {
  const wrap = el('section', 'panel stages-panel');
  const head = el('div', 'panel-head');
  head.append(el('h2', 'panel-title', 'The route, in order'));
  head.append(el('span', 'panel-note', 'built from the official descriptions'));
  wrap.append(head);

  const list = el('ol', 'stage-rail');
  let index = 0;
  for (const stage of stageSummaries(trophies)) {
    index += 1;
    const earnedHere = stage.trophies.filter((t) => isEarned(t.id)).length;
    const li = el('li', `rail-step${earnedHere === stage.total && stage.total ? ' is-complete' : ''}`);
    const dot = el('span', 'rail-dot', String(index));
    li.append(dot);

    const body = el('div', 'rail-body');
    const top = el('div', 'rail-top');
    top.append(el('h3', 'rail-name', stage.name));
    top.append(el('span', 'rail-tally', `${earnedHere}/${stage.total}`));
    body.append(top);
    body.append(el('p', 'rail-note', stage.note));
    if (stage.missable) {
      body.append(el('span', 'rail-flag', stage.missable === 1 ? '1 time limited' : `${stage.missable} time limited`));
    }

    const chips = el('div', 'rail-chips');
    for (const trophy of stage.trophies) {
      const chip = el('span', `rail-chip grade-${trophy.grade}${isEarned(trophy.id) ? ' is-earned' : ''}`);
      const masked = isMasked(trophy, state.earned);
      chip.textContent = masked ? 'Hidden story trophy' : trophy.name;
      chip.title = masked ? 'Hidden by the spoiler guard' : trophy.name;
      chips.append(chip);
    }
    body.append(chips);
    li.append(body);
    list.append(li);
  }
  wrap.append(list);
  return wrap;
}

function buildMissables() {
  const wrap = el('section', 'panel missable-panel');
  const head = el('div', 'panel-head');
  head.append(el('h2', 'panel-title', 'Missable, and why'));
  head.append(el('span', 'panel-note', 'no mission replay, no New Game Plus'));
  wrap.append(head);

  const list = el('ul', 'missable-list');
  const flags = missableList(trophies);
  for (const flag of flags) {
    const li = el('li', 'missable-item');
    li.append(el('span', 'missable-grade', flag.grade));
    const body = el('div', 'missable-body');
    body.append(el('h3', 'missable-name', flag.name));
    body.append(el('p', 'missable-when', flag.stageName));
    body.append(el('p', 'missable-why', flag.note));
    li.append(body);
    const go = document.createElement('button');
    go.type = 'button';
    go.className = 'missable-go';
    go.textContent = 'Open guide';
    go.addEventListener('click', () => {
      setView('tracker');
      setSelected(flag.id);
    });
    li.append(go);
    list.append(li);
  }
  if (!flags.length) list.append(el('li', 'missable-item', 'No trophy in this list is time limited.'));
  wrap.append(list);
  return wrap;
}

function buildRules() {
  const wrap = el('section', 'panel rules-panel');
  wrap.append(el('h2', 'panel-title', 'Rules of the run'));
  const list = el('ul', 'rules-list');
  const hidden = trophies.filter((t) => t.hidden).length;
  const rules = [
    [`${hidden} hidden on PlayStation`, 'The list hides story and secret trophies until they are earned, so a guide is the only way to plan them.'],
    ['Nothing is online', `All ${trophies.length} are single player. There are no GTA Online trophies and no DLC trophies in the list.`],
    ['Cheats cost you the run', 'Using a cheat switches off trophies and saving for that session. Keep one clean save.'],
    ['Keep manual saves', '15 slots plus autosave, and no mission replay. Save at the start and end of every chapter.'],
    ['Avoid the Irredeemable profile', 'The criminal profile has a permanent top tier that makes police far more aggressive.'],
    ['About 200 hours', 'Guides put the platinum near 200 hours at a difficulty of 4 out of 10, most of it 100% cleanup.'],
  ];
  for (const [title, body] of rules) {
    const li = el('li', 'rule');
    li.append(el('strong', 'rule-title', title));
    li.append(el('span', 'rule-body', body));
    list.append(li);
  }
  wrap.append(list);
  return wrap;
}

function renderRoadmap() {
  const t = totals(trophies, state.earned);
  const intro = el('section', 'roadmap-intro');
  const head = el('div', 'roadmap-head');
  head.append(el('p', 'eyebrow', 'The route to Vice Got a Price!'));
  head.append(el('h2', 'roadmap-title', `${trophies.length} trophies, five chapters, one ledger`));
  head.append(
    el(
      'p',
      'roadmap-lede',
      'The order below comes from the official descriptions: each chapter trophy names the chapter it closes, each mission trophy names its mission, and each count trophy names its number. The checklist stage is where the long tail sits, and nothing in it closes when the story ends.',
    ),
  );
  intro.append(head);

  const summary = el('div', 'roadmap-summary');
  const grades = [
    ['platinum', 'Platinum', t.byGrade.platinum],
    ['gold', 'Gold', t.byGrade.gold],
    ['silver', 'Silver', t.byGrade.silver],
    ['bronze', 'Bronze', t.byGrade.bronze],
  ];
  for (const [grade, label, count] of grades) {
    const cell = el('div', `summary-cell grade-${grade}`);
    cell.append(el('span', 'summary-count', String(count)));
    cell.append(el('span', 'summary-label', label));
    summary.append(cell);
  }
  const done = el('div', 'summary-cell summary-done');
  done.append(el('span', 'summary-count', `${t.earned}`));
  done.append(el('span', 'summary-label', 'earned'));
  summary.append(done);
  intro.append(summary);
  intro.append(
    el(
      'p',
      'roadmap-foot',
      `${t.missable} trophy${t.missable === 1 ? '' : 's'} flagged time limited. Every other trophy can still be earned in free roam after the credits, which is why the cleanup stage is safe to leave until last.`,
    ),
  );

  const columns = el('div', 'roadmap-columns');
  const left = el('div', 'roadmap-left');
  left.append(buildStageRail());
  const right = el('div', 'roadmap-right');
  right.append(buildMissables(), buildChecklist(), buildRules());
  columns.append(left, right);

  els.roadmap.replaceChildren(intro, columns);
}

function render() {
  els.viewTracker.hidden = state.view !== 'tracker';
  els.viewRoadmap.hidden = state.view !== 'roadmap';
  renderFilters();
  renderHeader();
  renderList(trophies);
  renderDetail(trophies);
  if (state.view === 'roadmap') renderRoadmap();
  renderStatus();
  els.search.value = state.query;
  for (const tab of els.tabs) {
    const active = tab.dataset.view === state.view;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  }
}

function applyShot() {
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (!shot) return;
  const wanted = Number(params.get('id'));
  const pick = (fallbackId) => (Number.isFinite(wanted) && wanted > 0 ? wanted : fallbackId);
  if (shot === 'roadmap') {
    state.view = 'roadmap';
    return;
  }
  state.view = 'tracker';
  if (shot === 'spoiler') {
    state.spoiler = true;
    state.kind = 'story';
    // Open an earned story trophy, so the pane shows the guard lifting on what you have earned
    // while the rows around it stay masked. Falls back to any earned trophy of any kind.
    const earnedStory = trophies.find((t) => t.kind === 'story' && state.earned.has(t.id));
    const anyEarned = trophies.find((t) => state.earned.has(t.id));
    const fallback = (earnedStory ?? anyEarned ?? trophies[0]).id;
    state.selected = pick(fallback);
    return;
  }
  state.spoiler = false;
  state.kind = 'all';
  // Each shot opens the trophy that shows that view at its best, unless ?id= names one.
  state.selected = pick(shot === 'guide' ? 28 : 14);
}

function wire() {
  els.search.addEventListener('input', () => setQuery(els.search.value));
  els.spoiler.addEventListener('click', () => setSpoiler(!state.spoiler));
  els.export.addEventListener('click', () => downloadProgress(trophies, flash));
  els.import.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (file) importProgressFile(file, trophies, flash);
    event.target.value = '';
  });
  for (const tab of els.tabs) {
    tab.addEventListener('click', () => {
      setView(tab.dataset.view);
      if (tab.dataset.view === 'roadmap') renderRoadmap();
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === 'j' || event.key === 'ArrowDown') step(1, event);
    else if (event.key === 'k' || event.key === 'ArrowUp') step(-1, event);
    else if (event.key === 'Enter' || event.key === ' ') {
      if (state.selected) {
        toggleEarned(state.selected);
        event.preventDefault();
      }
    } else if (event.key === 's') setSpoiler(!state.spoiler);
  });
}

function step(delta, event) {
  const visible = trophies.filter((t) => state.kind === 'all' || t.kind === state.kind || (state.kind === 'missable' && t.missable));
  if (!visible.length) return;
  const at = visible.findIndex((t) => t.id === state.selected);
  const next = visible[Math.min(visible.length - 1, Math.max(0, (at === -1 ? 0 : at) + delta))];
  if (next) {
    setSelected(next.id);
    document.querySelector(`.row[data-id="${next.id}"]`)?.scrollIntoView({ block: 'nearest' });
    event.preventDefault();
  }
}

async function boot() {
  const response = await fetch('data/trophies.json');
  const doc = await response.json();
  trophies = doc.trophies ?? doc;
  hydrate(trophies);
  applyShot();
  subscribe(render);
  wire();
  render();
}

boot().catch((error) => {
  els.detail.textContent = `The ledger could not load its data: ${error.message}`;
});
