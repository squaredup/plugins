// Flattens the star metric and dataset objects into plain columns
result = (data.evaluation_test_cases || []).map((t) => ({
    id: t.test_case_uuid,
    name: t.name,
    description: t.description || null,
    totalRuns: t.total_runs,
    latestVersionRuns: t.latest_version_number_of_runs,
    version: t.version,
    starMetric: t.star_metric?.name || null,
    successThreshold: t.star_metric?.success_threshold ?? null,
    successThresholdPct: t.star_metric?.success_threshold_pct ?? null,
    datasetName: t.dataset_name || t.dataset?.dataset_name || null,
    datasetRows: t.dataset?.row_count ?? null,
    createdAt: t.created_at,
    updatedAt: t.updated_at
}));
