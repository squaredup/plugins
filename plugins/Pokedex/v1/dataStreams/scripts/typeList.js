const results = data?.results || [];

result = results.map(entry => {
    const id = entry.url.split('/').filter(Boolean).pop();
    const name = entry.name.charAt(0).toUpperCase() + entry.name.slice(1);
    return {
        sourceId: id,
        name,
        typeId: id
    };
});
