# classic-to-smartviz

Converts the classic tiles in a plugin's default dashboards to SmartViz tiles. Each classic `config.visualisation` is replaced with a `config.vizSpec`, in place, so the rest of the file is left untouched and the diff shows only the tiles that changed.

It works from the repository alone. Column names, types and headers come from the classic config, the tile's group and `metadata`, and the stream's declared `metadata`, or a SQL tile's select list. A shape name the platform doesn't register is ignored, as the platform ignores it. No data is fetched.

## Usage

```sh
# Report only — what would convert, what is blocked and why
node scripts/classic-to-smartviz/convert.mjs plugins/OpenF1/v1

# Convert, bump each changed plugin by a patch, and validate every spec against the schema
node scripts/classic-to-smartviz/convert.mjs --write --bump patch --schema <viz-spec bundle> plugins/OpenF1/v1 plugins/NASA/v1
```

| Option | |
| --- | --- |
| `--write` | Write the converted dashboards. Without it the script only reports. |
| `--bump patch\|minor` | With `--write`, bump `metadata.json` in each folder that had a tile converted. |
| `--schema <file>` | A CommonJS module exporting `vizSpecSchema` from `@squaredup/viz-spec` (in the saas repo). A spec that fails it, or loses a key to it, stays classic. |
| `--rules <names>` | The enhancement rules to apply on top of the conversion: `all` (the default), `none`, or a comma-separated list. See [Enhancement rules](#enhancement-rules). |
| `--json <file>` | Also write the report as JSON. |

`squaredup validate` checks every `vizSpec`, but against the schema of the environment the CLI is logged into. Deploying to prod checks it against prod's, which can be older than DEV's. Pass `--schema` a bundle built from the release prod runs, so a spec prod would reject stays classic.

Automatic tables that hide columns (`richTableHiddenColumns`) and status grids with no status need SaaS #10322. Against an older bundle the first stay classic, but the second pass the schema and draw "No data", so don't ship them to a release without it.

To build that bundle from the saas repo (prod's release number is in the page source of app.squaredup.com):

```sh
git -C <saas> show Release-<number>:packages/@squaredup/viz-spec/src/schema.ts > schema.ts
npm install zod esbuild
npx esbuild schema.ts --bundle --platform=node --format=cjs --outfile=schema.cjs
```

## What converts to what

| Classic | SmartViz | Notes |
| --- | --- | --- |
| Table | `richTable` | The shown columns are the ones classic shows: every column not in `hiddenColumns` (or, with no `hiddenColumns`, every column the stream marks visible), with `columnOrder` first and the rest after it in stream order. A column the stream hides that `columnOrder` doesn't name stays hidden: classic's editor saves every column it shows into `columnOrder`, so the column was added or hidden after the tile was saved. When the stream does not declare its full column list, the table names no columns and SmartViz shows every column the data has, less classic's `hiddenColumns` in `richTableHiddenColumns`. Its columns then follow the data's order, and keep their own headers and renderers (the report notes a lost order or rename). A customised table on such a stream lists the columns it can name instead when `columnOrder` shows a column the stream hides, or when it hides more than the 100 columns `richTableHiddenColumns` holds; columns the stream doesn't declare are then left out. Headers come from `columnDisplayNames`, then the column's `displayName`, then the name the platform would infer. State, date and URL columns get the status, date and link renderers; everything else uses the text renderer, which keeps the shape's formatting. A state column that maps its own values to states (say `Win` to success) shows those values instead, from the platform's `<name>[Expanded].rawState` column, as a badge coloured by the map. |
| Status blocks | `statusGrid` | The sublabel becomes a `statusGridSecondaryTemplate`, wrapped in `{{{{raw}}}}` so install-time templating leaves it alone. A tile scoped to the dashboard's object gets one column, as classic fits one block to the tile. The link column carries over only when it holds URLs: a block linked to an object column opens that object, which a status grid does with no link set. Blocks with no state column have no status, so they are grey, as in classic. If the data has a state column, SmartViz colours the blocks by it (the report notes it). |
| Line graph | `line` | Classic's default fitted y axis and hidden data points carry over. Several y columns become a list, each quantitative whatever shape the stream declares. Area shading is kept only when the lines are not split into series. |
| Bar chart | `bar` | Grouping, stacking, horizontal layout, value labels and simple colour rules carry over. Several y columns become a list. |
| Scalar | `scalar` | A row count becomes `scalarRowCount`. |
| Gauge | `gauge` | The value reads the first row of its column, as a classic gauge does whatever reduction it names; a row count stays a count. |
| Donut | `pie` with a 60% hole and the total in the centre | Slices are ordered largest first (`pieSort: "desc"`), as classic always orders them. "Show values as percentage" becomes `pieLabels: "nameAndPercent"`. |

A tile's custom no-data message is kept, as `visualisation.noDataMessage` beside the `vizSpec`. A column classic leaves on auto (a scalar or gauge value, a donut label or value, a status block label) is left out of the spec, and SmartViz picks it from the data the way classic does. Iframe tiles and tiles that are already SmartViz are left alone.

## Enhancement rules

On top of the like-for-like conversion, these rules improve a tile where the repository alone shows it is safe to. None depends on what the data holds. They run only on tiles converted in that run, never on an existing `vizSpec`, and the report lists every rule that fired on each tile.

| Rule | What it does | When |
| --- | --- | --- |
| `recencyDates` | Shows a date as "3 hours ago", with the exact time in the tooltip | A table date column named like last seen, updated, modified, checked, heartbeat, sync, refreshed or polled |
| `statusColours` | Colours status words: critical / error / failed / down → red, warning / medium / degraded → amber, ok / healthy / success / up → green, low / info → blue, unknown → grey. Other values keep the palette | A donut, or a bar or line chart split by a column named like status, state, health, result, severity, priority, outcome, level or condition, with no colours of its own |
| `percentBars` | Shows a bar filled to the value out of 100, in a neutral colour | A table column with the percent shape, unless its name suggests a signed value (difference, change, delta, growth, trend, result) |
| `percentAxis` | Fixes the y axis to 0–100%: the `percentage` range, or 0 to 1 for a zero-to-one percentage, which a line plots as the fraction | A line chart whose y column has the percent shape and no range of its own |
| `percentGauge` | Runs the gauge from 0 to 100 | A gauge of a percent-shaped column with no range of its own |
| `booleanLabels` | Shows "Yes" / "No" in the table's own text colour, so neither value reads as good or bad | A table column with the boolean shape |

## What it will not convert

A tile is reported as blocked, and left classic, when converting it would mean guessing:

- **A table with more than 50 columns.** A SmartViz table holds at most 50.
- **A customised table with no column to name**, on a stream that doesn't declare its columns, when it can't be left automatic (see the table row above).

A column the classic config names but the tile's data no longer has (for example, after a group was added, or one a SQL tile's query doesn't return) is handled the way classic handles it: dropped from a table, or left for SmartViz to pick on a chart. Each case is noted in the report. A SQL tile's columns are only checked when every item in its select list has a name the converter can read: a `*` or an unaliased expression leaves the list open.

## Before you raise the pull request

The script cannot see data, so check each converted dashboard in a deployed plugin, with real or demo data, and compare it with the classic version.
