// Array fields shape to "[object Array]", so join them into display strings here.
const list = (arr) => (Array.isArray(arr) ? arr.join(', ') : arr || '');

result = (data.Items || []).map((m) => ({
    Id: m.Id,
    Name: m.Name,
    HealthStatus: m.HealthStatus,
    StatusSummary: m.StatusSummary,
    IsDisabled: m.IsDisabled,
    Roles: list(m.Roles),
    EnvironmentIds: list(m.EnvironmentIds),
    TenantIds: list(m.TenantIds),
    CommunicationStyle: m.Endpoint ? m.Endpoint.CommunicationStyle : null,
    OperatingSystem: m.OperatingSystem || null,
    ShellName: m.ShellName || null,
    SpaceId: m.SpaceId
}));
