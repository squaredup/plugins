// One row per Microsoft Entra application with sign-ins in the period. AI apps are picked out
// by name, since Entra has no category for them: the vendor column says which AI product an
// app belongs to, and is empty for everything else. Name matching misses AI apps with
// unrelated names, so the "All apps" option shows the full list to check against.
// The script is templated (for the Apps option), and templating strips backslashes, so the
// matching avoids regex escapes: names are split into lowercase words instead.
// aiAppPermissions.js uses the same vendor table and matching. Keep the two in step.
const VENDORS = [
    ["GitHub Copilot", { text: ["github copilot"] }],
    ["Microsoft Copilot", { text: ["copilot", "power virtual agents"] }],
    ["Anthropic", { text: ["claude", "anthropic"] }],
    ["OpenAI", { text: ["openai", "chatgpt", "codex"], words: ["gpt"] }],
    ["Google", { text: ["gemini", "notebooklm"], words: ["bard"] }],
    ["Perplexity", { text: ["perplexity"] }],
    ["Mistral", { text: ["mistral"] }],
    ["xAI", { words: ["grok", "xai"] }],
    ["DeepSeek", { text: ["deepseek"] }],
    ["Cursor", { words: ["cursor"] }],
    ["Glean", { words: ["glean"] }],
    ["Other AI", { words: ["ai", "llm"], suffix: [".ai"] }],
];
const vendorOf = (name) => {
    const lower = name.toLowerCase();
    const words = lower.split(/[^a-z0-9]+/).filter(Boolean);
    const dotted = lower.split(/[^a-z0-9.]+/).filter(Boolean);
    const hit = VENDORS.find(
        ([, m]) =>
            (m.text || []).some((t) => lower.includes(t)) ||
            (m.words || []).some((w) => words.includes(w)) ||
            (m.suffix || []).some((x) => dotted.some((d) => d.endsWith(x))),
    );
    return hit ? hit[0] : null;
};

const onlyAi = "{{apps || 'ai'}}" !== "all";

result = (data.value || [])
    .map((a) => {
        const name = String(a.appDisplayName || "");
        const ok = Number(a.successfulSignInCount) || 0;
        const failed = Number(a.failedSignInCount) || 0;
        return {
            appId: a.id || null,
            appDisplayName: name,
            aiVendor: vendorOf(name),
            successfulSignInCount: ok,
            failedSignInCount: failed,
            totalSignInCount: ok + failed,
            successPercentage: typeof a.successPercentage === "number" ? a.successPercentage : null,
        };
    })
    .filter((a) => !onlyAi || a.aiVendor);
