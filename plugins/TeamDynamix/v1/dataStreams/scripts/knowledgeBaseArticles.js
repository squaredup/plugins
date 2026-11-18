// The search request already sets IncludeArticleBodies: false, which is the one big win —
// article bodies are full HTML documents. Attachments, Attributes and Tags are never in a
// search response at all (only loading an article individually returns them); WhitelistGroups
// is the one thing actually present that's dropped here as not dashboard-usable.
//
// TeamDynamix never sends null for an unset date: it sends 0001-01-01T00:00:00 (.NET's minimum
// date), which SquaredUp displays as 12/31/1900 and which passes "not empty" filters. Anything
// before 1901-01-02 is treated as unset, which covers that value however it is normalised.
const UNSET_DATE_BEFORE = Date.parse("1901-01-02T00:00:00Z");
const realDate = (value) => (value && Date.parse(value) >= UNSET_DATE_BEFORE ? value : null);

// A sandbox Web API address (/SBTDWebApi) needs the matching sandbox client portal
// (/SBTDClient) — otherwise every sandbox article link points at the production portal
// instead. The API spec has no web UI paths; SBTDClient follows the same SB prefix as
// SBTDWebApi, confirmed on a real sandbox tenant.
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
    reviewDate: realDate(article.ReviewDateUtc),
    createdDate: realDate(article.CreatedDate),
    modifiedDate: realDate(article.ModifiedDate),
    revisionNumber: typeof article.RevisionNumber === "number" ? article.RevisionNumber : null,
    appId: String(article.AppID ?? "")
}));
