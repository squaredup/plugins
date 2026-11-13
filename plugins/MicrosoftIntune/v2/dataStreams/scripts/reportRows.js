// Intune report endpoints return { Schema: [{ Column, PropertyType }], Values: [[...]] }. Zip each Values row
// with the column names. If the body arrives as a string (non-JSON content type), parse it, dropping any BOM.
const report = (typeof data === "string" ? JSON.parse(data.replace(/^﻿/, "") || "{}") : data) || {};
const columns = (report.Schema || []).map((s) => s.Column);

result = (report.Values || []).map((values) => _.zipObject(columns, values));
