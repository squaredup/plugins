// A TeamDynamix Ticket has 119 fields, several of which are unbounded: Description is full
// HTML, and Attachments, Tasks, TaskTemplateApplications and Notify are arrays. Passed
// through untouched, a few hundred tickets overrun the ~6MB stream response cap and the tile
// fails with Function.ResponseSizeTooLarge rather than anything diagnosable. So this projects
// to a working set. Everything dropped here is either unbounded or not dashboard-usable.

// StatusClass is an integer enum on the wire; dashboards need to group and read it as text.
const STATUS_CLASS_NAMES = {
    0: "Unknown",
    1: "New",
    2: "In Process",
    3: "Completed",
    4: "Cancelled",
    5: "On Hold",
    6: "Requested"
};

// No custom-attribute columns: the API's own description for this endpoint says Attachments,
// Attributes, Description, Notify and Tasks are never included in search results — only
// loading a ticket individually returns them, which this stream doesn't do.

// A ticket is far more useful when you can click through to it. The API's own Uri field
// points at the API resource, not the web UI, so derive a TDNext deep link from the
// configured base address instead. context.dataSources isn't guaranteed to be populated for
// post-request scripts, so fall back to Uri rather than emitting a broken link.
//
// A sandbox Web API address (/SBTDWebApi) needs the matching sandbox web app (/SBTDNext) —
// otherwise every sandbox ticket link points at the production app instead. The API spec
// doesn't document web UI paths at all (sandbox or otherwise), so SBTDNext is inferred from
// the same SB-prefix convention as SBTDWebApi, not confirmed against a real sandbox tenant.
const rawBaseUrl = String(context?.dataSources?.[0]?.baseUrl || "")
    .trim()
    .replace(/\/+$/, "");
const isSandbox = /\/SBTDWebApi$/i.test(rawBaseUrl);
const webBaseUrl = rawBaseUrl.replace(/\/(SB)?TDWebApi$/i, "");
const nextApp = isSandbox ? "SBTDNext" : "TDNext";

const ticketLink = (ticket) =>
    webBaseUrl
        ? `${webBaseUrl}/${nextApp}/Apps/${ticket.AppID}/Tickets/TicketDet?TicketID=${ticket.ID}`
        : ticket.Uri || "";

// Rolled up into one health value so a status tile works without shaping. SLA breach is the
// most urgent thing about a ticket, so it outranks the status class.
const ticketHealth = (ticket) => {
    if (ticket.IsSlaViolated) return "SLA violated";
    if (ticket.StatusClass === 3) return "Completed";
    if (ticket.StatusClass === 4) return "Cancelled";
    if (ticket.IsOnHold || ticket.StatusClass === 5) return "On hold";
    return "Open";
};

result = (data || []).map((ticket) => ({
    ticketId: String(ticket.ID),
    title: ticket.Title || `Ticket ${ticket.ID}`,
    link: ticketLink(ticket),
    health: ticketHealth(ticket),
    statusName: ticket.StatusName || "",
    statusClassName: STATUS_CLASS_NAMES[ticket.StatusClass] || "Unknown",
    priorityName: ticket.PriorityName || "",
    priorityOrder: typeof ticket.PriorityOrder === "number" ? ticket.PriorityOrder : null,
    typeName: ticket.TypeName || "",
    classificationName: ticket.ClassificationName || "",
    urgencyName: ticket.UrgencyName || "",
    impactName: ticket.ImpactName || "",
    accountName: ticket.AccountName || "",
    serviceName: ticket.ServiceName || "",
    locationName: ticket.LocationName || "",
    sourceName: ticket.SourceName || "",
    responsibleFullName: ticket.ResponsibleFullName || "",
    responsibleGroupName: ticket.ResponsibleGroupName || "",
    requestorName: ticket.RequestorName || "",
    requestorEmail: ticket.RequestorEmail || "",
    createdDate: ticket.CreatedDate || null,
    modifiedDate: ticket.ModifiedDate || null,
    completedDate: ticket.CompletedDate || null,
    respondedDate: ticket.RespondedDate || null,
    daysOld: typeof ticket.DaysOld === "number" ? ticket.DaysOld : null,
    slaName: ticket.SlaName || "",
    isSlaViolated: Boolean(ticket.IsSlaViolated),
    isSlaRespondByViolated: Boolean(ticket.IsSlaRespondByViolated),
    isSlaResolveByViolated: Boolean(ticket.IsSlaResolveByViolated),
    respondByDate: ticket.RespondByDate || null,
    resolveByDate: ticket.ResolveByDate || null,
    isOnHold: Boolean(ticket.IsOnHold),
    goesOffHoldDate: ticket.GoesOffHoldDate || null,
    actualMinutes: typeof ticket.ActualMinutes === "number" ? ticket.ActualMinutes : null,
    estimatedMinutes: typeof ticket.EstimatedMinutes === "number" ? ticket.EstimatedMinutes : null,
    formName: ticket.FormName || "",
    refCode: ticket.RefCode || "",
    appId: String(ticket.AppID ?? "")
}));
