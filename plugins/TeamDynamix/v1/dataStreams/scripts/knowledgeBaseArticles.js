// The search request already sets IncludeArticleBodies: false, which is the one big win —
// article bodies are full HTML documents. Attachments, Attributes and Tags are never in a
// search response at all (only loading an article individually returns them); WhitelistGroups
// is the one thing actually present that's dropped here as not dashboard-usable.
//
// A sandbox Web API address (/SBTDWebApi) needs the matching sandbox client portal
// (/SBTDClient) — otherwise every sandbox article link points at the production portal
// instead. SBTDClient is inferred from the same SB-prefix convention as SBTDWebApi; the API
// spec has no web UI paths to confirm it against.
const rawBaseUrl = String(context?.dataSources?.[0]?.baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
const isSandbox = /\/SBTDWebApi$/i.test(rawBaseUrl);
const webBaseUrl = rawBaseUrl.replace(/\/(SB)?TDWebApi$/i, "");
const clientApp = isSandbox ? "SBTDClient" : "TDClient";

result = (Array.isArray(data) ? data : []).map((article) => ({
    articleId: String(article.ID),
    subject: article.Subject || `Article ${article.ID}`,
    link: webBaseUrl
        ? `${webBaseUrl}/${clientApp}/Shared/KB/ArticleDet?ID=${article.ID}`
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
