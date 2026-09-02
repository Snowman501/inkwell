// Export every novel to a JSON file, and restore from one.

export function exportBackup(novels) {
  const payload = {
    app: 'inkwell',
    version: 1,
    exportedAt: new Date().toISOString(),
    novels,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().slice(0, 10);
  a.download = `inkwell-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parses a backup file. Returns { novels } or throws with a clear message.
export function parseBackup(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('That file is not valid JSON.');
  }

  const novels = Array.isArray(data) ? data : data.novels;
  if (!Array.isArray(novels)) {
    throw new Error('No novels found in that file.');
  }

  const clean = novels.filter(
    (n) => n && typeof n === 'object' && 'id' in n && 'title' in n
  );
  if (clean.length === 0) {
    throw new Error('No readable novels in that file.');
  }
  return clean;
}

// Merges restored novels with existing ones. Existing wins on id conflict
// unless the restored copy is newer.
export function mergeNovels(existing, incoming) {
  const byId = new Map(existing.map((n) => [n.id, n]));
  for (const n of incoming) {
    const cur = byId.get(n.id);
    if (!cur) {
      byId.set(n.id, n);
    } else {
      const a = new Date(n.updatedAt || 0).getTime();
      const b = new Date(cur.updatedAt || 0).getTime();
      if (a > b) byId.set(n.id, n);
    }
  }
  return Array.from(byId.values());
}
