// Flattens the site-grouped /devices response into one row per device.
// Response shape: { sites: [ { siteId, name, gridLimit, devices: [ { deviceId, model, ... } ] } ] }
const modelToType = {
    zappi: "myenergi Zappi",
    eddi: "myenergi Eddi",
    libbi: "myenergi Libbi",
    harvi: "myenergi Harvi",
    hub: "myenergi Hub",
};

const sites = (data && data.sites) || [];

result = sites.flatMap((site) =>
    (site.devices || []).map((dev) => ({
        deviceId: dev.deviceId,
        name: dev.alias || dev.description || dev.deviceId,
        sourceType: modelToType[dev.model] || "myenergi Hub",
        model: dev.model,
        deviceType: dev.deviceType,
        status: dev.status,
        online: dev.online,
        firmwareVersion:
            dev.firmwareVersion != null ? String(dev.firmwareVersion) : null,
        serialNumber:
            dev.serialNumber != null ? String(dev.serialNumber) : null,
        powerLimit: typeof dev.powerLimit === "number" ? dev.powerLimit : null,
        siteId: site.siteId,
        siteName: site.name,
        lastSeen: dev.lastSeen || null,
    })),
);
