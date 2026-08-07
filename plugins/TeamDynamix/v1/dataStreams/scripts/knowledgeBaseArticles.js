// The search request already sets IncludeArticleBodies: false, which is the one big win —
// article bodies are full HTML documents. This drops the remaining arrays (Attachments,
// Attributes, Tags, WhitelistGroups) that would otherwise render as raw JSON columns.
const webBaseUrl = String(context?.dataSources?.[0]?.baseUrl || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/(SB)?TDWebApi$/i, "");

result = (data || []).map((article) => ({
    articleId: String(article.ID),
    subject: article.Subject || `Article ${article.ID}`,
    link: webBaseUrl
        ? `${webBaseUrl}/TDClient/Shared/KB/ArticleDet?ID=${article.ID}`
        : article.Uri || "",
    categoryName: article.CategoryName || "",
    statusName: article.StatusName || "",
    isPublished: Boolean(article.IsPublished),
    isPublic: Boolean(article.IsPublic),
    ownerFullName: article.OwnerFullName || "",
    owningGroupName: article.OwningGroupName || "",
    summary: article.Summary || "",
    reviewDate: article.ReviewDateUtc || null,
    createdDate: article.CreatedDate || null,
    modifiedDate: article.ModifiedDate || null,
    revisionNumber: typeof article.RevisionNumber === "number" ? article.RevisionNumber : null,
    appId: String(article.AppID ?? "")
}));
