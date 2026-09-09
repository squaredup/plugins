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
        // Cloudflare reports -1 while a video is still being processed and its
        // duration is not yet known; that is absent data, not a real length.
        duration:
            typeof v.duration === "number" && v.duration >= 0 ? v.duration : null,
        size: typeof v.size === "number" ? v.size : null,
        readyToStream: Boolean(v.readyToStream),
        createdOn: v.created,
        preview: v.preview || "",
    };
});
