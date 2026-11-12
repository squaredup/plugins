const project = context.objects[0];
const toIso = (s) => (typeof s === 'number' ? new Date(s * 1000).toISOString() : null);
const body = data && typeof data === 'object' ? data : {};
const list = Array.isArray(body.backups) ? body.backups : [];
const latest = toIso(body.physical_backup_data && body.physical_backup_data.latest_physical_backup_date_unix);
const base = {
    pitrEnabled: body.pitr_enabled === true,
    latestPhysicalBackup: latest,
    projectRef: project.rawId,
    projectName: project.name
};

// A project with no backups still emits one row so it stays visible in per-project tiles
result = list.length
    ? list.map((b) => ({
          backupId: b.id == null ? null : String(b.id),
          insertedAt: b.inserted_at,
          status: b.status,
          backupType: b.is_physical_backup ? 'Physical' : 'Logical',
          ...base
      }))
    : [{ backupId: null, insertedAt: null, status: 'NONE', backupType: null, ...base }];
