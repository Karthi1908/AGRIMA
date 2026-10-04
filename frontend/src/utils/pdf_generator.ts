import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Client-side only PDF generation (Constitution Principle I: nothing is sent to or stored on a server).
 * Snapshots the element and paginates it across A4 pages. Throws on failure so the caller can show a message.
 */
export const generateRiskPDF = async (elementId: string, filename = 'agrima_risk_report.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Nothing to export.');

  const clone = element.cloneNode(true) as HTMLElement;
  
  // Enforce zero-retention PII client-side redaction (T066/T055)
  const piiPatterns = [
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, // Email
    /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // Phone
  ];
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
      let text = node.nodeValue;
      piiPatterns.forEach(r => { text = text.replace(r, '[REDACTED]'); });
      node.nodeValue = text;
    } else {
      node.childNodes.forEach(walk);
    }
  };
  walk(clone);
  
  clone.style.position = 'fixed';
  clone.style.left = '-20000px';
  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgH = (canvas.height * pageW) / canvas.width;

  let remaining = imgH;
  let offset = 0;
  pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH);
  remaining -= pageH;
  while (remaining > 0) {
    offset -= pageH;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, offset, pageW, imgH);
    remaining -= pageH;
  }

  pdf.save(filename);
  } finally {
    document.body.removeChild(clone);
  }
};
