result = data.data.map( r => r.reduce((obj, value, i) => {
    const columnName = data.resultSetMetaData.rowType[i].name;
    obj[columnName] = value;
    return obj;
}, {}));

// support value column for autoComplete queries
if (context.config.valueColumn) {
    metadata = [
        {
            name: context.config.valueColumn,
            role: "value"
        }
    ]
} else {
    const typeMapping = {
        "text": "string",
        "fixed": "number",
        "real": "number",
        "varchar": "string",
        "date": "date",
        "timestamp": "date"
    };

    metadata = data.resultSetMetaData.rowType.map( c => {
        return {
            name: c.name,
            shape: typeMapping[c.type] || "string"
        }
    });
}

// used for validation queries
if (context.config.errorOnEmptyResults === true && data.data.length === 0) {
    throw new Error("No results");
}