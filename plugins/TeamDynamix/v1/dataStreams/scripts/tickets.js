// A TeamDynamix Ticket has 119 fields, several of which are unbounded: Description is full
// HTML, and Attachments, Tasks, TaskTemplateApplications and Notify are arrays. Passed
// through untouched, a few hundred tickets overrun the ~6MB stream response cap and the tile
// fails with Function.ResponseSizeTooLarge rather than anything diagnosable. So this projects
// to a working set. Everything dropped here is either unbounded or not dashboard-usable.
//
// Each shaped cell carries raw, value and formatted copies, so even an empty date costs about
// 90 bytes a row. Respond-by, goes-off-hold, estimate, form, reference code and requestor email
// were dropped to keep a 2,000-ticket tile well under the ~6MB cap (about 2.9KB a row before).

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

// TeamDynamix never sends null for an unset date: it sends 0001-01-01T00:00:00 (.NET's minimum
// date), which SquaredUp displays as 12/31/1900 and which passes "not empty" filters. Anything
// before 1901-01-02 is treated as unset, which covers that value however it is normalised.
const UNSET_DATE_BEFORE = Date.parse("1901-01-02T00:00:00Z");
const realDate = (value) => (value && Date.parse(value) >= UNSET_DATE_BEFORE ? value : null);

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

// An unset service, account, location and similar name can arrive as the literal "None" rather
// than empty, so a breakdown tile's biggest bar is "None". Blank it so it reads as unset.
const named = (value) => (value && value !== "None" ? value : "");

// An empty assignee or group would otherwise group into an unlabelled bar or row, hiding
// unassigned work, which is usually the first thing a service desk wants to see.
const UNASSIGNED = "(Unassigned)";

// Rolled up into one health value so a status tile works without shaping. SLA breach is the
// most urgent thing about a ticket, so it outranks the status class.
const ticketHealth = (ticket) => {
    if (ticket.IsSlaViolated) return "SLA violated";
    if (ticket.StatusClass === 3) return "Completed";
    if (ticket.StatusClass === 4) return "Cancelled";
    if (ticket.IsOnHold || ticket.StatusClass === 5) return "On hold";
    return "Open";
};

result = (Array.isArray(data) ? data : []).map((ticket) => ({
    ticketId: String(ticket.ID),
    title: ticket.Title || `Ticket ${ticket.ID}`,
    link: ticketLink(ticket),
    health: ticketHealth(ticket),
    statusName: ticket.StatusName || "",
    statusClassName: STATUS_CLASS_NAMES[ticket.StatusClass] || "Unknown",
    priorityName: ticket.PriorityName || "",
    priorityOrder: typeof ticket.PriorityOrder === "number" ? ticket.PriorityOrder : null,
    typeName: named(ticket.TypeName),
    classificationName: named(ticket.ClassificationName),
    urgencyName: named(ticket.UrgencyName),
    impactName: named(ticket.ImpactName),
    accountName: named(ticket.AccountName),
    serviceName: named(ticket.ServiceName),
    locationName: named(ticket.LocationName),
    sourceName: named(ticket.SourceName),
    responsibleFullName: named(ticket.ResponsibleFullName) || UNASSIGNED,
    responsibleGroupName: named(ticket.ResponsibleGroupName) || UNASSIGNED,
    requestorName: ticket.RequestorName || "",
    createdDate: realDate(ticket.CreatedDate),
    modifiedDate: realDate(ticket.ModifiedDate),
    completedDate: realDate(ticket.CompletedDate),
    respondedDate: realDate(ticket.RespondedDate),
    daysOld: typeof ticket.DaysOld === "number" ? ticket.DaysOld : null,
    slaName: ticket.SlaName || "",
    isSlaViolated: Boolean(ticket.IsSlaViolated),
    isSlaResolveByViolated: Boolean(ticket.IsSlaResolveByViolated),
    resolveByDate: realDate(ticket.ResolveByDate),
    isOnHold: Boolean(ticket.IsOnHold),
    actualMinutes: typeof ticket.ActualMinutes === "number" ? ticket.ActualMinutes : null,
    appId: String(ticket.AppID ?? "")
}));
