// Destroyed sessions are skipped so they don't pile up as dead objects; warnings arrive as an array
const KINDS = { CLAUDE_CODE: "Claude Code", OPENCODE: "OpenCode", CODEX_CLI: "Codex CLI", CURSOR_CLI: "Cursor CLI", HERMES: "Hermes", OPENAI_CODEX: "OpenAI Codex", LANGGRAPH: "LangGraph", CUSTOM: "Custom", NONE: "None" };
const kind = (k) => { const key = (k || "").replace(/^AGENT_KIND_/, ""); return KINDS[key] || key || null; };

result = (data.sessions || [])
    .filter((s) => s.status !== "SESSION_STATUS_DESTROYED")
    .map((s) => ({
        id: s.session_id,
        name: s.name || s.session_id,
        status: (s.status || "").replace(/^SESSION_STATUS_/, ""),
        agentKind: kind(s.agent_kind),
        configId: s.config_id || null,
        parentSessionId: s.parent_session_id || null,
        pauseReason: s.pause_reason || null,
        keepWarm: s.keep_warm ?? null,
        idleTimeoutSeconds: s.idle_timeout_seconds ?? null,
        warnings: (s.warnings || []).join("; "),
        createdAt: s.created_at,
        lastEventAt: s.last_event_at || null
    }));

// Optional Environment picker arrives at context.config.environment as an array whose rawId is a single-element array; empty means no filter
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const ids = new Set((context.config?.environment || []).map((o) => unwrap(o.rawId)).filter(Boolean));
if (ids.size) result = result.filter((row) => ids.has(row.configId));
