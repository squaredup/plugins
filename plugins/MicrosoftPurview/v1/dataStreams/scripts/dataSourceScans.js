const scans = data?.value || [];

result = scans.map((scan) => {
    const props = scan.properties || {};

    return {
        id: (scan.dataSourceName || '') + '/' + (scan.name || ''),
        name: scan.name || '',
        dataSourceName: scan.dataSourceName || '',
        kind: scan.kind || '',
        collection: props.collection?.referenceName || '',
        creationType: scan.creationType || '',
        'properties.scanRulesetName': props.scanRulesetName || '',
        'properties.scanRulesetType': props.scanRulesetType || '',
        sourceType: 'Purview Scan',
    };
});
