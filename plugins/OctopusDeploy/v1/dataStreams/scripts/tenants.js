result = (data.Items || []).map((t) => ({
    Id: t.Id,
    Name: t.Name,
    Description: t.Description,
    IsDisabled: t.IsDisabled,
    TenantTags: Array.isArray(t.TenantTags) ? t.TenantTags : [],
    SpaceId: t.SpaceId
}));
