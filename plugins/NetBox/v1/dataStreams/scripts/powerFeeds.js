// GraphQL reports errors as HTTP 200 with an `errors` array, so errorHandling never fires; throw to surface the message.
if (data && data.errors && data.errors.length) {
    throw new Error(data.errors.map((e) => e.message).join("; "));
}

// NetBox GraphQL can't require several tags at once (nested AND matches nothing), so the Tag(s) filter is applied
// here to keep the REST streams' "has all selected tags" behaviour. Paging counts the raw list, so this is safe.
const tagSlugs = [].concat((context.config && context.config.tag) || [])
    .flatMap((t) => (t && typeof t === "object" ? [t.value] : String(t).split(",")))
    .map((t) => String(t).trim())
    .filter(Boolean);

result = ((data && data.data && data.data.power_feed_list) || []).filter((feed) =>
    tagSlugs.every((slug) => (feed.tags || []).some((t) => t.slug === slug)),
);
