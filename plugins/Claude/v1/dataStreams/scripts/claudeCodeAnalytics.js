result = (data.data || []).map((d) => {
    const models = d.model_breakdown || [];
    return {
        date: d.date,
        user: d.actor?.email_address || d.actor?.api_key_name || 'unknown',
        actor_type: d.actor?.type,
        customer_type: d.customer_type,
        terminal_type: d.terminal_type,
        sessions: d.core_metrics?.num_sessions || 0,
        lines_added: d.core_metrics?.lines_of_code?.added || 0,
        lines_removed: d.core_metrics?.lines_of_code?.removed || 0,
        commits: d.core_metrics?.commits_by_claude_code || 0,
        prs: d.core_metrics?.pull_requests_by_claude_code || 0,
        edit_accepted: d.tool_actions?.edit_tool?.accepted || 0,
        edit_rejected: d.tool_actions?.edit_tool?.rejected || 0,
        input_tokens: models.reduce((s, m) => s + (m.tokens?.input || 0), 0),
        output_tokens: models.reduce((s, m) => s + (m.tokens?.output || 0), 0),
        estimated_cost_usd:
            models.reduce((s, m) => s + (m.estimated_cost?.amount || 0), 0) / 100,
    };
});
