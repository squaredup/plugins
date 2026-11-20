// Usage reports arrive as signed links to NDJSON files rather than as rows. Each link is fetched as a
// further page by returning it as the paging context. Links still waiting ride along in the URL fragment,
// which the pre-request script strips before the request is sent.
const pendingLinks = () => {
    if (!context.pagingContext) {
        return [];
    }
    try {
        return JSON.parse(decodeURIComponent(new URL(context.pagingContext).hash.slice(1)));
    } catch {
        api.report.warning('Some Copilot report files could not be read, so this data may be incomplete.');
        return [];
    }
};

const isReportIndex = Array.isArray(data?.download_links);
const [nextLink, ...laterLinks] = isReportIndex ? data.download_links : pendingLinks();
pagingContext = nextLink ? `${nextLink}#${encodeURIComponent(JSON.stringify(laterLinks))}` : undefined;

// A one-line file parses as JSON on its own, so the body is either the parsed record or NDJSON text
const parseRecords = () =>
    typeof response.body === 'string'
        ? response.body
              .split('\n')
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line) => JSON.parse(line))
        : [].concat(response.body || []);

const records = isReportIndex ? [] : parseRecords();

// Optional user filter: the picker value is an array of objects whose rawId may itself be a one-element array.
// Only an empty selection means every user; a selection whose ids can't be read matches nobody.
const selectedUsers = [].concat(context.config?.user || []);
const selectedUserIds = new Set(
    selectedUsers
        .map((u) => String([].concat(u?.rawId ?? u?.sourceId ?? [])[0] ?? ''))
        .filter(Boolean)
);

// One row per record, client, model and selection mode. Records can be per user per day and spread across
// several files (one page each), so rows are not folded per user here; tiles group by user instead.
result = records
    .filter((r) => r.user_id != null)
    .filter((r) => !selectedUsers.length || selectedUserIds.has(String(r.user_id)))
    .flatMap((r) =>
        (r.totals_by_client || []).flatMap((c) =>
            (c.totals_by_model || []).map((m) => {
                const promptTokens = m.token_usage?.prompt_tokens_sum || 0;
                const outputTokens = m.token_usage?.output_tokens_sum || 0;

                return {
                    userId: String(r.user_id),
                    login: r.user_login ?? null,
                    day: r.day ?? null,
                    client: c.client ?? null,
                    model: m.model ?? null,
                    selectionMode: m.model_selection_mode ?? null,
                    requests: m.request_count || 0,
                    promptTokens,
                    outputTokens,
                    totalTokens: promptTokens + outputTokens
                };
            })
        )
    );
