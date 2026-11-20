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

result = records
    .flatMap((r) => r.day_totals || [r])
    .filter((d) => d.day)
    .flatMap((d) =>
        (d.totals_by_client || []).flatMap((c) =>
            (c.totals_by_model || []).map((m) => ({
                day: d.day,
                client: c.client,
                model: m.model,
                selectionMode: m.model_selection_mode,
                requests: m.request_count ?? 0,
                promptTokens: m.token_usage?.prompt_tokens_sum ?? 0,
                outputTokens: m.token_usage?.output_tokens_sum ?? 0,
                totalTokens: (m.token_usage?.prompt_tokens_sum ?? 0) + (m.token_usage?.output_tokens_sum ?? 0)
            }))
        )
    );
