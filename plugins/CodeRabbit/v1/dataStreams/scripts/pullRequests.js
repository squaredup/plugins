// Flatten nested comment counts and trim the day-granular API window to a 24 hour timeframe.
const start = new Date(context.timeframe.start);
const end = new Date(context.timeframe.end);
const trim = context.timeframe.enum === 'last24hours';

result = (data.data || [])
    .filter((pr) => {
        // Only merged PRs expose a finalized time; closed PRs stay at day granularity
        if (!trim || !pr.merged_at) return true;
        const t = new Date(pr.merged_at);
        return t >= start && t <= end;
    })
    .map(({ coderabbit_comments: comments = {}, ...pr }) => {
        const total = comments.total || {};
        const severity = comments.severity || {};
        const category = comments.category || {};
        return {
            ...pr,
            prUrl: pr.pr_url,
            // The url shape's label can't read computed columns, so the number is derived here
            prNumber: Number(String(pr.pr_url || '').split('/').pop()) || null,
            commentsPosted: total.posted ?? 0,
            commentsAccepted: total.accepted ?? 0,
            criticalPosted: severity.critical?.posted ?? 0,
            majorPosted: severity.major?.posted ?? 0,
            // The reviews endpoint returns upper-case category keys, unlike its docs
            securityPosted: (category.SECURITY_AND_PRIVACY ?? category.security_and_privacy)?.posted ?? 0,
        };
    });
