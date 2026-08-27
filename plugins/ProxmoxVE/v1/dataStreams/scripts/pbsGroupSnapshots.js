const snapshots = (data && data.data) || [];
const backupGroup = (context.objects[0] && context.objects[0].rawId) || null;

result = snapshots.map(function(s) {
    return {
        time: s['backup-time'] != null ? s['backup-time'] * 1000 : null,
        size: s.size || 0,
        protected: !!s.protected,
        verificationState: (s.verification && s.verification.state) || null,
        comment: s.comment || null,
        backupGroup: backupGroup
    };
});
