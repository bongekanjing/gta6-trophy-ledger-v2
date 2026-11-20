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

/** The 100% checklist as the guides state it: PowerPyx's list, plus Push Square's matches.
 *  Labels are the shortest wording that still names the PowerPyx line, because the panel runs in
 *  a narrow column where a long label truncates. */
export const CHECKLIST = [
  { label: 'Story', target: 1, total: 1 },
  { label: 'Optional tasks', target: 100, total: 100 },
  { label: 'Gang operations', target: 39, total: 39 },
  { label: 'Bank jobs', target: 22, total: 22 },
  { label: 'Payday loans', target: 7, total: 7 },
  { label: 'Smash and grabs', target: 34, total: 35 },
  { label: 'Stick ups', target: 50, total: 91 },
  { label: 'Vaults', target: 8, total: 8 },
  { label: 'Kenton sets', target: 5, total: 7 },
  { label: 'Card sets', target: 15, total: 18 },
  { label: 'WAiNK scans', target: 100, total: 100 },
  { label: 'Underwater finds', target: 33, total: 33 },
  { label: 'Meditations', target: 15, total: 18 },
  { label: 'Flamingos', target: 100, total: 125 },
  { label: 'Styles found', target: 70, total: 79 },
  { label: 'Races won', target: 30, total: 40 },
  { label: 'Range golds', target: 42, total: 42 },
  { label: 'Hoops', target: 90, total: 100 },
  { label: 'Drone times', target: 42, total: 42 },
  { label: 'Stunts', target: 300, total: 397 },
  { label: 'Challenges', target: 70, total: 80 },
  { label: 'Target Decks', target: 15, total: 15 },
  { label: 'Vehicles scanned', target: 200, total: 277 },
  { label: 'Weapons', target: 50, total: 66 },
  { label: 'Animals studied', target: 100, total: 255 },
];
