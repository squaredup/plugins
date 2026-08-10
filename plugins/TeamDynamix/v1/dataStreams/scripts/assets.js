// Serves double duty: this stream backs both the assets import step and asset tiles.
//
// Projected rather than passed through for the same reason as tickets — the asset search is
// unpaged, so a large estate in one response can overrun the ~6MB stream response cap.
//
// No custom-attribute columns: the API's own description for this endpoint says Attachments
// and Attributes are never included in search results — only loading an asset individually
// returns them, which this stream doesn't do.

// A sandbox Web API address (/SBTDWebApi) needs the matching sandbox web app (/SBTDNext) —
// otherwise every sandbox asset link points at the production app instead. SBTDNext is
// inferred from the same SB-prefix convention as SBTDWebApi; the API spec has no web UI
// paths to confirm it against.
const rawBaseUrl = String(context?.dataSources?.[0]?.baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
const isSandbox = /\/SBTDWebApi$/i.test(rawBaseUrl);
const webBaseUrl = rawBaseUrl.replace(/\/(SB)?TDWebApi$/i, "");
const nextApp = isSandbox ? "SBTDNext" : "TDNext";

result = (data || []).map((asset) => ({
    // Asset IDs are only unique within an application, so the graph id has to carry the app
    // too — two asset apps in the same tenant can both have an asset 1041.
    sourceId: `${asset.AppID}-${asset.ID}`,
    assetId: String(asset.ID),
    name: asset.Name || asset.Tag || asset.SerialNumber || `Asset ${asset.ID}`,
    link: webBaseUrl
        ? `${webBaseUrl}/${nextApp}/Apps/${asset.AppID}/Assets/AssetDet?AssetID=${asset.ID}`
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
    sourceType: "TeamDynamix Asset"
}));
