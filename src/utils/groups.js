// Section order + status-to-group mapping. REPEATING (rewatching) folds into Watching.
export const STATUS_GROUPS = [
  { key: 'Watching', statuses: ['CURRENT', 'REPEATING'] },
  { key: 'Completed', statuses: ['COMPLETED'] },
  { key: 'Paused', statuses: ['PAUSED'] },
  { key: 'Planning', statuses: ['PLANNING'] },
  { key: 'Dropped', statuses: ['DROPPED'] },
];

export function groupKeyForStatus(status) {
  const group = STATUS_GROUPS.find((g) => g.statuses.includes(status));
  return group ? group.key : status;
}

export function groupEntries(entries) {
  const byGroup = new Map();
  for (const group of STATUS_GROUPS) byGroup.set(group.key, []);

  for (const entry of entries) {
    const key = groupKeyForStatus(entry.status);
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key).push(entry);
  }

  return STATUS_GROUPS
    .map((group) => ({ key: group.key, entries: byGroup.get(group.key) }))
    .filter((group) => group.entries.length > 0);
}
