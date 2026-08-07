// LongDescription, RequestText and SubmitText are rich-text blocks, and ServiceOfferings is a
// nested array of full offering records — all dropped here. ServiceOfferingsCount already
// carries the only part of that array a dashboard needs.
const customAttributeColumns = (service) => {
    const columns = {};
    for (const attribute of service.Attributes || []) {
        if (!attribute || !attribute.Name) continue;
        columns[`attr.${attribute.Name}`] =
            attribute.ValueText ?? (attribute.Value === "" ? null : attribute.Value ?? null);
    }
    return columns;
};

result = (data || []).map((service) => ({
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
    appId: String(service.AppID ?? ""),
    ...customAttributeColumns(service)
}));
