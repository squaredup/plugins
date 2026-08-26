const store = context.objects[0].rawId;
const groups = (data && data.data) || [];

result = groups.map(function(g) {
    return {
        groupId: store + '/' + g['backup-type'] + '/' + g['backup-id'],
        name: g['backup-type'] + '/' + g['backup-id'],
        store: store,
        backupType: g['backup-type'],
        backupId: g['backup-id'],
        owner: g.owner || null,
        lastBackup: g['last-backup'] != null ? g['last-backup'] * 1000 : null,
        backupCount: g['backup-count'] || 0
    };
});
