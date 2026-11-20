// Export and import of the ledger as a JSON file. Nothing leaves the browser except through the
// user's own download; the import reads a file the user picked and never touches the network.

import { state, replaceEarned } from './store.js';

const FILE_FORMAT = 'leonida-ledger';
const FILE_VERSION = 1;

export function exportPayload(trophies) {
  return {
    format: FILE_FORMAT,
    version: FILE_VERSION,
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    earnedNames: trophies.filter((t) => state.earned.has(t.id)).map((t) => t.name),
    total: trophies.length,
  };
}

export function downloadProgress(trophies, flash) {
  const payload = exportPayload(trophies);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leonida-ledger-progress-${payload.exportedAt.slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  flash?.(`Exported ${payload.earned.length} of ${trophies.length} trophies`);
}

/**
 * Read an exported file back. Accepts the app's own format, plus a bare array of ids and a bare
 * array of names, so a file from an older checklist still imports.
 */
export function parseProgress(text, trophies) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not JSON.');
  }
  const byName = new Map(trophies.map((t) => [t.name.toLowerCase(), t.id]));
  const ids = new Set();

  const takeId = (value) => {
    if (typeof value === 'number' && trophies.some((t) => t.id === value)) ids.add(value);
    else if (typeof value === 'string') {
      const asNumber = Number(value);
      if (Number.isInteger(asNumber) && trophies.some((t) => t.id === asNumber)) ids.add(asNumber);
      else if (byName.has(value.toLowerCase())) ids.add(byName.get(value.toLowerCase()));
    }
  };

  if (Array.isArray(data)) data.forEach(takeId);
  else if (data && Array.isArray(data.earned)) data.earned.forEach(takeId);
  else if (data && Array.isArray(data.earnedNames)) data.earnedNames.forEach(takeId);
  else throw new Error('No trophy list in that file.');

  if (!ids.size) throw new Error('That file holds no trophies this ledger knows.');
  return ids;
}

export function importProgressFile(file, trophies, flash) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const ids = parseProgress(String(reader.result ?? ''), trophies);
      replaceEarned(ids);
      flash?.(`Imported ${ids.size} of ${trophies.length} trophies`);
    } catch (error) {
      flash?.(error.message, true);
    }
  };
  reader.onerror = () => flash?.('That file could not be read.', true);
  reader.readAsText(file);
}
