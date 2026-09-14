result = (data.items || []).map((item) => {
    const desiredNumberScheduled =
        (item.status && item.status.desiredNumberScheduled) || 0;
    const numberReady = (item.status && item.status.numberReady) || 0;

    // No eligible nodes means zero scheduled pods is the intended state, not a failure.
    const daemonSetHealth =
        desiredNumberScheduled === 0
            ? "success"
            : numberReady === desiredNumberScheduled
              ? "success"
              : numberReady < desiredNumberScheduled
                ? "error"
                : "unknown";

    return {
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        desiredNumberScheduled,
        numberReady,
        daemonSetHealth,
    };
});
