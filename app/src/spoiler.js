// The spoiler guard. A story trophy's name and description stay masked until it is earned, so a
// reader who has not finished the game can use the ledger without learning mission names.
// The choice lives in the store, so the toolbar, the list, the detail pane and the status bar all
// read the same number.

import { state } from './store.js';

/** Story trophies and the named story missions are what leak plot. */
const STORY_KINDS = new Set(['story']);

export function isGuardable(trophy) {
  return STORY_KINDS.has(trophy.kind);
}

/** True when this trophy's text should be hidden right now. */
export function isMasked(trophy, earned) {
  if (!state.spoiler) return false;
  if (!isGuardable(trophy)) return false;
  return !earned.has(trophy.id);
}

export function maskedName(trophy) {
  return `Hidden story trophy · ${gradeLabel(trophy.grade)}`;
}

export function maskedDescription() {
  return 'Finish the mission to reveal the name and what it asks.';
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

/**
 * The count the toolbar reports. It is the same predicate the list uses, so "26 hidden" on the
 * toggle and "26 shielded" in the status bar can never disagree.
 */
export function shieldedCount(trophies, earned) {
  return trophies.filter((t) => isMasked(t, earned)).length;
}

/** A guide hides its mission names too, so the detail pane can quote the same reasoning. */
export function maskedGuide() {
  return 'This guide names the mission it unlocks in, so it stays behind the spoiler guard until you earn the trophy. Turn the guard off in the toolbar if you want to read it now.';
}
