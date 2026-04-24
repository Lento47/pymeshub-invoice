import * as PDFDocument from 'pdfkit';
import { Invoice } from './invoice.entity';

const BRAND = {
  primary:   '#1a56db',
  dark:      '#111827',
  gray:      '#6b7280',
  light:     '#f3f4f6',
  lightBlue: '#93c5fd',
  white:     '#ffffff',
};

/**
 * Draws the PymesHub icon mark (the "PP" logomark) at position (x, y).
 * Size is relative to `s` (base unit, default 1 = 48px icon).
 */
function drawLogoMark(doc: PDFKit.PDFDocument, x: number, y: number, size = 32): void {
  const s = size / 48;
  const r = 6 * s;

  // Background rounded square
  doc.roundedRect(x, y, size, size, r).fill(BRAND.primary);

  // Left "P" — vertical bar
  doc.rect(x + 10 * s, y + 8 * s, 4 * s, 22 * s).fill(BRAND.white);
  // Left "P" — bowl
  doc.moveTo(x + 14 * s, y + 8 * s)
     .lineTo(x + 22 * s, y + 8 * s)
     .quadraticCurveTo(x + 28 * s, y + 8 * s, x + 28 * s, y + 16 * s)
     .quadraticCurveTo(x + 28 * s, y + 24 * s, x + 22 * s, y + 24 * s)
     .lineTo(x + 14 * s, y + 24 * s)
     .fill(BRAND.white);

  // Right "P" — vertical bar (light blue, offset)
  doc.rect(x + 22 * s, y + 16 * s, 3 * s, 18 * s).fill(BRAND.lightBlue);
  // Right "P" — bowl (smaller, light blue)
  doc.moveTo(x + 25 * s, y + 16 * s)
     .lineTo(x + 31 * s, y + 16 * s)
     .quadraticCurveTo(x + 36 * s, y + 16 * s, x + 36 * s, y + 22 * s)
     .quadraticCurveTo(x + 36 * s, y + 28 * s, x + 31 * s, y + 28 * s)
     .lineTo(x + 25 * s, y + 28 * s)
     .fill(BRAND.lightBlue);
}

/**
 * Generates a branded PymesHub SaaS subscription invoice as a PDF Buffer.
 * Uses PDFKit — fully server-side, no external HTTP calls.
 */
export async function generateInvoicePdf(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const WIDTH = 515;
    const COL   = { desc: 50, qty: 310, price: 375, total: 455 };

    // ─── HEADER BAND ─────────────────────────────────────────────────────────
    doc.rect(50, 40, WIDTH, 88).fill(BRAND.primary);

    // Logo icon
    drawLogoMark(doc, 65, 52, 36);

    // Wordmark
    doc
      .fillColor(BRAND.white)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('Pymes', 110, 60, { continued: true })
      .fillColor(BRAND.lightBlue)
      .text('Hub');

    doc
      .fillColor(BRAND.white)
      .font('Helvetica')
      .fontSize(7.5)
      .text('PLATAFORMA SAAS PARA PYMES  ·  COSTA RICA', 110, 85);

    // Invoice label + number (right side)
    doc
      .fillColor(BRAND.white)
      .font('Helvetica-Bold')
      .fontSize(22)
      .text('FACTURA', 0, 55, { align: 'right' });

    doc
      .fontSize(9)
      .font('Helvetica')
      .text(`N° ${invoice.number}`, 0, 83, { align: 'right' })
      .text(`Emitida: ${invoice.issuedAt.toLocaleDateString('es-CR')}`, 0, 96, { align: 'right' });

    // ─── DIVIDER LINE ─────────────────────────────────────────────────────────
    doc.rect(50, 128, WIDTH, 2).fill(BRAND.lightBlue);

    // ─── CLIENT BLOCK ─────────────────────────────────────────────────────────
    let y = 148;

    doc
      .fillColor(BRAND.primary)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('FACTURAR A', 50, y);

    y += 12;
    doc
      .fillColor(BRAND.dark)
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .text(invoice.clientName, 50, y);

    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor(BRAND.dark);

    if (invoice.clientCompany) { doc.text(invoice.clientCompany, 50, y); y += 12; }
    if (invoice.clientAddress) { doc.text(invoice.clientAddress, 50, y); y += 12; }
    if (invoice.clientTaxId)   {
      doc.fillColor(BRAND.gray).text(`Cédula / RUC: ${invoice.clientTaxId}`, 50, y);
      y += 12;
    }
    doc.fillColor(BRAND.gray).text(invoice.clientEmail, 50, y);

    // ─── PLAN & STATUS (right column) ────────────────────────────────────────
    const statusColor: Record<string, string> = {
      PAID: '#16a34a', SENT: BRAND.primary, DRAFT: BRAND.gray,
      OVERDUE: '#dc2626', VOID: '#9ca3af',
    };
    const badgeColor = statusColor[invoice.status] ?? BRAND.gray;

    // Status badge
    doc.roundedRect(380, 148, 90, 22, 4).fill(badgeColor);
    doc
      .fillColor(BRAND.white)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(invoice.status, 380, 155, { width: 90, align: 'center' });

    // Plan info card
    doc.roundedRect(355, 178, 210, 52, 6).fill(BRAND.light);
    doc
      .fillColor(BRAND.primary)
      .font('Helvetica-Bold')
      .fontSize(7.5)
      .text('PLAN', 368, 186);
    doc
      .fillColor(BRAND.dark)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(invoice.planName, 368, 198);
    doc
      .fillColor(BRAND.gray)
      .font('Helvetica')
      .fontSize(8)
      .text(`${invoice.planInterval === 'MONTHLY' ? 'Mensual' : 'Anual'} · ${invoice.seats} asiento(s)`, 368, 212);
    if (invoice.dueDate) {
      doc.text(`Vence: ${invoice.dueDate.toLocaleDateString('es-CR')}`, 368, 224);
    }

    // ─── TABLE HEADER ─────────────────────────────────────────────────────────
    const tableTop = 248;

    doc.rect(50, tableTop, WIDTH, 22).fill(BRAND.dark);
    doc
      .fillColor(BRAND.white)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text('DESCRIPCIÓN', COL.desc + 4, tableTop + 6)
      .text('CANT.', COL.qty, tableTop + 6)
      .text('PRECIO UNIT.', COL.price, tableTop + 6, { width: 68, align: 'right' })
      .text('TOTAL', COL.total, tableTop + 6, { width: 60, align: 'right' });

    // ─── LINE ITEMS ───────────────────────────────────────────────────────────
    let rowY = tableTop + 24;
    let rowIdx = 0;
    const fmt = (n: number) =>
      n.toLocaleString('es-CR', { style: 'currency', currency: invoice.currency });

    for (const item of invoice.lineItems) {
      const isEven = rowIdx % 2 === 0;
      doc.rect(50, rowY, WIDTH, 22).fill(isEven ? BRAND.light : BRAND.white);

      // Left accent bar
      doc.rect(50, rowY, 3, 22).fill(BRAND.primary);

      doc
        .fillColor(BRAND.dark)
        .font('Helvetica')
        .fontSize(8.5)
        .text(item.description, COL.desc + 4, rowY + 6, { width: 248 })
        .text(String(item.quantity), COL.qty, rowY + 6)
        .text(fmt(item.unitPrice), COL.price, rowY + 6, { width: 68, align: 'right' })
        .font('Helvetica-Bold')
        .text(fmt(item.total), COL.total, rowY + 6, { width: 60, align: 'right' });

      rowY += 24;
      rowIdx++;
    }

    // ─── TOTALS SECTION ───────────────────────────────────────────────────────
    const totalsX = 350;
    rowY += 12;

    // Separator
    doc.rect(totalsX, rowY - 6, 215, 1).fill(BRAND.light);

    doc
      .fillColor(BRAND.gray)
      .font('Helvetica')
      .fontSize(9)
      .text('Subtotal', totalsX, rowY, { width: 110 })
      .text(fmt(invoice.subtotal), totalsX + 110, rowY, { width: 105, align: 'right' });

    if (invoice.taxRate > 0) {
      rowY += 18;
      doc
        .text(`IVA (${invoice.taxRate}%)`, totalsX, rowY, { width: 110 })
        .text(fmt(invoice.taxAmount), totalsX + 110, rowY, { width: 105, align: 'right' });
    }

    rowY += 18;
    // Total row — branded box
    doc.rect(totalsX - 8, rowY - 5, 228, 30).fill(BRAND.primary);
    doc
      .fillColor(BRAND.white)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('TOTAL', totalsX, rowY + 3, { width: 110 })
      .text(fmt(invoice.total), totalsX + 110, rowY + 3, { width: 105, align: 'right' });

    // ─── NOTES ────────────────────────────────────────────────────────────────
    if (invoice.notes) {
      rowY += 50;
      doc.roundedRect(50, rowY, WIDTH, 1).fill(BRAND.light);
      rowY += 8;
      doc
        .fillColor(BRAND.primary)
        .font('Helvetica-Bold')
        .fontSize(7.5)
        .text('NOTAS', 50, rowY);
      doc
        .fillColor(BRAND.gray)
        .font('Helvetica')
        .fontSize(8.5)
        .text(invoice.notes, 50, rowY + 12, { width: WIDTH });
    }

    // ─── FOOTER ───────────────────────────────────────────────────────────────
    // Bottom bar
    doc.rect(50, 762, WIDTH, 3).fill(BRAND.primary);
    doc.rect(50, 765, WIDTH, 1).fill(BRAND.lightBlue);

    // Small logo in footer
    drawLogoMark(doc, 50, 772, 18);

    doc
      .fillColor(BRAND.gray)
      .font('Helvetica')
      .fontSize(7)
      .text('PymesHub — Automatización para PYMES en Costa Rica y LATAM', 76, 776, { align: 'center', width: WIDTH - 26 })
      .text('support@pymeshub.com  ·  www.pymeshub.com', 76, 786, { align: 'center', width: WIDTH - 26 });

    doc.end();
  });
}
