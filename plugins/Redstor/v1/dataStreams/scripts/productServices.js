// GET /products nests services inside each product — flatten to one row per service.
const products = data?.results || [];

result = products.flatMap((product) =>
    (product.services || []).map((service) => ({
        serviceId: service.serviceId,
        serviceName: service.serviceName,
        productId: product.productId,
        productName: product.productName,
    })),
);
