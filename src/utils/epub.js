import JSZip from 'jszip';

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
    .map((p) => `<p>${esc(p).replace(/\n/g, ' ')}</p>`)
    .join('\n');

export async function buildEpub({ title, author, chapters }) {
  const zip = new JSZip();
  const uid = 'urn:uuid:' + crypto.randomUUID();

  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  zip.folder('META-INF').file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const oebps = zip.folder('OEBPS');

  oebps.file(
    'style.css',
    `body { font-family: Georgia, serif; line-height: 1.6; margin: 5%; }
h1 { font-size: 1.5em; margin: 2em 0 1em; text-align: center; }
p { text-indent: 1.5em; margin: 0 0 0.2em; }
p:first-of-type { text-indent: 0; }`
  );

  chapters.forEach((c, i) => {
    const heading = c.title ? `${c.heading}: ${c.title}` : c.heading;
    oebps.file(
      `ch${i + 1}.xhtml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${esc(heading)}</title><link rel="stylesheet" href="style.css"/></head>
<body>
<h1>${esc(heading)}</h1>
${paras(c.body)}
</body>
</html>`
    );
  });

  const manifest = chapters
    .map((_, i) => `<item id="ch${i + 1}" href="ch${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join('\n    ');
  const spine = chapters.map((_, i) => `<itemref idref="ch${i + 1}"/>`).join('\n    ');

  oebps.file(
    'content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${uid}</dc:identifier>
    <dc:title>${esc(title)}</dc:title>
    <dc:creator>${esc(author)}</dc:creator>
    <dc:language>en</dc:language>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="css" href="style.css" media-type="text/css"/>
    ${manifest}
  </manifest>
  <spine>
    ${spine}
  </spine>
</package>`
  );

  const navItems = chapters
    .map((c, i) => {
      const heading = c.title ? `${c.heading}: ${c.title}` : c.heading;
      return `<li><a href="ch${i + 1}.xhtml">${esc(heading)}</a></li>`;
    })
    .join('\n      ');

  oebps.file(
    'nav.xhtml',
    `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Contents</title></head>
<body>
  <nav epub:type="toc"><h1>Contents</h1>
    <ol>
      ${navItems}
    </ol>
  </nav>
</body>
</html>`
  );

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}
