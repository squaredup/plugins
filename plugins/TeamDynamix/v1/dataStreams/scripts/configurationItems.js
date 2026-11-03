// Serves both CI tiles (configurationItems, the unpaged cmdb/search) and the import
// (configurationItemsIndex, cmdb/search/paged, which wraps each page in { Data: [...] }).
//
// The import has to page. TeamDynamix creates a configuration item for every asset, so a big
// asset application's CMDB is almost all asset mirrors (49,000+ in one real tenant), and one
// unpaged search for it ran the stream out of memory before this script could drop them.
// Tiles stay on the unpaged search, capped below: walking hundreds of 250-row pages (the API's
// maximum page size) is fine every 12 hours but far too slow for a tile. The unpaged search's
// MaxResults counts the asset mirrors dropped below, so it only guards memory; the number of
// rows a tile shows is capped at the end of this script instead.

// BackingItemType is an integer enum on the wire. A CI can be backed by a service record
// elsewhere in TeamDynamix, which is worth showing — but not as "47". 87 isn't in the
// published enum, but real tenants send it for service offering CIs.
const BACKING_ITEM_TYPE_NAMES = {
    47: "Service",
    63: "Configuration Item",
    87: "Service Offering"
};

// TeamDynamix creates a system-maintained configuration item for every asset, so importing
// both would list each asset twice in search, pickers and counts. Only standalone items are
// kept, which is also what TeamDynamix itself means by a configuration item count.
const ASSET_BACKING_ITEM_TYPE = 27;

// An unset owner, department, location and similar name can arrive as the literal "None"
// rather than empty, so a breakdown tile's biggest bar is "None". Blank it so it reads as unset.
const named = (value) => (value && value !== "None" ? value : "");

// TeamDynamix never sends null for an unset date: it sends 0001-01-01T00:00:00 (.NET's minimum
// date), which SquaredUp displays as 12/31/1900 and which passes "not empty" filters. Anything
// before 1901-01-02 is treated as unset, which covers that value however it is normalised.
const UNSET_DATE_BEFORE = Date.parse("1901-01-02T00:00:00Z");
const realDate = (value) => (value && Date.parse(value) >= UNSET_DATE_BEFORE ? value : null);

// No custom-attribute columns: the API's own description for this endpoint says Attachments
// and Attributes are never included in search results — only loading a configuration item
// individually returns them, which this stream doesn't do.

// A sandbox Web API address (/SBTDWebApi) needs the matching sandbox web app (/SBTDNext) —
// otherwise every sandbox CI link points at the production app instead. The API spec has no
// web UI paths; SBTDNext follows the same SB prefix as SBTDWebApi, confirmed on a real
// sandbox tenant.
const rawBaseUrl = String(context?.dataSources?.[0]?.baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
const isSandbox = /\/SBTDWebApi$/i.test(rawBaseUrl);
const webBaseUrl = rawBaseUrl.replace(/\/(SB)?TDWebApi$/i, "");
const nextApp = isSandbox ? "SBTDNext" : "TDNext";

const items = Array.isArray(data) ? data : Array.isArray(data?.Data) ? data.Data : [];

// The tile stream asks for at most 10,000 items (its postBody MaxResults). Unlimited, a CMDB
// of 49,000 asset mirrors ran the stream out of memory with no useful message. If the limit is
// reached, standalone items may be missing, so say so rather than show a silently short list.
const TILE_SEARCH_LIMIT = 10000;
if (Array.isArray(data) && data.length >= TILE_SEARCH_LIMIT) {
    throw new Error(
        "This asset application's CMDB has more than 10,000 configuration items, mostly copies " +
            "of its assets, which is too many to load in a tile. Turn on Import assets, " +
            "configuration items, accounts and locations in the data source's Advanced options " +
            "to import its standalone configuration items instead."
    );
}

const rows = items
    .filter((item) => item.BackingItemType !== ASSET_BACKING_ITEM_TYPE)
    .map((item) => ({
        // As with assets, CI IDs are only unique within an application.
        sourceId: `${item.AppID}-${item.ID}`,
        configurationItemId: String(item.ID),
        name: item.Name || `Configuration Item ${item.ID}`,
        link: webBaseUrl
            ? `${webBaseUrl}/${nextApp}/Apps/${item.AppID}/Assets/CIDet?CID=${item.ID}`
            : item.Uri || "",
        typeName: item.TypeName || "",
        isActive: Boolean(item.IsActive),
        ownerFullName: named(item.OwnerFullName),
        owningDepartmentName: named(item.OwningDepartmentName),
        owningGroupName: named(item.OwningGroupName),
        locationName: named(item.LocationName),
        maintenanceScheduleName: named(item.MaintenanceScheduleName),
        backingItemType: BACKING_ITEM_TYPE_NAMES[item.BackingItemType] || "",
        isSystemMaintained: Boolean(item.IsSystemMaintained),
        externalSourceName: named(item.ExternalSourceName),
        externalId: item.ExternalID || "",
        // Note the Utc suffix: configuration items use CreatedDateUtc / ModifiedDateUtc where
        // tickets and assets use CreatedDate / ModifiedDate.
        createdDate: realDate(item.CreatedDateUtc),
        modifiedDate: realDate(item.ModifiedDateUtc),
        appId: String(item.AppID ?? ""),
        sourceType: "TeamDynamix Configuration Item"
    }));

// The cap uses the same "Maximum records per request" plugin setting the ticket/asset/time
// streams pass to the API directly. A 250-row import page never reaches it. Sort so a forced
// cut drops the stalest records first rather than an arbitrary API-returned order.
const maxRecords = Number(context?.dataSources?.[0]?.maxRecords) || 2000;
result = rows
    .sort((a, b) => (b.modifiedDate || "").localeCompare(a.modifiedDate || ""))
    .slice(0, maxRecords);
