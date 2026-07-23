const defs = data?.classificationDefs || [];

result = defs
    .filter(c => !c.name?.startsWith('MICROSOFT.'))
    .map(c => ({
        name: c.name || '',
        description: c.description || '',
        createdBy: c.createdBy || '',
        createTime: c.createTime ? new Date(c.createTime).toISOString() : null,
        updatedBy: c.updatedBy || '',
        updateTime: c.updateTime ? new Date(c.updateTime).toISOString() : null,
    }));
