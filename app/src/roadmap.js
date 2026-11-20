// The roadmap to the platinum, derived from app/data/trophies.json. Every count on screen comes
// from a reduce over the trophy list, so the numbers can never drift from the data.

/** Stage order is the order a player should meet them, platinum last. */
export const STAGES = [
  {
    key: 'ch1',
    name: 'Chapter 1 · Gone Fishing',
    note: 'The opening mission, then the balcony meditation before the chapter closes.',
  },
  {
    key: 'ch2',
    name: 'Chapter 2 · A working pair',
    note: 'The partner opens up: Breakfast Run, the garages app, and the pair trophies.',
  },
  {
    key: 'ch3',
    name: 'Chapter 3 · The robbery kit',
    note: 'Credit Check gives the Dye Pack Jammer; jewelry jobs give the Snap Gun.',
  },
  {
    key: 'ch4',
    name: 'Chapter 4 · Heat',
    note: 'Vaults, armored trucks and the airport. The last chapter of the story grind.',
  },
  {
    key: 'ch5',
    name: 'Chapter 5 · The last job',
    note: 'The finale, and the 100% checklist that opens once the credits roll.',
  },
  {
    key: 'completion',
    name: 'The 100% checklist',
    note: 'Progress › Stats › 100% Completion. Work done earlier already counts.',
  },
  {
    key: 'sides',
    name: 'Strangers & freaks',
    note: 'Eight strands for the silver, plus the named finales that carry their own bronze.',
  },
  {
    key: 'loose',
    name: 'Odd jobs and one-offs',
    note: 'Crime, combat, money and the cryptic hidden trophies. Free roam after the credits.',
  },
  {
    key: 'platinum',
    name: 'The platinum',
    note: 'Vice Got a Price! arrives on its own once the other 54 are earned.',
  },
];

export const KIND_LABELS = {
  all: 'All 55',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  side: 'Side jobs',
  platinum: 'Platinum',
};

/** Filter buckets, in the order the toolbar shows them. `missable` is a flag, not a kind. */
export const FILTERS = ['all', 'story', 'missable', 'collectibles', 'activities', 'side', 'platinum'];

export function matchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  return trophy.kind === kind;
}

/** Filter chips carry live counts, computed here so the toolbar and the list agree. */
export function kindCounts(trophies) {
  const counts = {};
  for (const key of FILTERS) {
    counts[key] = trophies.filter((t) => matchesKind(t, key)).length;
  }
  return counts;
}

export function stageSummary(trophies, stageKey) {
  const inStage = trophies.filter((t) => t.stage === stageKey);
  return {
    key: stageKey,
    total: inStage.length,
    trophies: inStage,
    missable: inStage.filter((t) => t.missable).length,
  };
}

export function stageSummaries(trophies) {
  return STAGES.map((s) => ({ ...s, ...stageSummary(trophies, s.key) }));
}

/** Missable flags with the reason a player can miss them, for the roadmap warning panel. */
export function missableList(trophies) {
  return trophies.filter((t) => t.missable).map((t) => ({
    id: t.id,
    name: t.name,
    grade: t.grade,
    stage: t.stage,
    stageName: STAGES.find((s) => s.key === t.stage)?.name ?? t.stage,
    note: t.missableNote ?? 'This step closes before free roam opens.',
  }));
}

/** Totals used by the header, the status bar and the roadmap summary strip. */
export function totals(trophies, earned) {
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  const earnedByGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) {
    byGrade[t.grade] += 1;
    if (earned.has(t.id)) earnedByGrade[t.grade] += 1;
  }
  const earnedCount = earned.size;
  return {
    total: trophies.length,
    earned: earnedCount,
    pct: trophies.length ? Math.round((earnedCount / trophies.length) * 100) : 0,
    byGrade,
    earnedByGrade,
    missable: trophies.filter((t) => t.missable).length,
  };
}

/** The 100% checklist as the guides state it: PowerPyx's list, plus Push Square's matches. */
export const CHECKLIST = [
  { label: 'Story completed', target: 1, total: 1, scope: 'full' },
  { label: 'Optional tasks', target: 100, total: 100, scope: 'part' },
  { label: 'Gang operations', target: 39, total: 39, scope: 'full' },
  { label: 'Bank jobs', target: 22, total: 22, scope: 'full' },
  { label: 'Payday loan jobs', target: 7, total: 7, scope: 'full' },
  { label: 'Smash and grabs', target: 34, total: 35, scope: 'part' },
  { label: 'Stick ups', target: 50, total: 91, scope: 'part' },
  { label: 'Vaults hit', target: 8, total: 8, scope: 'full' },
  { label: 'Kenton sets', target: 5, total: 7, scope: 'part' },
  { label: 'Collectible card sets', target: 15, total: 18, scope: 'part' },
  { label: 'WAiNK scans', target: 100, total: 100, scope: 'part' },
  { label: 'Underwater discoveries', target: 33, total: 33, scope: 'full' },
  { label: 'Meditations', target: 15, total: 18, scope: 'part' },
  { label: 'Cocaine flamingos', target: 100, total: 125, scope: 'part' },
  { label: 'Discovered styles', target: 70, total: 79, scope: 'part' },
  { label: 'Unique races won', target: 30, total: 40, scope: 'part' },
  { label: 'Shooting range golds', target: 42, total: 42, scope: 'full' },
  { label: 'Basketball hoops', target: 90, total: 100, scope: 'part' },
  { label: 'Drone time trials', target: 42, total: 42, scope: 'full' },
  { label: 'Stunts', target: 300, total: 397, scope: 'part' },
  { label: 'Challenges', target: 70, total: 80, scope: 'part' },
  { label: "Bret's Target Decks", target: 15, total: 15, scope: 'full' },
  { label: 'Base model vehicles scanned', target: 200, total: 277, scope: 'part' },
  { label: 'Standard issue weapons', target: 50, total: 66, scope: 'part' },
  { label: 'Animals studied', target: 100, total: 255, scope: 'part' },
];
