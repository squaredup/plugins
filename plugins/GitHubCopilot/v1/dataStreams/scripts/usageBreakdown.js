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

const selected = context.config?.breakdown;
const breakdown = (selected && typeof selected === 'object' ? selected.value : selected) || 'feature';
const sources = {
    feature: 'totals_by_feature',
    ide: 'totals_by_ide',
    language: 'totals_by_language_feature',
    model: 'totals_by_model_feature'
};
const source = sources[breakdown] || sources.feature;

result = records
    .flatMap((r) => r.day_totals || [r])
    .filter((d) => d.day)
    .flatMap((d) =>
        (d[source] || []).map((b) => ({
            day: d.day,
            ...(b.feature !== undefined && { feature: b.feature }),
            ...(b.ide !== undefined && { ide: b.ide }),
            ...(b.language !== undefined && { language: b.language }),
            ...(b.model !== undefined && { model: b.model }),
            interactions: b.user_initiated_interaction_count ?? null,
            codeGenerations: b.code_generation_activity_count ?? null,
            codeAcceptances: b.code_acceptance_activity_count ?? null,
            locSuggestedToAdd: b.loc_suggested_to_add_sum ?? null,
            locSuggestedToDelete: b.loc_suggested_to_delete_sum ?? null,
            locAdded: b.loc_added_sum ?? null,
            locDeleted: b.loc_deleted_sum ?? null
        }))
    );
