// TenantTags is an array, which shapes to "[object Array]", so join it into a display string.
result = (data.Items || []).map((t) => ({
    Id: t.Id,
    Name: t.Name,
    Description: t.Description,
    IsDisabled: t.IsDisabled,
    TenantTags: Array.isArray(t.TenantTags) ? t.TenantTags.join(', ') : '',
    SpaceId: t.SpaceId
}));
