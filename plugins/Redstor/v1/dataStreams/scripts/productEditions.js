// GET /products nests editions inside each product — flatten to one row per edition.
// Edition ids are only unique within a product (every product currently returns
// editionId 5, "Premium"), so rows carry a composite product-edition key for indexing.
const products = data?.results || [];

result = products.flatMap((product) =>
    (product.editions || []).map((edition) => ({
        productEditionKey: product.productId + "-" + edition.editionId,
        editionId: edition.editionId,
        editionName: edition.editionName,
        productId: product.productId,
        productName: product.productName,
        hasTrial: edition.hasTrial,
    })),
);
