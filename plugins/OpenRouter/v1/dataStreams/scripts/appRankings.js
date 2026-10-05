// Adds the as-of date and citation OpenRouter requires to every row, and
// converts total_tokens (sent as a decimal string) to a number
const asOf = data?.meta?.as_of;
const citation = `Source: OpenRouter (openrouter.ai/apps), as of ${asOf}. Licensed under CC BY 4.0.`;

result = (data?.data ?? []).map((r) => ({ ...r, total_tokens: Number(r.total_tokens), asOf, citation }));
