// Only non-sensitive target details are returned: event destination targets
// can embed credentials (e.g. Datadog API keys, Azure client secrets).
const targetNames = {
    datadog: 'Datadog',
    cloudwatch_logs: 'Amazon CloudWatch Logs',
    kinesis: 'Amazon Kinesis',
    firehose: 'Amazon Data Firehose',
    azure_logs_ingestion: 'Azure Monitor Logs',
};

const locationOf = (type, target) => {
    switch (type) {
        case 'datadog':
            return target.ddsite || target.intake_host || null;
        case 'cloudwatch_logs':
            return target.log_group_arn || null;
        case 'kinesis':
        case 'firehose':
            return target.stream_arn || target.delivery_stream_arn || null;
        case 'azure_logs_ingestion':
            return target.logs_ingestion_uri || null;
        default:
            return null;
    }
};

result = (data?.event_destinations || []).map((d) => {
    const target = d.target || {};
    const type = Object.keys(target).find((k) => target[k]);
    return {
        id: d.id,
        description: d.description || d.id,
        targetType: targetNames[type] || type || null,
        location: type ? locationOf(type, target[type]) : null,
        format: d.format || null,
        created_at: d.created_at,
    };
});
