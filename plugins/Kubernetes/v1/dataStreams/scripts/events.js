result = (data.items || []).map((item) => {
    const involvedObject = item.involvedObject || {};

    return {
        uid: item.metadata.uid,
        reason: item.reason,
        type: item.type,
        message: item.message,
        lastTimestamp: item.lastTimestamp,
        involvedObjectUid: involvedObject.uid,
        involvedObjectKind: involvedObject.kind,
        involvedObjectName: involvedObject.name,
    };
});
