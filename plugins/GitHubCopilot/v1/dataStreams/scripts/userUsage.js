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

const FEATURES = [
    ['used_agent', 'Agent'],
    ['used_chat', 'Chat'],
    ['used_cli', 'CLI'],
    ['used_copilot_app', 'Copilot app'],
    ['used_copilot_coding_agent', 'Coding agent'],
    ['used_copilot_cloud_agent', 'Cloud agent'],
    ['used_copilot_code_review_active', 'Code review'],
    ['used_copilot_code_review_passive', 'Code review'],
    ['used_vscode_agent', 'VS Code agent']
];

// One row per record. The report can hold a record per user per day and be split across several files,
// and each file is a separate page, so folding per user here would be wrong; tiles group by user instead.
result = records
    .filter((r) => r.user_id != null)
    .filter((r) => !selectedUsers.length || selectedUserIds.has(String(r.user_id)))
    .map((r) => {
        const clients = r.totals_by_client || [];
        const ides = (r.totals_by_ide || [])
            .map((i) => [i.ide, (i.user_initiated_interaction_count || 0) + (i.code_generation_activity_count || 0)])
            .sort((a, b) => b[1] - a[1]);

        return {
            userId: String(r.user_id),
            login: r.user_login ?? null,
            day: r.day ?? null,
            aiCreditsUsed: r.ai_credits_used ?? null,
            interactions: r.user_initiated_interaction_count ?? null,
            codeGenerations: r.code_generation_activity_count ?? null,
            codeAcceptances: r.code_acceptance_activity_count ?? null,
            locSuggestedToAdd: r.loc_suggested_to_add_sum ?? null,
            locAdded: r.loc_added_sum ?? null,
            locDeleted: r.loc_deleted_sum ?? null,
            modelRequests: clients.reduce((sum, c) => sum + (c.request_count || 0), 0),
            promptTokens: clients.reduce((sum, c) => sum + (c.token_usage?.prompt_tokens_sum || 0), 0),
            outputTokens: clients.reduce((sum, c) => sum + (c.token_usage?.output_tokens_sum || 0), 0),
            featuresUsed: [...new Set(FEATURES.filter(([f]) => r[f]).map(([, name]) => name))],
            primaryIde: ides.length && ides[0][1] > 0 ? ides[0][0] : null,
            adoptionPhase: r.ai_adoption_phase?.phase ?? null,
            adoptionPhaseNumber: r.ai_adoption_phase?.phase_number ?? null
        };
    });
