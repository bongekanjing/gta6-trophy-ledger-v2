// The trophy list: grouped by roadmap stage, filtered by kind and query, and rendered as rows a
// reader can scan. Rows carry the official name, the official description, the grade rail and a
// tick box; a masked row shows the guard instead of the name.

import { state, toggleEarned, setSelected } from './store.js';
import { STAGES, matchesKind } from './roadmap.js';
import { isMasked, maskedName, maskedDescription } from './spoiler.js';

const GROUPS = document.getElementById('groups');

function text(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function searchBlob(trophy) {
  return [trophy.name, trophy.description, trophy.guide, trophy.sources.map((s) => s.label).join(' ')]
    .join(' ')
    .toLowerCase();
}

function isVisible(trophy, query) {
  if (!matchesKind(trophy, state.kind)) return false;
  if (!query) return true;
  return searchBlob(trophy).includes(query);
}

function buildRow(trophy, masked) {
  const row = document.createElement('div');
  row.className = `row grade-${trophy.grade}`;
  row.dataset.id = String(trophy.id);
  if (state.earned.has(trophy.id)) row.classList.add('is-earned');
  if (state.selected === trophy.id) row.classList.add('is-selected');
  if (masked) row.classList.add('is-masked');

  const check = document.createElement('button');
  check.type = 'button';
  check.className = 'check';
  check.setAttribute('role', 'checkbox');
  check.setAttribute('aria-checked', String(state.earned.has(trophy.id)));
  check.setAttribute('aria-label', `Mark ${masked ? 'this hidden story trophy' : trophy.name} as earned`);
  check.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.6l3 3 6.6-7"/></svg>';
  check.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleEarned(trophy.id);
  });

  const body = document.createElement('div');
  body.className = 'row-body';

  const head = document.createElement('p');
  head.className = 'row-head';
  const name = text('span', 'row-name', masked ? maskedName(trophy) : trophy.name);
  const grade = text('span', `grade-tag grade-tag-${trophy.grade}`, trophy.grade);
  head.append(name, grade);
  if (trophy.missable) {
    const flag = text('span', 'flag-missable', 'missable');
    head.append(flag);
  }
  if (trophy.count) {
    head.append(text('span', 'flag-count', `needs ${trophy.count}`));
  }

  const desc = text(
    'p',
    'row-desc',
    masked ? maskedDescription() : trophy.description,
  );

  body.append(head, desc);
  row.append(check, body);

  row.addEventListener('click', () => setSelected(trophy.id));
  return row;
}

export function renderList(trophies) {
  const query = state.query.trim().toLowerCase();
  const fragment = document.createDocumentFragment();
  let shown = 0;

  for (const stage of STAGES) {
    const inStage = trophies.filter((t) => t.stage === stage.key && isVisible(t, query));
    if (!inStage.length) continue;

    const group = document.createElement('section');
    group.className = 'group';
    const earnedHere = inStage.filter((t) => state.earned.has(t.id)).length;

    const head = document.createElement('header');
    head.className = 'group-head';
    head.append(text('h2', 'group-name', stage.name));
    const tally = text('span', 'group-tally', `${earnedHere}/${inStage.length}`);
    head.append(tally);
    group.append(head);

    for (const trophy of inStage) {
      group.append(buildRow(trophy, isMasked(trophy, state.earned)));
      shown += 1;
    }
    fragment.append(group);
  }

  if (!shown) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.append(
      text('p', 'empty-title', 'Nothing matches that filter'),
      text('p', 'empty-body', 'Clear the search or pick another kind to see the rest of the list.'),
    );
    fragment.append(empty);
  }

  GROUPS.replaceChildren(fragment);
  GROUPS.dataset.shown = String(shown);
  return shown;
}
