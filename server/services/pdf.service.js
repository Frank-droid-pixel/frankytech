/**
 * FRANKY TECH — PDF Generation Service
 * -----------------------------------------------------------
 * One shared layout function powers Invoice, Quotation and
 * Receipt PDFs, so a business's branding and totals always
 * look identical to what's shown on-screen (Phase 9 rule:
 * the same calculation/appearance powers every document).
 *
 * PDFs are streamed directly to the HTTP response — nothing
 * is written to disk, so there's no cleanup and no risk of
 * one business ever reading another's generated file.
 * -----------------------------------------------------------
 */

const PDFDocument = require('pdfkit');

const BRAND_PRIMARY = '#1B3A5C';
const BRAND_ACCENT = '#E8A33D';
const TEXT_MUTED = '#5A6B7A';

function money(amount, currency) {
  const n = Number(amount || 0);
  return `${currency || ''} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.trim();
}

function drawHeader(doc, business, docTitle, docNumber) {
  doc.fillColor(BRAND_PRIMARY).fontSize(20).font('Helvetica-Bold').text(business.name || 'Your Business', 50, 50);
  doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica');
  const infoLines = [business.address, business.phone, business.email, business.website].filter(Boolean);
  doc.text(infoLines.join('  ·  '), 50, 74);

  doc.fillColor(BRAND_ACCENT).fontSize(18).font('Helvetica-Bold').text(docTitle.toUpperCase(), 300, 50, { align: 'right', width: 245 });
  doc.fillColor(TEXT_MUTED).fontSize(10).font('Helvetica').text(`# ${docNumber}`, 300, 74, { align: 'right', width: 245 });

  doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#DCE2E8').lineWidth(1).stroke();
}

function drawParties(doc, customer, dates) {
  doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold').text('BILL TO', 50, 120);
  doc.fillColor('#16232E').fontSize(11).font('Helvetica-Bold').text(customer.name || 'Customer', 50, 134);
  doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica');
  let y = 150;
  [customer.company, customer.address, customer.email, customer.phone].filter(Boolean).forEach((line) => {
    doc.text(line, 50, y);
    y += 13;
  });

  let dy = 120;
  Object.entries(dates).forEach(([label, value]) => {
    if (!value) return;
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold').text(label.toUpperCase(), 350, dy, { width: 195, align: 'right' });
    doc.fillColor('#16232E').fontSize(10).font('Helvetica').text(String(value), 350, dy + 12, { width: 195, align: 'right' });
    dy += 32;
  });
}

function drawItemsTable(doc, items, currency, startY) {
  let y = startY;
  doc.fillColor('#FFFFFF').rect(50, y, 495, 22).fill(BRAND_PRIMARY);
  doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold');
  doc.text('DESCRIPTION', 58, y + 6, { width: 240 });
  doc.text('QTY', 300, y + 6, { width: 50, align: 'right' });
  doc.text('UNIT PRICE', 350, y + 6, { width: 90, align: 'right' });
  doc.text('LINE TOTAL', 445, y + 6, { width: 90, align: 'right' });
  y += 22;

  doc.font('Helvetica').fontSize(9.5);
  items.forEach((line, idx) => {
    const rowHeight = 20;
    if (idx % 2 === 1) doc.fillColor('#F3F5F7').rect(50, y, 495, rowHeight).fill();
    doc.fillColor('#16232E');
    doc.text(String(line.description), 58, y + 5, { width: 235 });
    doc.text(String(Number(line.quantity)), 300, y + 5, { width: 50, align: 'right' });
    doc.text(money(line.unit_price ?? line.unitPrice, currency), 350, y + 5, { width: 90, align: 'right' });
    doc.text(money(line.line_total ?? line.lineTotal, currency), 445, y + 5, { width: 90, align: 'right' });
    y += rowHeight;

    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  });

  doc.moveTo(50, y).lineTo(545, y).strokeColor('#DCE2E8').stroke();
  return y + 10;
}

function drawTotals(doc, doc_, startY) {
  let y = startY;
  const rows = [
    ['Subtotal', doc_.subtotal],
    doc_.discount_amount > 0 || doc_.discountAmount > 0 ? ['Discount', -(doc_.discount_amount ?? doc_.discountAmount)] : null,
    (doc_.tax_amount ?? doc_.taxAmount) > 0 ? ['Tax', doc_.tax_amount ?? doc_.taxAmount] : null,
    (doc_.shipping_amount ?? doc_.shippingAmount) > 0 ? ['Shipping', doc_.shipping_amount ?? doc_.shippingAmount] : null,
    (doc_.labour_amount ?? doc_.labourAmount) > 0 ? ['Labour', doc_.labour_amount ?? doc_.labourAmount] : null,
  ].filter(Boolean);

  doc.fontSize(9.5).font('Helvetica');
  rows.forEach(([label, value]) => {
    doc.fillColor(TEXT_MUTED).text(label, 350, y, { width: 100 });
    doc.fillColor('#16232E').text(money(value, doc_.currency), 445, y, { width: 90, align: 'right' });
    y += 16;
  });

  y += 4;
  doc.fillColor(BRAND_PRIMARY).rect(340, y, 205, 26).fill();
  doc.fillColor('#FFFFFF').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', 350, y + 7, { width: 100 });
  doc.text(money(doc_.total, doc_.currency), 445, y + 7, { width: 90, align: 'right' });
  y += 34;

  if (doc_.paid_amount !== undefined || doc_.paidAmount !== undefined) {
    const paid = doc_.paid_amount ?? doc_.paidAmount;
    const balance = doc_.balance_amount ?? doc_.balanceAmount;
    doc.fillColor(TEXT_MUTED).fontSize(9.5).font('Helvetica');
    doc.text('Paid', 350, y, { width: 100 });
    doc.fillColor('#2E9E6B').text(money(paid, doc_.currency), 445, y, { width: 90, align: 'right' });
    y += 16;
    doc.fillColor(TEXT_MUTED).text('Balance due', 350, y, { width: 100 });
    doc.fillColor(balance > 0 ? '#D94F4F' : '#2E9E6B').font('Helvetica-Bold').text(money(balance, doc_.currency), 445, y, { width: 90, align: 'right' });
    y += 20;
  }

  return y;
}

function drawFooter(doc, notes, terms, footerText) {
  let y = 720;
  if (notes) {
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold').text('NOTES', 50, y);
    doc.fillColor('#16232E').fontSize(9).font('Helvetica').text(notes, 50, y + 12, { width: 495 });
    y += 40;
  }
  if (terms) {
    doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold').text('TERMS', 50, y);
    doc.fillColor('#16232E').fontSize(9).font('Helvetica').text(terms, 50, y + 12, { width: 495 });
  }
  doc.fillColor(TEXT_MUTED).fontSize(8).text(footerText || 'Generated by FRANKY TECH — Build. Manage. Grow.', 50, 770, { width: 495, align: 'center' });
}

function streamInvoicePdf(res, invoice, business) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${invoice.invoice_number}.pdf"`);
  doc.pipe(res);

  drawHeader(doc, business, 'Invoice', invoice.invoice_number);
  drawParties(doc, {
    name: invoice.customer_name,
    email: invoice.customer_email,
    phone: invoice.customer_phone,
    address: invoice.customer_address,
  }, { 'Issue date': invoice.issue_date, 'Due date': invoice.due_date, Status: invoice.status.replace('_', ' ') });

  const afterTable = drawItemsTable(doc, invoice.items, invoice.currency, 210);
  const afterTotals = drawTotals(doc, invoice, afterTable + 10);
  drawFooter(doc, invoice.notes, invoice.terms, business.invoice_footer);

  doc.end();
}

function streamQuotationPdf(res, quotation, business) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${quotation.quotation_number}.pdf"`);
  doc.pipe(res);

  drawHeader(doc, business, 'Quotation', quotation.quotation_number);
  drawParties(doc, {
    name: quotation.customer_name,
    email: quotation.customer_email,
    phone: quotation.customer_phone,
    address: quotation.customer_address,
  }, { 'Issue date': quotation.issue_date, 'Valid until': quotation.valid_until, Status: quotation.status });

  const afterTable = drawItemsTable(doc, quotation.items, quotation.currency, 210);
  drawTotals(doc, quotation, afterTable + 10);
  drawFooter(doc, quotation.notes, quotation.terms, business.invoice_footer);

  doc.end();
}

function streamReceiptPdf(res, receipt, business) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${receipt.receipt_number}.pdf"`);
  doc.pipe(res);

  drawHeader(doc, business, 'Receipt', receipt.receipt_number);
  doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold').text('RECEIVED FROM', 50, 120);
  doc.fillColor('#16232E').fontSize(11).font('Helvetica-Bold').text(receipt.customer_name, 50, 134);

  doc.fillColor(TEXT_MUTED).fontSize(9).font('Helvetica-Bold').text('FOR INVOICE', 350, 120, { width: 195, align: 'right' });
  doc.fillColor('#16232E').fontSize(10).font('Helvetica').text(receipt.invoice_number, 350, 134, { width: 195, align: 'right' });

  doc.fillColor(BRAND_PRIMARY).rect(50, 180, 495, 40).fill();
  doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold').text(`Amount received: ${money(receipt.amount, receipt.currency)}`, 60, 192);

  doc.fillColor(TEXT_MUTED).fontSize(9.5).font('Helvetica');
  doc.text(`Payment method: ${String(receipt.method || '').replace('_', ' ')}`, 50, 240);
  doc.text(`Balance remaining on invoice: ${money(receipt.balance_after, receipt.currency)}`, 50, 258);
  doc.text(`Date: ${new Date(receipt.created_at).toLocaleString()}`, 50, 276);

  drawFooter(doc, null, null, business.invoice_footer);
  doc.end();
}

module.exports = { streamInvoicePdf, streamQuotationPdf, streamReceiptPdf };
