result = data.data.flatMap((s) =>
    Object.entries(s.statistics?.wans ?? {}).map(([name, wan = {}]) => {
        const ispName = wan.ispInfo?.name;
        const uptime = wan.wanUptime ?? 0;
        const issues = wan.wanIssues?.length ?? 0;
        return {
            name,
            isp: ispName ?? 'Unknown',
            ip: wan.externalIp ?? null,
            uptime,
            issues,
            state: !ispName ? 'unknown' : uptime < 90 ? 'error' : uptime < 98 ? 'warn' : 'success'
        };
    })
);
