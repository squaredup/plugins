result = (data.items || []).map((item) => {
    const rules = (item.spec && item.spec.rules) || [];

    const hosts = rules
        .map((rule) => rule.host)
        .filter(Boolean)
        .join(",");

    const defaultBackendService =
        item.spec &&
        item.spec.defaultBackend &&
        item.spec.defaultBackend.service &&
        item.spec.defaultBackend.service.name;

    const firstRulePath =
        rules[0] &&
        rules[0].http &&
        rules[0].http.paths &&
        rules[0].http.paths[0];

    const firstRuleService =
        firstRulePath &&
        firstRulePath.backend &&
        firstRulePath.backend.service &&
        firstRulePath.backend.service.name;

    // Only the default backend or the first rule's first path is exposed —
    // later rules/paths routing to other services aren't represented.
    const primaryBackendServiceName =
        defaultBackendService || firstRuleService || undefined;

    return {
        uid: item.metadata.uid,
        name: item.metadata.name,
        namespace: item.metadata.namespace,
        ingressClassName:
            (item.spec && item.spec.ingressClassName) || undefined,
        hosts: hosts,
        primaryBackendServiceName: primaryBackendServiceName,
    };
});
