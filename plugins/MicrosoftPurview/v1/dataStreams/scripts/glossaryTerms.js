const stripHtml = s => (s || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() || null;

const terms = data?.value || [];

result = terms.map(term => ({
    id: term.id || '',
    name: term.name || '',
    description: stripHtml(term.description),
    status: term.status || '',
    acronyms: (term.acronyms || []).join(', ') || null,
    parentId: term.parentId || null,
    createdAt: term.systemData?.createdAt || null,
    lastModifiedAt: term.systemData?.lastModifiedAt || null,
}));
