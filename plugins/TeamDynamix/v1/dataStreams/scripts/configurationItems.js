// Serves double duty: this stream backs both the configurationItems import step and CI tiles.
//
// Projection matters more here than anywhere else. ConfigurationItemSearch has no MaxResults
// field at all — unlike ticket and asset search there is no way to cap the result set from the
// request side — so the only defence against overrunning the ~6MB stream response cap on a
// large CMDB is to keep each row small.
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

result = (data || []).map((item) => ({
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
