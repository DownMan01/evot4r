import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface ReceiptData {
  electionTitle: string;
  electionId: string;
  votingDate: string;
  selectedCandidates: Array<{
    position: string;
    candidate: string;
  }>;
  receiptId: string;
  verificationToken: string;
}

export const generateVotingReceipt = async (data: ReceiptData): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = 25;

  const lineGap = 6;
  const sectionSpacing = 12;
  const smallSpacing = 4;

  const primaryColor: [number, number, number] = [60, 131, 246];
  const darkText: [number, number, number] = [33, 37, 41];
  const lightText: [number, number, number] = [100, 100, 100];
  const bgRowColor: [number, number, number] = [245, 248, 255];
  const warningColor: [number, number, number] = [200, 30, 30];
  const successColor: [number, number, number] = [0, 128, 0];

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('OFFICIAL VOTING RECEIPT', pageWidth / 2, y, { align: 'center' });

  y += 10;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += sectionSpacing;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Election Information', margin, y);
  y += lineGap;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);
  doc.text(`• Title: ${data.electionTitle}`, margin, y); y += lineGap;
  doc.text(`• Election ID: ${data.electionId}`, margin, y); y += lineGap;
  doc.text(`• Voting Date: ${data.votingDate}`, margin, y); y += lineGap;
  doc.text(`• Receipt ID: ${data.receiptId}`, margin, y);

  y += sectionSpacing;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += sectionSpacing;

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkText);
  doc.text('Your Selections', margin, y);
  y += lineGap;

  const labelWidths = data.selectedCandidates.map(sel => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    return doc.getTextWidth(`${sel.position}:`);
  });
  const maxLabelWidth = Math.max(...labelWidths);
  const labelX = margin + 5;
  const gap = 5;
  const candidateX = labelX + maxLabelWidth + gap;
  const rowHeight = lineGap + 4;

  data.selectedCandidates.forEach((selection, index) => {
    if (index % 2 === 0) {
      doc.setFillColor(...bgRowColor);
      doc.rect(margin, y - 2, pageWidth - 2 * margin, rowHeight, 'F');
    }

    const label = `${selection.position}:`;
    doc.setFontSize(11);
    const textY = y + rowHeight / 2 - 1;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(label, labelX, textY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkText);
    const maxTextWidth = pageWidth - margin - candidateX;
    const candidateTextWidth = doc.getTextWidth(selection.candidate);

    if (candidateTextWidth > maxTextWidth) {
      const wrappedText = doc.splitTextToSize(selection.candidate, maxTextWidth);
      doc.text(wrappedText, candidateX, y + lineGap);
      y += wrappedText.length * doc.getFontSize() * 0.35;
    } else {
      doc.text(selection.candidate, candidateX, textY);
      y += rowHeight;
    }

    y += smallSpacing;
  });

  y += sectionSpacing;
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += sectionSpacing;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...warningColor);
  doc.text('Important Notice', margin, y);
  y += lineGap;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);

  const notice = 'This receipt confirms the successful submission of your vote, affirms your right to anonymity and data privacy, serves as a verifiable personal record, and provides essential details for future reference or verification. For concerns, contact your election authorities.';
  const splitNotice = doc.splitTextToSize(notice, pageWidth - margin * 2);
  doc.text(splitNotice, margin, y);
  y += splitNotice.length * doc.getFontSize() * 0.35;

  y += sectionSpacing;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('Verify Your Vote', margin, y);
  y += lineGap;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...lightText);
  doc.text('Scan the QR code below to verify your vote was recorded:', margin, y);

  const qrSize = 40;
  const qrSpace = qrSize + 20;

  if (y + qrSpace > pageHeight - 30) {
    doc.addPage();
    y = 30;
  }

  const verificationUrl = `${window.location.origin}/verify?receiptId=${data.receiptId}&token=${data.verificationToken}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: qrSize,
    margin: 1,
    color: { dark: '#3C83F6', light: '#FFFFFF' }
  });

  const qrX = (pageWidth - qrSize) / 2;
  doc.addImage(qrDataUrl, 'PNG', qrX, y + 10, qrSize, qrSize);
  y += qrSize + 20;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...successColor);
  doc.text('Thank you for participating in the democratic process!', pageWidth / 2, y, { align: 'center' });

  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated at: ${new Date().toLocaleString()}`, pageWidth / 2, footerY, { align: 'center' });

  const sanitizedName = data.electionTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `vote_receipt_${sanitizedName}_${timestamp}.pdf`;

  doc.save(filename);
};

export const downloadReceipt = (receiptContent: string, filename: string = 'voting-receipt.txt') => {
  const blob = new Blob([receiptContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const generateReceiptId = (electionId: string): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${electionId.substring(0, 8)}-${timestamp}-${random}`.toUpperCase();
};
