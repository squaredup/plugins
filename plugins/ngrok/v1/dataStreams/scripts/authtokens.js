// Return only descriptive fields; never pass through the token or ACL rules.
result = (data?.credentials || []).map((c) => ({
    id: c.id,
    description: c.description || c.id,
    hasAcl: Array.isArray(c.acl) && c.acl.length > 0,
    ownerId: c.owner_id || null,
    created_at: c.created_at,
}));
