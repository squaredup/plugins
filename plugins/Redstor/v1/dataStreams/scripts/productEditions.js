// GET /products nests editions inside each product — flatten to one row per edition.
const products = data?.results || [];

result = products.flatMap((product) =>
    (product.editions || []).map((edition) => ({
        editionId: edition.editionId,
        editionName: edition.editionName,
        productId: product.productId,
        productName: product.productName,
        hasTrial: edition.hasTrial,
    })),
);
