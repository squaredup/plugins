// Interruptions link to their deployment or run through RelatedDocumentIds; pick the ids out by prefix.
const unwrap = (v) => (Array.isArray(v) ? v[0] : v);
const scoped = context.objects[0].rawId;
const spaceId = scoped.startsWith('Spaces-') ? scoped : unwrap(context.objects[0].spaceId);
const iso = (s) => (s && Number.isFinite(Date.parse(s)) ? new Date(s).toISOString() : null);
const minutes = (s) => (Number.isFinite(Date.parse(s)) ? Math.max(0, Math.round((Date.now() - Date.parse(s)) / 60000)) : null);
const related = (i) => i.RelatedDocumentIds || [];
const pick = (i, prefix) => related(i).find((id) => id.startsWith(prefix)) || null;

// The instructions are the paragraph text in the form, when the step has one
const instructions = (i) => {
    const elements = (i.Form && i.Form.Elements) || [];
    const text = elements
        .map((e) => e.Control && e.Control.Type === 'Paragraph' && e.Control.Text)
        .filter(Boolean);
    return text.length ? text.join('\n') : null;
};

const typeLabel = { ManualIntervention: 'Manual intervention', GuidedFailure: 'Guided failure' };

// Narrow to the scoped object; a Space scope keeps everything.
const keep = (i) => scoped.startsWith('Spaces-') || related(i).includes(scoped);

result = (data.Items || [])
    .filter((i) => i.IsPending !== false && keep(i))
    .map((i) => ({
        title: i.Title,
        type: typeLabel[i.Type] || i.Type || null,
        status: 'Pending',
        instructions: instructions(i),
        created: iso(i.Created),
        waitingMinutes: minutes(i.Created),
        hasResponsibility: !!i.HasResponsibility,
        responsibleUserId: i.ResponsibleUserId || null,
        canTakeResponsibility: !!i.CanTakeResponsibility,
        responsibleTeamIds: i.ResponsibleTeamIds || [],
        projectId: pick(i, 'Projects-'),
        environmentId: pick(i, 'Environments-'),
        tenantId: pick(i, 'Tenants-'),
        taskId: i.TaskId || pick(i, 'ServerTasks-'),
        interruptionId: i.Id,
        spaceId: i.SpaceId || spaceId
    }));
