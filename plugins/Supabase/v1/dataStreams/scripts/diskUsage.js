const project = context.objects[0];
const m = (data && data.metrics) || {};
const used = typeof m.fs_used_bytes === 'number' ? m.fs_used_bytes : null;
const size = typeof m.fs_size_bytes === 'number' ? m.fs_size_bytes : null;
const avail = typeof m.fs_avail_bytes === 'number' ? m.fs_avail_bytes : null;

result = [{
    usedBytes: used,
    availableBytes: avail,
    sizeBytes: size,
    usedPercent: used !== null && size ? (used / size) * 100 : null,
    measuredAt: data && data.timestamp ? data.timestamp : null,
    projectRef: project.rawId,
    projectName: project.name
}];
