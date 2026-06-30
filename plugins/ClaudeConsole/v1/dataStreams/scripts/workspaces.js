// List workspaces by default does not include the default workspace
const defaultWorkspace = {
    id: "default",
    name: "Default",
};

result = [...(Array.isArray(data?.data) ? data.data : []), defaultWorkspace];
