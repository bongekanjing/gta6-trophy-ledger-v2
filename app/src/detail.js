// The detail pane: one trophy's official name, description and grade, its guide, where each fact
// comes from, the missable warning, and the done toggle. The guide and the sources sit in the same
// column so a reader sees the claim and its citation together.

import { state, toggleEarned, setSelected } from './store.js';
import { STAGES } from './roadmap.js';
import { isMasked, maskedName, maskedDescription, maskedGuide } from './spoiler.js';

const DETAIL = document.getElementById('detail');

function el(tag, className, value) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}

function stageName(key) {
  return STAGES.find((s) => s.key === key)?.name ?? key;
}

/**
 * Split a guide into readable paragraphs of two or three sentences. Splitting on a sentence
 * boundary that is not a decimal or an abbreviation keeps "42 of 42" and "vs." intact.
 */
function paragraphs(guide) {
  const sentences = guide.match(/[^.!?]+[.!?]+(?:["'”)]+)?(?=\s|$)/g) ?? [guide];
  const out = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const pair = sentences.slice(i, i + 2).join(' ').trim();
    if (pair) out.push(pair);
  }
  return out.length ? out : [guide];
}

/** A short paraphrase of why a guide exists, so the pane says what kind of work it is. */
const KIND_COPY = {
  story: 'Story progress',
  collectibles: 'Collectible or checklist',
  activities: 'Activity or challenge',
  side: 'Side job or one-off',
  platinum: 'Completion reward',
};

function badge(trophy) {
  const wrap = el('div', `detail-badge grade-${trophy.grade}`);
  wrap.append(el('span', 'badge-shape', trophy.grade.charAt(0).toUpperCase()));
  const copy = el('div', 'badge-copy');
  copy.append(el('span', 'badge-grade', trophy.grade));
  copy.append(el('span', 'badge-kind', KIND_COPY[trophy.kind] ?? trophy.kind));
  wrap.append(copy);
  return wrap;
}

export function renderDetail(trophies) {
  const trophy = trophies.find((t) => t.id === state.selected) ?? trophies[0];
  if (!trophy) return;
  const earned = state.earned.has(trophy.id);
  const masked = isMasked(trophy, state.earned);

  const head = el('header', 'detail-head');
  const crumb = el('p', 'detail-crumb');
  crumb.append(
    el('span', 'crumb-stage', stageName(trophy.stage)),
    el('span', 'crumb-sep', '/'),
    el('span', 'crumb-id', `Trophy ${String(trophy.id).padStart(2, '0')} of ${trophies.length}`),
  );
  head.append(crumb);

  const titleRow = el('div', 'detail-title-row');
  titleRow.append(el('h2', 'detail-title', masked ? maskedName(trophy) : trophy.name));
  titleRow.append(badge(trophy));
  head.append(titleRow);

  const official = el('blockquote', 'official');
  official.append(
    el('span', 'official-tag', 'Official description'),
    el('p', 'official-text', masked ? maskedDescription() : trophy.description),
  );
  head.append(official);

  if (trophy.missable) {
    const warn = el('p', 'warn');
    warn.append(el('strong', 'warn-lead', 'Missable. '));
    warn.append(
      document.createTextNode(
        trophy.missableNote ??
          'This step closes before free roam opens, and missions cannot be replayed. Keep a manual save from before it.',
      ),
    );
    head.append(warn);
  }

  const toggle = el('button', `done${earned ? ' is-done' : ''}`);
  toggle.type = 'button';
  toggle.setAttribute('aria-pressed', String(earned));
  toggle.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.2 8.6l3 3 6.6-7"/></svg>';
  toggle.append(el('span', null, earned ? 'Earned' : 'Mark as earned'));
  toggle.addEventListener('click', () => toggleEarned(trophy.id));
  head.append(toggle);

  const guideBlock = el('section', 'guide');
  guideBlock.append(el('h3', 'block-title', 'How to earn it'));
  const guideBody = el('div', 'guide-body');
  for (const para of masked ? [maskedGuide()] : paragraphs(trophy.guide)) {
    guideBody.append(el('p', 'guide-para', para));
  }
  guideBlock.append(guideBody);

  const sources = el('section', 'sources');
  const srcHead = el('div', 'sources-head');
  srcHead.append(el('h3', 'block-title', 'Where this comes from'));
  srcHead.append(el('span', 'sources-note', masked ? 'hidden with the guide' : `${trophy.sources.length} cited`));
  sources.append(srcHead);

  const ul = el('ul', 'source-list');
  if (masked) {
    const li = el('li', 'source-muted', 'Sources are listed with the guide, after the trophy is earned.');
    ul.append(li);
  } else {
    for (const source of trophy.sources) {
      const li = el('li', 'source-item');
      const a = document.createElement('a');
      a.href = source.url;
      a.rel = 'noreferrer noopener';
      a.target = '_blank';
      a.textContent = source.label;
      li.append(a);
      const host = el('span', 'source-host', new URL(source.url).host.replace(/^www\./, ''));
      li.append(host);
      ul.append(li);
    }
  }
  sources.append(ul);

  // The rest of this trophy's stage, so the pane always tells you what is next instead of ending
  // in dead space. Counts come from the data, never from a literal.
  const stage = STAGES.find((s) => s.key === trophy.stage);
  const siblings = trophies.filter((t) => t.stage === trophy.stage && t.id !== trophy.id);
  if (stage && siblings.length) {
    const next = el('section', 'next-up');
    const nextHead = el('div', 'sources-head');
    nextHead.append(el('h3', 'block-title', `Also in ${stage.name}`));
    nextHead.append(el('span', 'sources-note', `${siblings.filter((t) => state.earned.has(t.id)).length}/${siblings.length} done`));
    next.append(nextHead);
    const chips = el('div', 'next-chips');
    for (const sibling of siblings) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `next-chip grade-${sibling.grade}${state.earned.has(sibling.id) ? ' is-earned' : ''}`;
      chip.textContent = isMasked(sibling, state.earned) ? 'Hidden story trophy' : sibling.name;
      chip.addEventListener('click', () => setSelected(sibling.id));
      chips.append(chip);
    }
    next.append(chips);
    DETAIL.replaceChildren(head, guideBlock, sources, next);
  } else {
    DETAIL.replaceChildren(head, guideBlock, sources);
  }
  DETAIL.dataset.id = String(trophy.id);
}
