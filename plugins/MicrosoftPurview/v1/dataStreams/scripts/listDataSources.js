result = (data?.value || []).map(item => {
    const props = item.properties || {};
    const subscriptionId = props.subscriptionId || '';
    return {
        name: item.name || '',
        kind: item.kind || '',
        collection: props.collection?.referenceName || '',
        resourceGroup: props.resourceGroup || '',
        subscriptionId,
        subscriptionUrl: subscriptionId
            ? 'https://portal.azure.com/#resource/subscriptions/' + subscriptionId
            : '',
        createdAt: props.createdAt || null,
        creationType: item.creationType || '',
        sourceType: 'Purview Data Source',
    };
});
