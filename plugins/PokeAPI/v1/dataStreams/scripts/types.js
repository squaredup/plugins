// Stellar (Tera-only), Unknown and Shadow are listed by the API but have no Pokémon or matchups
const excluded = ["stellar", "unknown", "shadow"];

result = (data.results || []).filter((t) => !excluded.includes(t.name));
