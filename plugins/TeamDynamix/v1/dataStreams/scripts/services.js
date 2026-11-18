// LongDescription, RequestText and SubmitText are rich-text blocks, and ServiceOfferings is a
// nested array of full offering records — all dropped here. ServiceOfferingsCount already
// carries the only part of that array a dashboard needs.
//
// No custom-attribute columns: the API's own description for this endpoint says Attachments
// and Attributes are never included in search results — only loading a service individually
// returns them, which this stream doesn't do. Attempting to project them here would only ever
// yield empty columns.

// TeamDynamix never sends null for an unset date: it sends 0001-01-01T00:00:00 (.NET's minimum
// date), which SquaredUp displays as 12/31/1900 and which passes "not empty" filters. Anything
// before 1901-01-02 is treated as unset, which covers that value however it is normalised.
const UNSET_DATE_BEFORE = Date.parse("1901-01-02T00:00:00Z");
const realDate = (value) => (value && Date.parse(value) >= UNSET_DATE_BEFORE ? value : null);

result = (Array.isArray(data) ? data : []).map((service) => ({
    serviceId: String(service.ID),
    name: service.Name || `Service ${service.ID}`,
    categoryName: service.CategoryName || "",
    fullCategoryText: service.FullCategoryText || "",
    managerName: service.ManagerFullName || "",
    managingGroupName: service.ManagingGroupName || "",
    shortDescription: service.ShortDescription || "",
    isActive: Boolean(service.IsActive),
    isPublic: Boolean(service.IsPublic),
    serviceOfferingsCount:
        typeof service.ServiceOfferingsCount === "number" ? service.ServiceOfferingsCount : 0,
    maintenanceScheduleName: service.MaintenanceScheduleName || "",
    requestTypeName: service.RequestTypeName || "",
    createdDate: realDate(service.CreatedDateUtc),
    modifiedDate: realDate(service.ModifiedDateUtc),
    appId: String(service.AppID ?? "")
}));
