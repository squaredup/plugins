const sheet = data.sheets[0].data[0];
const firstRow = sheet.rowData[0];

const output = sheet.rowData.slice(1).map((row) => {
    const obj = {};
    row.values.forEach((cell, index) => {
        const headerCell = firstRow.values[index];
        if (headerCell && headerCell.effectiveValue && 'stringValue' in headerCell.effectiveValue) {
            const key = headerCell.effectiveValue.stringValue;
            if (cell && cell.effectiveValue) {
                if ('stringValue' in cell.effectiveValue) {
                    obj[key] = cell.effectiveValue.stringValue;
                } else if ('numberValue' in cell.effectiveValue) {
                    obj[key] = cell.effectiveValue.numberValue;
                }
            } else {
                obj[key] = null;
            }
        }
    });
    return obj;
});

result = output
