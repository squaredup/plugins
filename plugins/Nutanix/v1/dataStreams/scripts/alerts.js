// Runs once per page, so every rule here looks at a single alert.
const config = context.config || {};
const showAll = config.status === 'all';

// The API can't filter on creation time, so "All" keeps alerts raised inside the timeframe here.
const start = context.timeframe && context.timeframe.start ? new Date(context.timeframe.start).getTime() : null;
const end = context.timeframe && context.timeframe.end ? new Date(context.timeframe.end).getTime() : null;
const inTimeframe = (time) => {
    const t = new Date(time).getTime();
    return (start === null || t >= start) && (end === null || t <= end);
};

// Selected objects arrive as an array, each rawId wrapped in a single-element array. An alert
// matches when it was raised on, affects, or belongs to the cluster of any selected object.
const selectedIds = new Set((config.entity || []).map((o) => [].concat(o.rawId)[0]).filter(Boolean));
const matchesSelection = (alert) => {
    if (selectedIds.size === 0) {
        return true;
    }
    const ids = [
        alert.clusterUUID,
        alert.originatingClusterUUID,
        alert.sourceEntity && alert.sourceEntity.extId,
        ...(alert.affectedEntities || []).map((entity) => entity.extId)
    ];
    return ids.some((id) => id && selectedIds.has(id));
};

const paramValue = (value) => {
    if (!value) {
        return '';
    }
    for (const key of ['stringValue', 'intValue', 'boolValue', 'doubleValue']) {
        if (value[key] !== undefined) {
            return String(value[key]);
        }
    }
    return '';
};

// Titles and messages carry {placeholders} that are filled from the alert's own parameters.
const fill = (text, parameters) => {
    if (!text) {
        return text || null;
    }
    const values = {};
    for (const parameter of parameters || []) {
        values[parameter.paramName] = paramValue(parameter.paramValue);
    }
    return text.replace(/[{]([A-Za-z0-9_]+)[}]/g, (match, name) => (values[name] !== undefined ? values[name] : match));
};

const statusOf = (alert) => {
    if (alert.isResolved) {
        return 'Resolved';
    }
    return alert.isAcknowledged ? 'Acknowledged' : 'Open';
};

result = ((data && data.data) || [])
    .filter((alert) => (showAll ? inTimeframe(alert.creationTime) : !alert.isResolved))
    .filter(matchesSelection)
    .map((alert) => {
        const source = alert.sourceEntity || {};
        const rootCause = (alert.rootCauseAnalysis || [])[0] || {};
        return {
            extId: alert.extId,
            title: fill(alert.title, alert.parameters),
            severity: alert.severity || null,
            status: statusOf(alert),
            message: fill(alert.message, alert.parameters),
            sourceEntityType: source.type || null,
            sourceEntityName: source.name || null,
            sourceEntityExtId: source.extId || null,
            clusterExtId: alert.clusterUUID || alert.originatingClusterUUID || null,
            clusterName: null,
            impactTypes: alert.impactTypes || [],
            classifications: alert.classifications || [],
            possibleCause: rootCause.cause || null,
            resolution: rootCause.resolution || null,
            creationTime: alert.creationTime || null,
            lastUpdatedTime: alert.lastUpdatedTime || null,
            resolvedTime: alert.resolvedTime || null,
            isAcknowledged: Boolean(alert.isAcknowledged),
            isResolved: Boolean(alert.isResolved),
            alertType: alert.alertType || null,
            serviceName: alert.serviceName || null
        };
    });
