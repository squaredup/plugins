result = (data.workflows ?? []).map((wf) => ({
    label: wf.name,
    value: wf.name,
}));
