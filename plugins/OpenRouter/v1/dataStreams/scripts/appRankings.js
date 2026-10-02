// Adds the as-of date and citation OpenRouter requires to every row
const asOf = data?.meta?.as_of;
const citation = `Source: OpenRouter (openrouter.ai/apps), as of ${asOf}. Licensed under CC BY 4.0.`;

result = (data?.data ?? []).map((r) => ({ ...r, asOf, citation }));
