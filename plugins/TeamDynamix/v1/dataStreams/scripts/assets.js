// Serves double duty: this stream backs both the assets import step and asset tiles.
//
// Projected rather than passed through for the same reason as tickets — an Asset carries
// Attachments and Attributes arrays, and the asset search is unpaged, so a large estate in
// one response can overrun the ~6MB stream response cap.
const customAttributeColumns = (asset) => {
    const columns = {};
    for (const attribute of asset.Attributes || []) {
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

result = (data || []).map((asset) => ({
    // Asset IDs are only unique within an application, so the graph id has to carry the app
    // too — two asset apps in the same tenant can both have an asset 1041.
    sourceId: `${asset.AppID}-${asset.ID}`,
    assetId: String(asset.ID),
    name: asset.Name || asset.Tag || asset.SerialNumber || `Asset ${asset.ID}`,
    link: webBaseUrl
        ? `${webBaseUrl}/TDNext/Apps/${asset.AppID}/Assets/AssetDet?AssetID=${asset.ID}`
        : asset.Uri || "",
    statusName: asset.StatusName || "",
    tag: asset.Tag || "",
    serialNumber: asset.SerialNumber || "",
    manufacturerName: asset.ManufacturerName || "",
    productModelName: asset.ProductModelName || "",
    supplierName: asset.SupplierName || "",
    locationName: asset.LocationName || "",
    locationRoomName: asset.LocationRoomName || "",
    owningCustomerName: asset.OwningCustomerName || "",
    owningDepartmentName: asset.OwningDepartmentName || "",
    requestingCustomerName: asset.RequestingCustomerName || "",
    purchaseCost: typeof asset.PurchaseCost === "number" ? asset.PurchaseCost : null,
    acquisitionDate: asset.AcquisitionDate || null,
    expectedReplacementDate: asset.ExpectedReplacementDate || null,
    createdDate: asset.CreatedDate || null,
    modifiedDate: asset.ModifiedDate || null,
    parentName: asset.ParentName || "",
    externalId: asset.ExternalID || "",
    configurationItemId: asset.ConfigurationItemID ? String(asset.ConfigurationItemID) : "",
    appId: String(asset.AppID ?? ""),
    sourceType: "TeamDynamix Asset",
    ...customAttributeColumns(asset)
}));
