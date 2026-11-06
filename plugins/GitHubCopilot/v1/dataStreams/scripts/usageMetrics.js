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

const sumTokens = (clients, field) => (clients || []).reduce((sum, c) => sum + (c.token_usage?.[field] || 0), 0);

result = records
    .flatMap((r) => r.day_totals || [r])
    .filter((d) => d.day)
    .map((d) => ({
        day: d.day,
        dailyActiveUsers: d.daily_active_users ?? null,
        weeklyActiveUsers: d.weekly_active_users ?? null,
        monthlyActiveUsers: d.monthly_active_users ?? null,
        monthlyActiveChatUsers: d.monthly_active_chat_users ?? null,
        monthlyActiveAgentUsers: d.monthly_active_agent_users ?? null,
        dailyActiveCliUsers: d.daily_active_cli_users ?? null,
        dailyActiveCloudAgentUsers: d.daily_active_copilot_cloud_agent_users ?? null,
        dailyActiveCodeReviewUsers: d.daily_active_copilot_code_review_users ?? null,
        interactions: d.user_initiated_interaction_count ?? null,
        codeGenerations: d.code_generation_activity_count ?? null,
        codeAcceptances: d.code_acceptance_activity_count ?? null,
        locSuggestedToAdd: d.loc_suggested_to_add_sum ?? null,
        locSuggestedToDelete: d.loc_suggested_to_delete_sum ?? null,
        locAdded: d.loc_added_sum ?? null,
        locDeleted: d.loc_deleted_sum ?? null,
        modelRequests: (d.totals_by_client || []).reduce((sum, c) => sum + (c.request_count || 0), 0),
        promptTokens: sumTokens(d.totals_by_client, 'prompt_tokens_sum'),
        outputTokens: sumTokens(d.totals_by_client, 'output_tokens_sum'),
        pullRequestsCreated: d.pull_requests?.total_created ?? null,
        pullRequestsCreatedByCopilot: d.pull_requests?.total_created_by_copilot ?? null,
        pullRequestsMerged: d.pull_requests?.total_merged ?? null,
        pullRequestsReviewedByCopilot: d.pull_requests?.total_reviewed_by_copilot ?? null,
        medianMinutesToMerge: d.pull_requests?.median_minutes_to_merge ?? null
    }));
