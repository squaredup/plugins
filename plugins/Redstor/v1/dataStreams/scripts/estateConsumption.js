// GET /consumption/summary returns one companySummary object (the configured
// Partner company) and one customerSummary object (rolled up across every
// customer beneath it), not arrays — tag each as its own row.
result = [
    { scope: "Partner company", ...(data?.companySummary || {}) },
    { scope: "Customer companies", ...(data?.customerSummary || {}) },
];
