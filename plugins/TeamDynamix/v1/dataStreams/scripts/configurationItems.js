// Serves double duty: this stream backs both the configurationItems import step and CI tiles.
//
// ConfigurationItemSearch has no MaxResults field and no paging (confirmed against the API:
// the only paged CMDB endpoint is cmdb/searches/{searchId}/results, which needs a saved search
// the customer would have to pre-create in TeamDynamix — not viable for a zero-touch setup).
// So a large, unfiltered CMDB can return more rows than the ~6MB stream response cap allows.
// Two defences: keep each row small (the projection below), and cap the row count actually
// returned rather than trust the upstream call to stay small. The IsActive filter set by the
// stream's own config already narrows the common case before this ever runs.
// BackingItemType is an integer enum on the wire. A CI can be backed by a real asset or
// service record elsewhere in TeamDynamix, which is worth showing — but not as "27".
const BACKING_ITEM_TYPE_NAMES = {
    27: "Asset",
    47: "Service",
    63: "Configuration Item"
};

const customAttributeColumns = (item) => {
    const columns = {};
    for (const attribute of item.Attributes || []) {
        if (!attribute || !attribute.Name) continue;
        columns[`attr.${attribute.Name}`] =
            attribute.ValueText ?? (attribute.Value === "" ? null : attribute.Value ?? null);
    }
    return columns;
};

const webBaseUrl = String(context?.dataSources?.[0]?.baseUrl || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(SB)?TDWebApi$/i, "");

const rows = (data || []).map((item) => ({
    // As with assets, CI IDs are only unique within an application.
    sourceId: `${item.AppID}-${item.ID}`,
    configurationItemId: String(item.ID),
    name: item.Name || `Configuration Item ${item.ID}`,
    link: webBaseUrl
        ? `${webBaseUrl}/TDNext/Apps/${item.AppID}/Assets/CIDet?CID=${item.ID}`
        : item.Uri || "",
    typeName: item.TypeName || "",
    isActive: Boolean(item.IsActive),
    ownerFullName: item.OwnerFullName || "",
    owningDepartmentName: item.OwningDepartmentName || "",
    owningGroupName: item.OwningGroupName || "",
    locationName: item.LocationName || "",
    maintenanceScheduleName: item.MaintenanceScheduleName || "",
    backingItemType: BACKING_ITEM_TYPE_NAMES[item.BackingItemType] || "",
    isSystemMaintained: Boolean(item.IsSystemMaintained),
    externalSourceName: item.ExternalSourceName || "",
    externalId: item.ExternalID || "",
    // Note the Utc suffix: configuration items use CreatedDateUtc / ModifiedDateUtc where
    // tickets and assets use CreatedDate / ModifiedDate.
    createdDate: item.CreatedDateUtc || null,
    modifiedDate: item.ModifiedDateUtc || null,
    appId: String(item.AppID ?? ""),
    sourceType: "TeamDynamix Configuration Item",
    ...customAttributeColumns(item)
}));

// The API gave us no way to ask for fewer rows, so the cap is enforced here instead, using
// the same "Maximum records per request" plugin setting the ticket/asset/time streams pass
// to the API directly. Sort so a forced cut drops the stalest records first rather than an
// arbitrary API-returned order.
const maxRecords = Number(context?.dataSources?.[0]?.maxRecords) || 2000;
result = rows
    .sort((a, b) => (b.modifiedDate || "").localeCompare(a.modifiedDate || ""))
    .slice(0, maxRecords);
