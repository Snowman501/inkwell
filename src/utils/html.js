const esc = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const paras = (body) =>
  body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `    <p>${esc(p).replace(/\n/g, ' ')}</p>`)
    .join('\n');

export function buildHtml({ title, author, chapters }) {
  const toc = chapters
    .map((c, i) => {
      const h = c.title ? `${c.heading}: ${c.title}` : c.heading;
      return `      <li><a href="#ch${i + 1}">${esc(h)}</a></li>`;
    })
    .join('\n');

  const body = chapters
    .map((c, i) => {
      const h = c.title ? `${c.heading}: ${c.title}` : c.heading;
      return `  <section id="ch${i + 1}">
    <h2>${esc(h)}</h2>
${paras(c.body)}
  </section>`;
    })
    .join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${esc(title)}</title>
<meta name="author" content="${esc(author)}"/>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.7;
         max-width: 34em; margin: 0 auto; padding: 3em 1.2em; color: #1a1a1a; }
  header { text-align: center; margin-bottom: 3em; }
  h1 { font-size: 2em; margin: 0 0 .3em; }
  .author { color: #555; font-style: italic; }
  nav { margin: 2em 0 3em; padding: 1em 1.5em; background: #f6f6f4; border-radius: 6px; }
  nav h3 { margin: 0 0 .5em; font-size: .85em; letter-spacing: .08em;
           text-transform: uppercase; color: #666; }
  nav ol { margin: 0; padding-left: 1.2em; }
  nav a { color: #6b3fa0; text-decoration: none; }
  nav a:hover { text-decoration: underline; }
  section { margin-bottom: 3.5em; }
  h2 { font-size: 1.3em; margin: 2em 0 1em; text-align: center; }
  p { text-indent: 1.5em; margin: 0 0 .3em; }
  p:first-of-type { text-indent: 0; }
  @media (prefers-color-scheme: dark) {
    body { background: #16161a; color: #e8e8e6; }
    nav { background: #22222a; }
    nav a { color: #b794f6; }
    .author { color: #999; }
  }
</style>
</head>
<body>
  <header>
    <h1>${esc(title)}</h1>
    <p class="author">${esc(author)}</p>
  </header>

  <nav>
    <h3>Contents</h3>
    <ol>
${toc}
    </ol>
  </nav>

${body}
</body>
</html>`;
}
