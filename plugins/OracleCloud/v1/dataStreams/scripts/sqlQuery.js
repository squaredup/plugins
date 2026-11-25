// executeSql returns one item per statement. Return the first result set's
// rows, keyed by column name, and surface SQL errors instead of no data.
const items = data?.items || [];
const failed = items.find((item) => item.error);
if (failed) {
    const err = failed.error;
    throw new Error(`SQL error${err.code ? ` ${err.code}` : ""}: ${err.message || JSON.stringify(err)}`);
}

const statement = items.find((item) => item.resultSet || item["result-set"]);
const resultSet = statement ? statement.resultSet || statement["result-set"] : null;
if (!resultSet) {
    result = [];
} else {
    const columns = (resultSet.metadata || []).map((c) => ({
        key: c.uniqueColumnName || c["unique-column-name"],
        name: c.databaseColumnName || c["database-column-name"] || c.uniqueColumnName || c["unique-column-name"],
        type: String(c.columnTypeName || c["column-type-name"] || "").toUpperCase(),
    }));
    const isNumeric = (type) => ["NUMBER", "FLOAT", "BINARY_FLOAT", "BINARY_DOUBLE", "INTEGER", "INT", "BIGINT", "DECIMAL", "DOUBLE", "REAL", "SMALLINT", "NUMERIC"].includes(type);

    result = (resultSet.items || []).map((row) => {
        const out = {};
        for (const col of columns) {
            let value = row[col.key] ?? row[col.name] ?? row[String(col.name).toLowerCase()] ?? null;
            if (value !== null && isNumeric(col.type) && typeof value === "string" && value.trim() !== "" && !isNaN(Number(value))) {
                value = Number(value);
            }
            out[col.name] = value;
        }
        return columns.length ? out : row;
    });
}
