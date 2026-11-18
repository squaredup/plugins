// dataStreams/scripts/statusPageComponents.js
// A status page structure nests components up to three levels deep:
// items[] -> component | group.components[] | sub_page.items[] -> component | group.components[].
// Flatten every component into one row, remembering its group and sub-page.
const page = context.objects[0];
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const rows = [];

const addComponent = (component, groupName, subPageName) => {
    if (!component || !component.component_id) {
        return;
    }
    rows.push({
        // A component can appear on several status pages, so the object id pairs it with its page.
        id: unwrap(page.rawId) + ":" + component.component_id,
        componentId: component.component_id,
        name: component.name,
        qualifiedName: unwrap(page.name) + " / " + component.name,
        statusPageId: unwrap(page.rawId),
        statusPageName: unwrap(page.name),
        groupName: groupName || null,
        subPageName: subPageName || null,
        hidden: Boolean(component.hidden),
    });
};

const walk = (items, subPageName) =>
    (items || []).forEach((item) => {
        addComponent(item.component, null, subPageName);
        if (item.group) {
            (item.group.components || []).forEach((c) => addComponent(c, item.group.name, subPageName));
        }
        if (item.sub_page) {
            walk(item.sub_page.items, item.sub_page.name);
        }
    });

walk(data.current_structure && data.current_structure.items, null);
result = rows;
