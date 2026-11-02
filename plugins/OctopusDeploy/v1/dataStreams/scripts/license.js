// The license is server-wide and carries no space, so a Space scope returns it only for the
// default space; otherwise every space in a multi-space tile would repeat it.
const isDefaultSpace = String([].concat(context.objects[0].isDefault)[0]) === 'true';

const license = {
    hostingEnvironment: data.HostingEnvironment || null,
    isCompliant: data.IsCompliant === true,
    complianceSummary: data.ComplianceSummary || null,
    expiryDate: data.EffectiveExpiryDate || null,
    daysToExpiry: typeof data.DaysToEffectiveExpiryDate === 'number' ? data.DaysToEffectiveExpiryDate : null
};

result = !isDefaultSpace
    ? []
    : (data.Limits || []).map((l) => ({
          limitName: l.Name,
          currentUsage: l.CurrentUsage,
          limit: l.IsUnlimited ? null : l.EffectiveLimit,
          isUnlimited: l.IsUnlimited === true,
          usagePercent: !l.IsUnlimited && l.EffectiveLimit > 0 ? Math.round((l.CurrentUsage / l.EffectiveLimit) * 100) : null,
          limitStatus: l.LimitStatus,
          limitMessage: l.Message,
          ...license
      }));
