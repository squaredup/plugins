const tasks = (data && data.data) || [];

result = tasks.map(function(t) {
    const outcome = t.status == null ? 'running' : (t.status === 'OK' ? 'success' : 'error');
    return {
        upid: t.upid,
        startTime: t.starttime != null ? new Date(t.starttime * 1000).toISOString() : null,
        endTime: t.endtime != null ? new Date(t.endtime * 1000).toISOString() : null,
        workerType: t.worker_type,
        workerId: t.worker_id || null,
        status: t.status || null,
        outcome: outcome,
        user: t.user
    };
});
