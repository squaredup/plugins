Explore every Pokémon, battle type and generation in SquaredUp, including base stats, Pokédex entries, type matchups and learnable moves. The data comes from [PokéAPI](https://pokeapi.co), a free and open RESTful Pokémon API ([API documentation](https://pokeapi.co/docs/v2)).

## Setup

PokéAPI is free and needs no account, API key or sign-in.

1. Add the **PokéAPI** data source.
2. Give it a name and save. There is nothing else to configure.

SquaredUp then imports every Pokémon, type and generation, and installs the out-of-the-box dashboards.

## Configuration fields

This plugin has no configuration fields.

On save, the plugin checks that `https://pokeapi.co` is reachable by fetching the list of types. A failure means SquaredUp (or the agent running the plugin) cannot reach the internet address `pokeapi.co`.

## What this plugin monitors

- **Pokémon:** types, height, weight, abilities, base stats and effort value yield, official artwork and cry, plus the moves each Pokémon can learn.
- **Pokédex data:** the latest English Pokédex entry, category, generation, rarity (legendary, mythical or baby), capture rate, gender ratio, egg groups, habitat and what each Pokémon evolves from.
- **Types:** every attacking and defending damage multiplier (the type chart), and which Pokémon have each type as their primary or secondary type.
- **Generations:** each generation's main region and games, the species it introduced, and how many new moves, abilities and types it added.

The out-of-the-box dashboards include an **Overview** plus a perspective for each **Pokémon**, **Pokémon Type** and **Generation**.

## Data streams

- **Pokémon Profile:** types, height (m), weight (kg), base experience, abilities, base stat total, and links to artwork, sprite and cry. One row per Pokémon.
- **Pokémon Stats:** HP, Attack, Defense, Sp. Atk, Sp. Def and Speed, with effort value yield. One row per stat for each Pokémon.
- **Pokémon Species:** Pokédex entry, category, generation, rarity, capture rate, base happiness, gender ratio, egg cycles, growth rate, habitat, colour, shape, egg groups, evolves-from and number of forms. One row per Pokémon.
- **Pokémon Moves:** moves learnable in the most recent game the Pokémon appears in, with learn method (Level Up, Evolution, Machine, Egg or Tutor) and level. One row per move for each Pokémon.
- **Type Matchups:** damage multipliers (2×, ½× or 0×) a type deals to and takes from every other type. One row per matchup for each type.
- **Pokémon by Type:** the Pokémon that have a type, and whether it is their primary or secondary type. Rows link to the Pokémon.
- **Generation Summary:** main region, games, and the number of new species, moves, abilities and types for each generation.
- **Pokémon by Generation:** the species a generation introduced. Rows link to the Pokémon.

Select several objects on any of these streams to compare them side by side, for example the base stats of two Pokémon or the Pokémon counts of every type.

The **Pokémon**, **Types** and **Generations** streams are hidden. They build the object list, and **Types** also checks the connection on save.

## What gets indexed

| Object type | API source | Represents |
| ----------- | ---------- | ---------- |
| **Pokémon** | `GET /api/v2/pokemon-species` | A species in the National Pokédex. The object ID is its National Pokédex number. |
| **Pokémon Type** | `GET /api/v2/type` | A battle type, such as Fire or Water. Stellar, Unknown and Shadow are skipped because they have no Pokémon. |
| **Generation** | `GET /api/v2/generation` | A game generation, such as Generation I. |

The data is re-imported every 12 hours, so new species and generations appear automatically once PokéAPI adds them.

## Known limitations

- **Species only, no alternate forms.** Mega Evolutions, Gigantamax and regional forms are not indexed and are left out of **Pokémon by Type**. Profiles, stats and moves show each species' default form.
- **Names come from API identifiers.** Object, move, game and ability names are built from PokéAPI's identifiers, so punctuation is missing: "Mr Mime", "Farfetchd", "Lets Go Eevee", "Heartgold Soulsilver". **Pokémon Species** shows the official English Pokémon name, such as "Mr. Mime".
- **Moves cover one game.** **Pokémon Moves** shows the newest game in which the Pokémon has a level-up learnset, which differs between Pokémon (for example Scarlet Violet for Charizard, Legends Arceus for Ponyta). Learnsets from other games are not shown.
- **No evolution chains.** Only the species a Pokémon evolves from is shown.
- **Images are links.** Artwork, sprites and cries are links rather than images inside tiles.
- **English only.** Names, categories and Pokédex entries are in English.
- **No time range.** PokéAPI is static reference data, so no data stream has a timeframe.
- **Read-only.** The plugin only reads public data from PokéAPI, which has no rate limit but asks clients to use it fairly.
