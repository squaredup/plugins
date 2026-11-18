// The paged search is asked for a single asset; only its TotalCount is used. That counts every
// match, where the Assets stream stops at Maximum assets (2,000 by default) and one asset
// application can hold tens of thousands. A missing total is left empty rather than shown as 0.
result = [{ assets: typeof data?.TotalCount === "number" ? data.TotalCount : null }];
