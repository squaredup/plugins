const stripHtml = s => (s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || null;

const domains = data?.value || [];

result = domains.map(d => ({
    id: d.id || '',
    name: d.name || '',
    description: stripHtml(d.description),
    type: d.type || '',
    status: d.status || '',
    parentId: d.parentId || null,
    isRestricted: d.isRestricted ?? null,
    createdAt: d.systemData?.createdAt || null,
    lastModifiedAt: d.systemData?.lastModifiedAt || null,
    sourceType: 'Purview Governance Domain',
}));
