import { jsPDF } from 'jspdf';

// 6x9 inch trade paperback, in points (72pt = 1in)
const W = 432;
const H = 648;
const MARGIN = 54;
const BODY_W = W - MARGIN * 2;
const LINE = 15;
const BOTTOM = H - MARGIN - 24;

export function buildPdf({ title, author, chapters }) {
  const doc = new jsPDF({ unit: 'pt', format: [W, H] });

  // --- Title page ---
  doc.setFont('times', 'bold');
  doc.setFontSize(24);
  doc.text(title || 'Untitled', W / 2, H / 3, { align: 'center', maxWidth: BODY_W });

  doc.setFont('times', 'normal');
  doc.setFontSize(13);
  doc.text(author || '', W / 2, H / 3 + 40, { align: 'center', maxWidth: BODY_W });

  let pageNum = 0;

  chapters.forEach((c) => {
    doc.addPage();
    pageNum += 1;
    let y = MARGIN + 40;

    // Chapter heading
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    const heading = c.title ? `${c.heading}: ${c.title}` : c.heading;
    const headLines = doc.splitTextToSize(heading, BODY_W);
    headLines.forEach((line) => {
      doc.text(line, W / 2, y, { align: 'center' });
      y += 20;
    });
    y += 20;

    // Body
    doc.setFont('times', 'normal');
    doc.setFontSize(11);

    const parasList = c.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    parasList.forEach((para) => {
      const lines = doc.splitTextToSize(para.replace(/\n/g, ' '), BODY_W);
      lines.forEach((line, idx) => {
        if (y > BOTTOM - LINE) {
          doc.setFontSize(9);
          doc.text(String(pageNum), W / 2, BOTTOM + 18, { align: 'center' });
          doc.setFontSize(11);
          doc.addPage();
          pageNum += 1;
          y = MARGIN;
        }
        const indent = idx === 0 ? 18 : 0;
        doc.text(line, MARGIN + indent, y);
        y += LINE;
      });
      y += 4;
    });

    doc.setFontSize(9);
    doc.text(String(pageNum), W / 2, BOTTOM + 18, { align: 'center' });
  });

  return doc.output('blob');
}
