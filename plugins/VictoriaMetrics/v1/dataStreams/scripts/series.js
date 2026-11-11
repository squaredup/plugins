// Response body: { status, data: [{ __name__, label: value, ... }] }
const list = Array.isArray(data?.data) ? data.data : [];
result = list.map((labels) => {
    const { __name__, ...rest } = labels;
    const inner = Object.entries(rest).map(([k, v]) => `${k}="${v}"`).join(',');
    return Object.assign({}, labels, { series: `${__name__ || ''}{${inner}}` });
});
