// Detects chapter and part breaks in novel text.

const HEADING_RE = /^\s*((?:PART|BOOK)\s+[\w\d]+|CHAPTER\s+[\w\d]+|(?:Chapter|Part)\s+[\w\d]+)\b[:.\s-]*(.*)$/i;

export function detectChapters(messages) {
  const prose = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content)
    .join('\n\n');

  const withBreaks = prose.replace(
    /(\s|^)((?:PART|BOOK|CHAPTER)\s+[\w\d]+|(?:Chapter|Part)\s+[\w\d]+)\b/g,
    '\n$2'
  );
  const lines = withBreaks.split('\n');
  const chapters = [];
  let current = { heading: null, title: '', lines: [] };

  for (const line of lines) {
    const match = line.match(HEADING_RE);
    if (match) {
      if (current.lines.length || current.heading) chapters.push(current);
      current = {
        heading: match[1].trim(),
        title: (match[2] || '').trim(),
        lines: [],
      };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length || current.heading) chapters.push(current);

  return chapters
    .map((c, i) => {
      const body = c.lines.join('\n').trim();
      return {
        id: i,
        heading: c.heading || (chapters.length === 1 ? 'Untitled' : `Section ${i + 1}`),
        title: c.title,
        body,
        wordCount: body ? body.split(/\s+/).length : 0,
      };
    })
    .filter((c) => c.body.length > 0);
}

export function totalWords(chapters) {
  return chapters.reduce((sum, c) => sum + c.wordCount, 0);
}
