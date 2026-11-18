const first = (ids, prefix) => (ids || []).find((id) => typeof id === 'string' && id.startsWith(prefix)) || null;

result = (data.Items || []).map((e) => ({
    Id: e.Id,
    Message: e.Message,
    Category: e.Category,
    Username: e.Username,
    IsService: e.IsService,
    Occurred: e.Occurred,
    IpAddress: e.IpAddress || null,
    ProjectId: first(e.RelatedDocumentIds, 'Projects-'),
    EnvironmentId: first(e.RelatedDocumentIds, 'Environments-'),
    SpaceId: e.SpaceId
}));
