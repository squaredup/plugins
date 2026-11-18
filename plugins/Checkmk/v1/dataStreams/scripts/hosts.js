// Livestatus has no folder column. The host's folder is only recorded as the path of the
// hosts.mk file that defines it, e.g. /wato/linux/web/hosts.mk -> /linux/web.
const folderOf = (filename) => {
    if (!filename || filename.indexOf('/wato/') !== 0) {
        return null;
    }
    const path = filename.slice('/wato'.length).split('/').slice(0, -1).join('/');
    return path || '/';
};

result = ((data && data.value) || []).map((h) => {
    const e = h.extensions || {};
    return {
        hostName: e.name || h.id,
        alias: e.alias || null,
        address: e.address || null,
        folder: folderOf(e.filename),
        hostGroups: e.groups || [],
        hostLabels: Object.keys(e.labels || {}).map((k) => `${k}:${e.labels[k]}`),
        serviceNames: e.services || []
    };
});
