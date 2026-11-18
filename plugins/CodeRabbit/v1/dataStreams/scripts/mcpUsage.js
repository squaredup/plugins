// Flatten each pull request into one row per MCP server used.
result = (data.data || []).flatMap((pr) =>
    (pr.servers || []).map((server) => {
        const tools = server.tools || [];
        return {
            prUrl: pr.pr_url,
            // The url shape's label can't read computed columns, so the number is derived here
            prNumber: Number(String(pr.pr_url || "").split("/").pop()) || null,
            merged_at: pr.merged_at,
            serverName: server.server_name,
            insightCount: server.insight_count,
            toolCallCount: tools.reduce((sum, t) => sum + (t.call_count || 0), 0),
            tools: tools.map((t) => t.tool_name).join(", "),
            repository_id: pr.repository_id,
            author_id: pr.author_id,
        };
    }),
);
