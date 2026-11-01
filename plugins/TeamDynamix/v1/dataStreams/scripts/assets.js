// Serves double duty: this stream backs both the assets import step and asset tiles.
//
// Projected rather than passed through for the same reason as tickets — the asset search is
// unpaged, so a large estate in one response can overrun the ~6MB stream response cap.
//
// No custom-attribute columns: the API's own description for this endpoint says Attachments
// and Attributes are never included in search results — only loading an asset individually
// returns them, which this stream doesn't do.

// TeamDynamix never sends null for an unset date: it sends 0001-01-01T00:00:00 (.NET's minimum
// date), which SquaredUp displays as 12/31/1900 and which passes "not empty" filters. Anything
// before 1901-01-02 is treated as unset, which covers that value however it is normalised.
const UNSET_DATE_BEFORE = Date.parse("1901-01-02T00:00:00Z");
const realDate = (value) => (value && Date.parse(value) >= UNSET_DATE_BEFORE ? value : null);

// A sandbox Web API address (/SBTDWebApi) needs the matching sandbox web app (/SBTDNext) —
// otherwise every sandbox asset link points at the production app instead. The API spec has
// no web UI paths; SBTDNext follows the same SB prefix as SBTDWebApi, confirmed on a real
// sandbox tenant.
const rawBaseUrl = String(context?.dataSources?.[0]?.baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
const isSandbox = /\/SBTDWebApi$/i.test(rawBaseUrl);
const webBaseUrl = rawBaseUrl.replace(/\/(SB)?TDWebApi$/i, "");
const nextApp = isSandbox ? "SBTDNext" : "TDNext";

// An unset manufacturer, model, supplier, location, owner or department arrives as the literal
// name "None" rather than empty, so a breakdown tile's biggest bar is "None". Blank it so empty
// filters and tile SQL treat it as unset.
const named = (value) => (value && value !== "None" ? value : "");

result = (Array.isArray(data) ? data : []).map((asset) => ({
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
    manufacturerName: named(asset.ManufacturerName),
    productModelName: named(asset.ProductModelName),
    supplierName: named(asset.SupplierName),
    locationName: named(asset.LocationName),
    locationRoomName: named(asset.LocationRoomName),
    owningCustomerName: named(asset.OwningCustomerName),
    owningDepartmentName: named(asset.OwningDepartmentName),
    requestingCustomerName: named(asset.RequestingCustomerName),
    purchaseCost: typeof asset.PurchaseCost === "number" ? asset.PurchaseCost : null,
    acquisitionDate: realDate(asset.AcquisitionDate),
    expectedReplacementDate: realDate(asset.ExpectedReplacementDate),
    createdDate: realDate(asset.CreatedDate),
    modifiedDate: realDate(asset.ModifiedDate),
    parentName: named(asset.ParentName),
    externalId: asset.ExternalID || "",
    configurationItemId: asset.ConfigurationItemID ? String(asset.ConfigurationItemID) : "",
    appId: String(asset.AppID ?? ""),
    sourceType: "TeamDynamix Asset"
}));
