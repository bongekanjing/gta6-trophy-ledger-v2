# Leonida Ledger

[![Competition](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounties/gta6-trophy-guide-01)
[![Rank](https://make.fun/badge/gta6-trophy-guide-01/bongekanjing/gta6-trophy-guide-mellow-condor/rank.svg)](https://make.fun/bounties/gta6-trophy-guide-01)
[![Reward](https://make.fun/badge/gta6-trophy-guide-01/bongekanjing/gta6-trophy-guide-mellow-condor/reward.svg)](https://make.fun/bounties/gta6-trophy-guide-01)

A guide and progress tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI, built as a
single offline page. It runs from static files with no build step and no network: every script,
stylesheet, font and byte of trophy data is a file under `app/`.

## What it does

**The tracker.** All 55 official trophies with their exact names, descriptions and grades, grouped
by roadmap stage. Each row carries a tick box, and progress saves to `localStorage` on every click.
Filters cover story, missable, collectibles, activities, side jobs and the platinum, each with a
live count. The search box matches trophy names, descriptions and guide text, so you can look up
"vaults" and land on the right guide.

**The spoiler guard.** Story trophies keep their names and descriptions hidden until they are
earned, so the ledger can be used without reading mission titles ahead of time. The setting
persists, and the count it reports is the same number the list and the status bar use.

**The roadmap.** Nine stages in playing order, ending at the platinum, each with its own tally.
The missable panel explains why a window closes, and the 100% checklist lists every target with
whether it needs all of an item or a partial count.

**Cited guides.** Every trophy carries a guide of two to five sentences in the entry's own words,
with the sources it draws on listed beside the claim. Sources open in a new tab and are never
loaded by the page.

**Export and import.** Progress leaves as a JSON file named for the date, and reads back from a
file the user picks. Nothing is sent anywhere.

## Layout

```
app/
  index.html          the shell: header, toolbar, list, detail pane, roadmap
  style.css           the look, plus the two vendored font-face declarations
  data/trophies.json  all 55 trophies with guides, sources, kind, stage and counts
  fonts/              Anton and Inter, woff2, both under the SIL Open Font License
  src/
    store.js          progress state, localStorage, the filter and view state
    roadmap.js        stages, derived counts, missable list, 100% checklist
    list.js           the trophy list, grouping, search and filters
    detail.js         one trophy's guide, sources, grade badge and done toggle
    spoiler.js        the guard: which trophies are masked right now
    io.js             export and import as JSON
    main.js           boot and wiring
```

Every count on screen is a reduce over `trophies.json`, so the numbers cannot drift from the data.

## Running it

Open `app/index.html` in desktop Chrome. ES modules need a server, so serve the folder first:

```
cd app && python3 -m http.server 8123
```

Then open `http://127.0.0.1:8123/index.html`. The repository also ships `serve.ts`:

```
node serve.ts
```

Screenshots come from query parameters rather than clicking: `?shot=tracker`, `?shot=roadmap`,
`?shot=spoiler` and `?shot=guide` each put the page in the state its shot needs, and `?demo=1` marks
a sample of trophies earned so the shots show real progress. `?id=<n>` selects a trophy.

## Building the deliverable

```
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json`. The dossier is
deterministic, so two runs produce identical bytes.

## Credits

Trophy names, descriptions and grades are the official PlayStation list. Guides are written for
this entry from the published work of PowerPyx, GTABase, Timesaver.gg, Pro-Gamer.gg, Push Square,
GTA BOOM and Space4Games; each trophy cites the pages it drew on. No game artwork, screenshot or
Rockstar mark is used, and the two fonts are shipped under the SIL Open Font License.
