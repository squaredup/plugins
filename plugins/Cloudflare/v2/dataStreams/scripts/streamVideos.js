// Stream nests the video name under meta and the processing state under status,
// which expandInnerObjects cannot reach through a script-free config, so both
// are flattened here alongside the account id from the scoped object.
const accountId =
    (context.objects && context.objects[0] && context.objects[0].rawId) || "";

result = ((data && data.result) || []).map((v) => {
    const meta = v.meta || {};
    const status = v.status || {};
    return {
        sourceId: v.uid,
        videoName: meta.name || v.uid,
        accountId: accountId,
        statusState: status.state || "",
        duration: typeof v.duration === "number" ? v.duration : null,
        size: typeof v.size === "number" ? v.size : null,
        readyToStream: Boolean(v.readyToStream),
        createdOn: v.created,
        preview: v.preview || "",
    };
});
