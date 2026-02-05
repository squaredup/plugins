result = data.sheets.map((sheet) => ({
    label: sheet.properties.title,
    value: sheet.properties.title
}));
