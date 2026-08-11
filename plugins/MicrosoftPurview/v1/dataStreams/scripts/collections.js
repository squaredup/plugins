result = (data?.value || []).map(c => ({
    name: c.name || '',
    collectionName: c.name || '',
    friendlyName: c.friendlyName || '',
    displayName: c.friendlyName || c.name || '',
    description: c.description || '',
    parentCollectionName: c.parentCollection?.referenceName || '',
    collectionProvisioningState: c.collectionProvisioningState || '',
    sourceType: 'Purview Collection',
}));
