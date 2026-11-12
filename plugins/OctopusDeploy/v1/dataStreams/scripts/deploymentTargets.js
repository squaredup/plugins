result = (data.Items || []).map((m) => {
    // Only listening and polling Tentacles report a Tentacle version; SSH, cloud and Kubernetes targets don't.
    const tentacle = m.Endpoint && m.Endpoint.TentacleVersionDetails;
    return {
        Id: m.Id,
        Name: m.Name,
        HealthStatus: m.HealthStatus,
        StatusSummary: m.StatusSummary,
        IsDisabled: m.IsDisabled,
        EnvironmentIds: m.EnvironmentIds || [],
        TenantIds: m.TenantIds || [],
        Roles: m.Roles || [],
        CommunicationStyle: m.Endpoint ? m.Endpoint.CommunicationStyle : null,
        OperatingSystem: m.OperatingSystem || null,
        ShellName: m.ShellName || null,
        TentacleVersion: tentacle ? tentacle.Version : null,
        TentacleUpgrade: !tentacle ? null : tentacle.UpgradeRequired ? 'Required' : tentacle.UpgradeSuggested ? 'Suggested' : 'Up to date',
        HasLatestCalamari: m.HasLatestCalamari,
        SpaceId: m.SpaceId
    };
});
