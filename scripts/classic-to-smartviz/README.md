# classic-to-smartviz

Converts the classic tiles in a plugin's default dashboards to SmartViz tiles. Each classic `config.visualisation` is replaced with a `config.vizSpec`, in place, so the rest of the file is left untouched and the diff shows only the tiles that changed.

It works from the repository alone. Column names, types and headers come from the classic config, the tile's group and `metadata`, and the stream's declared `metadata`. No data is fetched.

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
| `--json <file>` | Also write the report as JSON. |

`squaredup validate` checks every `vizSpec` against the same schema when the plugin is validated or deployed, so `--schema` is a convenience for checking a large batch before you push.

## What converts to what

| Classic | SmartViz | Notes |
| --- | --- | --- |
| Table | `richTable` | The shown columns are `columnOrder` minus `hiddenColumns`, or every visible declared column when there is no `columnOrder`. Headers come from `columnDisplayNames`, then the column's `displayName`, then the name the platform would infer. State, date and URL columns get the status, date and link renderers; everything else uses the text renderer, which keeps the shape's formatting. A state column that maps its own values to states (say `Win` to success) shows those values instead, from the platform's `<name>[Expanded].rawState` column, as a badge coloured by the map. |
| Status blocks | `statusGrid` | The sublabel becomes a `statusGridSecondaryTemplate`, wrapped in `{{{{raw}}}}` so install-time templating leaves it alone. |
| Line graph | `line` | Classic's default fitted y axis and hidden data points carry over. Area shading is kept only when the lines are not split into series. |
| Bar chart | `bar` | Grouping, stacking, horizontal layout, value labels and simple colour rules carry over. |
| Scalar | `scalar` | |
| Gauge | `gauge` | |
| Donut | `pie` with a 60% hole and the total in the centre | |

Tiles on the built-in properties stream, iframe tiles and tiles that are already SmartViz are left alone.

## What it will not convert

A tile is reported as blocked, and left classic, when converting it would mean guessing:

- **A table that shows all columns** of a stream that does not declare its full column list.
- **A table with more than 12 columns.** A SmartViz table holds at most 12.
- **A line or bar chart that plots some, but not all, of a stream's numeric columns.** SmartViz plots one y column, or every numeric column.
- **A scalar, gauge or donut set to pick its columns automatically**, when the stream does not declare them.

A column the classic config names but the tile's data no longer has (for example, after a group was added) is handled the way classic handles it: dropped from a table, or left for SmartViz to pick on a chart. Each case is noted in the report.

## Before you raise the pull request

The script cannot see data, so check each converted dashboard in a deployed plugin, with real or demo data, and compare it with the classic version.
