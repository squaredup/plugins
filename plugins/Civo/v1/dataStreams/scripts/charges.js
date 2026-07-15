// Adds an `estimatedCost` (USD) column to each charge line-item.
//
// Civo's /charges API returns metered USAGE only (hours, GB) — no monetary
// amount. This derives an INDICATIVE cost by multiplying usage against Civo's
// public list prices (https://www.civo.com/pricing). It is an estimate, not an
// invoice: it excludes credits, discounts, free-tier, minimums and bandwidth,
// and will drift when Civo changes prices. Pricing is flat across regions.
//
// Hourly USD price per instance/Kubernetes-node size slug.
var HOURLY = {
    "g3.xsmall": 0.00744, "g3.small": 0.014881, "g3.medium": 0.029762,
    "g3.large": 0.059524, "g3.xlarge": 0.119048, "g3.2xlarge": 0.238095,
    "g4s.xsmall": 0.00744, "g4s.small": 0.014881, "g4s.medium": 0.029762,
    "g4s.large": 0.059524, "g4s.xlarge": 0.119048, "g4s.2xlarge": 0.238095,
    "g4s.kube.xsmall": 0.00744, "g4s.kube.small": 0.014881,
    "g4s.kube.medium": 0.029762, "g4s.kube.large": 0.059524,
    "g4p.small": 0.119048, "g4p.medium": 0.238095, "g4p.large": 0.47619, "g4p.xlarge": 0.952381,
    "g4p.kube.small": 0.119048, "g4p.kube.medium": 0.238095, "g4p.kube.large": 0.47619, "g4p.kube.xlarge": 0.952381,
    "g4c.small": 0.190476, "g4c.medium": 0.380952, "g4c.large": 0.761905, "g4c.xlarge": 1.52381,
    "g4c.kube.small": 0.190476, "g4c.kube.medium": 0.380952, "g4c.kube.large": 0.761905, "g4c.kube.xlarge": 1.52381,
    "g4m.small": 0.107143, "g4m.medium": 0.214286, "g4m.large": 0.428571, "g4m.xlarge": 0.857143,
    "g4m.kube.small": 0.107143, "g4m.kube.medium": 0.214286, "g4m.kube.large": 0.428571, "g4m.kube.xlarge": 0.857143
};
var VOLUME_GB_HR = 0.000149; // block storage, ~$0.11/GB/month
var OBJECT_GB_HR = 0.000015; // object store, ~$0.0109/GB/month
var LB_HR = 0.014881; // load balancer, per unit

function hourlyForSlug(slug) {
    return Object.prototype.hasOwnProperty.call(HOURLY, slug) ? HOURLY[slug] : null;
}

function rowCost(r) {
    var hrs = Number(r.num_hours) || 0;
    var code = typeof r.code === "string" ? r.code : "";
    var gb = r.size_gb == null ? null : Number(r.size_gb);

    if (code === "volume") return gb == null ? null : gb * VOLUME_GB_HR * hrs;
    if (code === "objectstore" || code === "object-store") return gb == null ? null : gb * OBJECT_GB_HR * hrs;
    if (code.indexOf("loadbalancer") === 0) return LB_HR * hrs;

    var slug = null;
    if (code.indexOf("kube-node-") === 0) slug = code.slice("kube-node-".length);
    else if (code.indexOf("instance-") === 0) slug = code.slice("instance-".length);
    if (slug == null) return null; // unknown/unpriced code — leave blank, don't fabricate

    var rate = hourlyForSlug(slug);
    return rate == null ? null : rate * hrs;
}

result = (Array.isArray(data) ? data : []).map(function (r) {
    var cost = rowCost(r);
    var copy = Object.assign({}, r);
    copy.estimatedCost = cost == null ? null : Math.round(cost * 100) / 100;
    return copy;
});
