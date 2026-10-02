// Flatten each source's differently shaped rows into one row per model x benchmark
const aaIndices = [
    ['intelligence_index', 'Intelligence Index'],
    ['coding_index', 'Coding Index'],
    ['agentic_index', 'Agentic Index'],
];

const rows = [];

for (const r of data?.data ?? []) {
    const base = {
        source: r.source,
        model: r.model_permaslug,
        modelName: r.display_name,
    };

    if (r.source === 'artificial-analysis') {
        for (const [key, benchmark] of aaIndices) {
            if (r[key] == null) continue;

            rows.push({ ...base, benchmark, metric: 'index', score: r[key] });
        }
    } else if (r.source === 'design-arena') {
        if (r.elo == null) continue;

        rows.push({
            ...base,
            benchmark: r.category,
            metric: 'elo',
            score: r.elo,
            winRate: r.win_rate,
            tasks: r.tournament_stats?.total,
            avgDurationMs: r.avg_generation_time_ms,
        });
    } else if (r.source === 'openrouter') {
        // Search benchmarks report primary_score instead of accuracy
        const score = r.accuracy ?? r.primary_score;
        if (score == null) continue;

        rows.push({
            ...base,
            benchmark: r.benchmark_type,
            metric: r.accuracy != null ? 'accuracy' : r.primary_metric,
            score,
            tasks: r.total_tasks,
            avgCostPerTask: r.avg_cost_per_task,
            avgDurationMs: r.avg_latency_per_task_ms,
            lastRun: r.last_run_timestamp,
        });
    }
}

result = rows;
