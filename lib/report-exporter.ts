'use client';

export interface ReportExportConfig {
  reportId: 'daily' | 'monthly' | 'users' | 'revenue' | 'ads' | 'content' | 'district';
  reportTitle: string;
  reportSubtitle?: string;
  filename: string;
  headers: string[];
  data: (string | number)[][];
  dateRange?: string;
  summaryMetrics?: { label: string; value: string | number }[];
}

/**
 * Format timestamp for filename e.g. 2026-10-01_11-45
 */
function getTimestampString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Clean printable text representation
 */
function sanitizeValue(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val);
}

/**
 * Export report to formatted Excel (.xlsx) file
 */
export async function exportToExcel(config: ReportExportConfig): Promise<void> {
  const XLSX = await import('xlsx');

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Prepare header metadata rows
  const metaRows: (string | number)[][] = [
    ['GRAMIN BHARAT TV & NAMDAR MAHARASHTRA • OTT ADMIN CONSOLE'],
    [config.reportTitle.toUpperCase()],
    ['Report Subtitle:', config.reportSubtitle || 'Official Analytics & Broadcasting Report'],
    ['Generated Date & Time:', nowFormatted],
    ['Filter Period / Date Range:', config.dateRange || 'All Available Records'],
    ['Total Records:', config.data.length],
  ];

  // Optional summary metrics in header
  if (config.summaryMetrics && config.summaryMetrics.length > 0) {
    metaRows.push([]);
    metaRows.push(['--- SUMMARY METRICS ---']);
    config.summaryMetrics.forEach((m) => {
      metaRows.push([m.label, m.value]);
    });
  }

  metaRows.push([]); // blank separator row
  metaRows.push(config.headers); // Table column headers

  // Add all data rows
  const allRows: (string | number)[][] = [...metaRows, ...config.data];

  // If summary metrics, also add a bottom summary footer
  if (config.summaryMetrics && config.summaryMetrics.length > 0) {
    allRows.push([]);
    allRows.push(['--- END OF REPORT ---']);
  }

  // Convert to worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Auto-calculate column widths
  const colWidths = config.headers.map((h, colIdx) => {
    let maxLen = h.length;
    config.data.forEach((row) => {
      const val = row[colIdx];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 14), 50) };
  });

  ws['!cols'] = colWidths;

  // Create workbook and append sheet
  const wb = XLSX.utils.book_new();
  const sheetName = config.reportTitle.substring(0, 31).replace(/[:\\\/\?\*\[\]]/g, ' ');
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Write and trigger browser download
  const filename = `${config.filename}_${getTimestampString()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export report to professional, printable PDF (.pdf) file
 */
export async function exportToPDF(config: ReportExportConfig): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTableModule = await import('jspdf-autotable');
  const autoTable = autoTableModule.default || autoTableModule;

  // Decide orientation: Landscape if more than 5 columns for readability
  const isLandscape = config.headers.length > 5;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const nowFormatted = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Top Brand Header Banner (Midnight Navy #0F172A)
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(margin, 12, pageWidth - margin * 2, 22, 'F');

  // Decorative Accent Bar (Matcha Emerald #166534)
  doc.setFillColor(22, 101, 52); // #166534
  doc.rect(margin, 34, pageWidth - margin * 2, 1.5, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('GRAMIN BHARAT TV • OTT CONSOLE', margin + 6, 21);

  // Tagline & Subtitle
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('Namdar Maharashtra • Official Broadcasting & Analytics Network', margin + 6, 28);

  // Generation Timestamp on Top Right
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text(`Generated: ${nowFormatted}`, pageWidth - margin - 6, 21, { align: 'right' });
  doc.text(`Status: Certified Live Data`, pageWidth - margin - 6, 28, { align: 'right' });

  // Report Title Section
  let currentY = 43;
  doc.setTextColor(45, 37, 34); // Foreground #2D2522
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(config.reportTitle, margin, currentY);

  currentY += 5.5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  const subText = config.reportSubtitle || 'Real-time performance and analytics report for administrative review.';
  doc.text(`${subText} | Range: ${config.dateRange || 'All Data'} | Total Rows: ${config.data.length}`, margin, currentY);

  // Summary Metrics Pills (if available)
  currentY += 5;
  if (config.summaryMetrics && config.summaryMetrics.length > 0) {
    const pillWidth = Math.min((pageWidth - margin * 2) / config.summaryMetrics.length - 3, 55);
    const pillHeight = 11;
    let pillX = margin;

    config.summaryMetrics.forEach((m) => {
      // Background pill
      doc.setFillColor(250, 247, 242); // #FAF7F2
      doc.setDrawColor(229, 219, 202); // #E5DBCA
      doc.roundedRect(pillX, currentY, pillWidth, pillHeight, 2, 2, 'FD');

      // Label
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(122, 111, 104); // #7A6F68
      doc.text(String(m.label).toUpperCase(), pillX + 3, currentY + 4);

      // Value
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(22, 101, 52); // #166534
      doc.text(String(m.value), pillX + 3, currentY + 9);

      pillX += pillWidth + 3;
    });

    currentY += pillHeight + 5;
  } else {
    currentY += 2;
  }

  // Sanitize data rows for PDF rendering
  const tableBody = config.data.map((row) =>
    row.map((cell) => sanitizeValue(cell))
  );

  // Generate Table using autoTable
  autoTable(doc, {
    startY: currentY,
    head: [config.headers],
    body: tableBody,
    theme: 'grid',
    margin: { left: margin, right: margin, bottom: 18 },
    headStyles: {
      fillColor: [15, 23, 42], // Midnight Navy
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2.8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [45, 37, 34],
      cellPadding: 2.2,
      lineColor: [229, 219, 202],
    },
    alternateRowStyles: {
      fillColor: [250, 247, 242], // Warm cream zebra
    },
    tableLineColor: [229, 219, 202],
    tableLineWidth: 0.15,
    didDrawPage: (data: any) => {
      // Footer on every page
      const pageNum = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);

      // Left footer
      doc.text(
        'Gramin Bharat TV & Namdar Maharashtra OTT Console • Confidential Administrative Document',
        margin,
        pageHeight - 8
      );

      // Right footer
      doc.text(
        `Page ${data.pageNumber} of ${pageNum}`,
        pageWidth - margin,
        pageHeight - 8,
        { align: 'right' }
      );
    },
  });

  // Save PDF file
  const filename = `${config.filename}_${getTimestampString()}.pdf`;
  doc.save(filename);
}
