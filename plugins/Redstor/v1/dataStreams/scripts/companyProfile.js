// GET /companies/{companyId} returns a single Company object, not an array;
// wrap it as one row so it can be indexed like every other stream.
result = [data];
