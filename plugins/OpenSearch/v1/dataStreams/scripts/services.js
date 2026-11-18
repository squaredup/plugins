// The request groups logs by service, with warning (severity 13-16) and error
// (severity 17+, OpenTelemetry ERROR and FATAL) sub-counts nested in each bucket,
// plus the resource attributes a service can report several values for.
const buckets = (data && data.aggregations && data.aggregations.services && data.aggregations.services.buckets) || [];
const keys = (agg) => ((agg && agg.buckets) || []).map((x) => String(x.key));

result = buckets.map((b) => {
    const errors = b.errors ? b.errors.doc_count : 0;
    return {
        service: String(b.key),
        logs: b.doc_count,
        warnings: b.warnings ? b.warnings.doc_count : 0,
        errors,
        errorRate: b.doc_count ? (100 * errors) / b.doc_count : 0,
        // deployment.environment was renamed deployment.environment.name in newer semantic conventions
        environments: [...new Set([...keys(b.environmentName), ...keys(b.environment)])],
        k8sNamespaces: keys(b.k8sNamespaces),
        k8sDeployments: keys(b.k8sDeployments)
    };
});
