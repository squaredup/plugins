// LongDescription, RequestText and SubmitText are rich-text blocks, and ServiceOfferings is a
// nested array of full offering records — all dropped here. ServiceOfferingsCount already
// carries the only part of that array a dashboard needs.
//
// No custom-attribute columns: the API's own description for this endpoint says Attachments
// and Attributes are never included in search results — only loading a service individually
// returns them, which this stream doesn't do. Attempting to project them here would only ever
// yield empty columns.

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
    createdDate: service.CreatedDateUtc || null,
    modifiedDate: service.ModifiedDateUtc || null,
    appId: String(service.AppID ?? "")
}));
