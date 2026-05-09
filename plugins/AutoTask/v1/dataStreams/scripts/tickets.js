const selectedIds = new Set(context.objects.map(o => String(o.companyId)));
result = (data.items ?? []).filter(ticket => selectedIds.has(String(ticket.companyID)));
