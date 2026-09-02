// Joins a novel's assistant messages into a single manuscript string.
export function manuscriptFromMessages(messages = []) {
  return messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content.trim())
    .filter(Boolean)
    .join('\n\n');
}

// Adds a manuscript field to any novel that lacks one.
export function migrateNovels(novels = []) {
  return novels.map((n) =>
    typeof n.manuscript === 'string'
      ? n
      : { ...n, manuscript: manuscriptFromMessages(n.messages) }
  );
}
