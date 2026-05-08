# Pokédex

Browse Pokémon data from [PokéAPI](https://pokeapi.co/) — a free, open Pokédex REST API.

## Configuration

No authentication required. Simply add the plugin and run an import to pull in all Pokémon and Types.

## Imported objects

| Type | Count | Description |
|------|-------|-------------|
| Pokémon | ~1,350 | Individual Pokémon entries |
| Type | 18 | The 18 battle types (Fire, Water, Grass, etc.) |

## Data streams

| Stream | Scope | Description |
|--------|-------|-------------|
| Pokémon Details | Pokémon | Height, weight, base XP, types and abilities |
| Base Stats | Pokémon | HP, Attack, Defense, Special Attack, Special Defense, Speed |
| Moves | Pokémon | Full move list with learn method and level |
| Pokémon by Type | Type | All Pokémon that have a given type |
| Type Damage Relations | Type | Type effectiveness — what deals/takes double, half, or no damage |

## Dashboards

- **Pokédex Overview** — All 18 types at a glance, with drilldown to each type's perspective
- **Pokémon** perspective — Details, base stats bar chart, and full move list for any Pokémon
- **Type** perspective — Pokémon belonging to the type, and full damage relations table
