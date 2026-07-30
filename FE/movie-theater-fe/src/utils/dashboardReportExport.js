const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

export const formatReportMoney = (value) => currencyFormatter.format(Number(value || 0));

export const formatReportNumber = (value) => numberFormatter.format(Number(value || 0));

export const formatReportPercent = (value) => `${Number(value || 0).toFixed(2)}%`;

export const getAdminAccountName = () => {
  try {
    const account = JSON.parse(localStorage.getItem("USER_LOGIN") || "{}");
    return account.fullName || account.employeeName || account.username || "Admin";
  } catch {
    return "Admin";
  }
};

export const buildReportMeta = ({ filters, movies, generatedAt = new Date(), adminName }) => {
  const selectedMovie = movies.find((movie) => movie.movieId === filters.movieId);
  const period =
    filters.timeFilter === "CUSTOM" && filters.startDate && filters.endDate
      ? `${filters.startDate} to ${filters.endDate}`
      : filters.timeFilter.replaceAll("_", " ");

  return {
    title: "Dashboard Business Report",
    period,
    selectedMovie: selectedMovie?.movieName || "All movies",
    generatedAt,
    generatedDate: generatedAt.toLocaleDateString("vi-VN"),
    generatedTime: generatedAt.toLocaleTimeString("vi-VN"),
    adminName: adminName || getAdminAccountName(),
  };
};

export const getRevenueByMovieRows = (overview) => {
  const rows = overview.revenueByMovie || [];
  const total = rows.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);

  return rows.map((item) => ({
    ...item,
    revenuePercentage: total ? (Number(item.totalRevenue || 0) / total) * 100 : 0,
  }));
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const sanitizeFilename = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const escapeXml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const columnName = (index) => {
  let name = "";
  let current = index + 1;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    current = Math.floor((current - 1) / 26);
  }
  return name;
};

const sheetXml = (rows) => {
  const body = rows
    .map((row, rowIndex) => {
      const cells = row
        .map((cell, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
          const style = cell.header ? ' s="1"' : cell.currency ? ' s="2"' : cell.percent ? ' s="3"' : "";

          if (typeof cell.value === "number") {
            return `<c r="${ref}"${style}><v>${cell.value}</v></c>`;
          }

          return `<c r="${ref}" t="inlineStr"${style}><is><t>${escapeXml(cell.value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"/></sheetViews>
  <sheetFormatPr defaultRowHeight="18"/>
  <cols>${Array.from({ length: 6 }, (_, index) => `<col min="${index + 1}" max="${index + 1}" width="${index === 0 ? 28 : 18}" customWidth="1"/>`).join("")}</cols>
  <sheetData>${body}</sheetData>
</worksheet>`;
};

const textCell = (value, header = false) => ({ value, header });
const numberCell = (value, options = {}) => ({ value: Number(value || 0), ...options });

const emptyRow = () => [textCell("")];

const buildWorkbookRows = (overview, meta) => {
  const kpis = overview.kpis || {};
  const operational = overview.operational || {};
  const revenueByMovie = getRevenueByMovieRows(overview);

  return [
    [textCell(meta.title, true)],
    [textCell("Report Period", true), textCell(meta.period), textCell("Selected Movie", true), textCell(meta.selectedMovie)],
    [textCell("Generation Date", true), textCell(meta.generatedDate), textCell("Generation Time", true), textCell(meta.generatedTime)],
    [textCell("Admin Account", true), textCell(meta.adminName)],
    emptyRow(),
    [textCell("KPI Summary", true)],
    [textCell("Metric", true), textCell("Value", true)],
    [textCell("Total Revenue"), numberCell(kpis.totalRevenue, { currency: true })],
    [textCell("Total Tickets Sold"), numberCell(kpis.totalTicketsSold)],
    [textCell("Average Occupancy Rate"), numberCell(kpis.averageOccupancyRate / 100, { percent: true })],
    [textCell("Average Revenue per Ticket"), numberCell(kpis.averageRevenuePerTicket, { currency: true })],
    emptyRow(),
    [textCell("Revenue Trend", true)],
    [textCell("Date / Week / Month", true), textCell("Revenue", true), textCell("Tickets Sold", true)],
    ...(overview.revenueTrend || []).map((item) => [
      textCell(item.label),
      numberCell(item.revenue, { currency: true }),
      numberCell(item.ticketsSold),
    ]),
    emptyRow(),
    [textCell("Revenue Distribution by Movie", true)],
    [textCell("Phim", true), textCell("Revenue", true), textCell("Revenue Percentage", true)],
    ...revenueByMovie.map((item) => [
      textCell(item.movieName),
      numberCell(item.totalRevenue, { currency: true }),
      numberCell(item.revenuePercentage / 100, { percent: true }),
    ]),
    emptyRow(),
    [textCell("Ticket Sales by Time Slot", true)],
    [textCell("Time Slot", true), textCell("Tickets Sold", true)],
    ...(overview.ticketSalesByTimeSlot || []).map((item) => [textCell(item.timeSlot), numberCell(item.ticketsSold)]),
    emptyRow(),
    [textCell("Top Revenue Movies", true)],
    [textCell("Phim", true), textCell("Tickets Sold", true), textCell("Total Revenue", true), textCell("Average Occupancy Rate", true)],
    ...(overview.topRevenueMovies || []).map((item) => [
      textCell(item.movieName),
      numberCell(item.ticketsSold),
      numberCell(item.totalRevenue, { currency: true }),
      numberCell(item.averageOccupancyRate / 100, { percent: true }),
    ]),
    emptyRow(),
    [textCell("Current Operational Statistics", true)],
    [textCell("Active Showtimes", true), textCell("Tickets Sold Today", true), textCell("Today's Total Revenue", true)],
    [numberCell(operational.activeShowtimes), numberCell(operational.ticketsSoldToday), numberCell(operational.todayRevenue, { currency: true })],
    emptyRow(),
    [textCell(`Footer: ${meta.adminName} | Exported ${meta.generatedDate} ${meta.generatedTime}`, true)],
  ];
};

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

const crc32 = (bytes) => {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (bytes, value) => {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
};

const writeUint32 = (bytes, value) => {
  bytes.push(value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff);
};

const createZip = (files) => {
  const encoder = new TextEncoder();
  const bytes = [];
  const directory = [];

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = encoder.encode(file.content);
    const checksum = crc32(dataBytes);
    const offset = bytes.length;

    writeUint32(bytes, 0x04034b50);
    writeUint16(bytes, 20);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint32(bytes, checksum);
    writeUint32(bytes, dataBytes.length);
    writeUint32(bytes, dataBytes.length);
    writeUint16(bytes, nameBytes.length);
    writeUint16(bytes, 0);
    bytes.push(...nameBytes, ...dataBytes);

    directory.push({ nameBytes, dataBytes, checksum, offset });
  });

  const directoryOffset = bytes.length;

  directory.forEach((file) => {
    writeUint32(bytes, 0x02014b50);
    writeUint16(bytes, 20);
    writeUint16(bytes, 20);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint32(bytes, file.checksum);
    writeUint32(bytes, file.dataBytes.length);
    writeUint32(bytes, file.dataBytes.length);
    writeUint16(bytes, file.nameBytes.length);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint16(bytes, 0);
    writeUint32(bytes, 0);
    writeUint32(bytes, file.offset);
    bytes.push(...file.nameBytes);
  });

  const directorySize = bytes.length - directoryOffset;
  writeUint32(bytes, 0x06054b50);
  writeUint16(bytes, 0);
  writeUint16(bytes, 0);
  writeUint16(bytes, directory.length);
  writeUint16(bytes, directory.length);
  writeUint32(bytes, directorySize);
  writeUint32(bytes, directoryOffset);
  writeUint16(bytes, 0);

  return new Uint8Array(bytes);
};

export const exportDashboardToExcel = (overview, meta) => {
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Dashboard Report" sheetId="1" r:id="rId1"/></sheets>
</workbook>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0 [$VND]"/></numFmts>
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
    <xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  </cellXfs>
</styleSheet>`,
    },
    {
      name: "xl/worksheets/sheet1.xml",
      content: sheetXml(buildWorkbookRows(overview, meta)),
    },
  ];

  const zip = createZip(files);
  downloadBlob(
    new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `dashboard-report-${sanitizeFilename(meta.period)}-${Date.now()}.xlsx`,
  );
};

const escapePdfText = (value) => String(value ?? "").replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");

const toPdfText = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");

const formatPdfMoney = (value) => `${numberFormatter.format(Number(value || 0))} VND`;

const pdfLines = (overview, meta) => {
  const kpis = overview.kpis || {};
  const operational = overview.operational || {};
  const revenueByMovie = getRevenueByMovieRows(overview);

  return [
    meta.title,
    `Generated: ${meta.generatedDate} ${meta.generatedTime}`,
    `Report Period: ${meta.period}`,
    `Selected Movie: ${meta.selectedMovie}`,
    `Admin Account: ${meta.adminName}`,
    "",
    "KPI Summary",
    `Total Revenue: ${formatPdfMoney(kpis.totalRevenue)}`,
    `Total Tickets Sold: ${formatReportNumber(kpis.totalTicketsSold)}`,
    `Average Occupancy Rate: ${formatReportPercent(kpis.averageOccupancyRate)}`,
    `Average Revenue per Ticket: ${formatPdfMoney(kpis.averageRevenuePerTicket)}`,
    "",
    "Revenue Trend",
    ...(overview.revenueTrend || []).map((item) => `${item.label} | ${formatPdfMoney(item.revenue)} | Tickets: ${formatReportNumber(item.ticketsSold)}`),
    "",
    "Revenue Distribution by Movie",
    ...revenueByMovie.map((item) => `${item.movieName} | ${formatPdfMoney(item.totalRevenue)} | ${formatReportPercent(item.revenuePercentage)}`),
    "",
    "Ticket Sales by Time Slot",
    ...(overview.ticketSalesByTimeSlot || []).map((item) => `${item.timeSlot} | ${formatReportNumber(item.ticketsSold)} tickets`),
    "",
    "Top Revenue Movies",
    ...(overview.topRevenueMovies || []).map(
      (item) =>
        `${item.movieName} | Tickets: ${formatReportNumber(item.ticketsSold)} | Revenue: ${formatPdfMoney(item.totalRevenue)} | Occupancy: ${formatReportPercent(item.averageOccupancyRate)}`,
    ),
    "",
    "Current Operational Statistics",
    `Active Showtimes: ${formatReportNumber(operational.activeShowtimes)}`,
    `Tickets Sold Today: ${formatReportNumber(operational.ticketsSoldToday)}`,
    `Today's Total Revenue: ${formatPdfMoney(operational.todayRevenue)}`,
    "",
    `Footer: ${meta.adminName} | Exported ${meta.generatedDate} ${meta.generatedTime}`,
  ].map(toPdfText);
};

export const exportDashboardToPdf = (overview, meta) => {
  const lines = pdfLines(overview, meta);
  const pages = [];
  const linesPerPage = 42;

  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }

  const objects = [];
  const addObject = (content) => {
    objects.push(content);
    return objects.length;
  };

  const pageRefs = [];
  const fontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  pages.forEach((pageLines, pageIndex) => {
    const commands = [
      "BT",
      "/F1 11 Tf",
      "50 790 Td",
      ...pageLines.flatMap((line, lineIndex) => [
        lineIndex === 0 ? "" : "0 -17 Td",
        `(${escapePdfText(line).slice(0, 110)}) Tj`,
      ]),
      "ET",
      "BT /F1 9 Tf 50 35 Td",
      `(Page ${pageIndex + 1} of ${pages.length}) Tj`,
      "ET",
    ]
      .filter(Boolean)
      .join("\n");
    const streamRef = addObject(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
    const pageRef = addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRef} 0 R >> >> /Contents ${streamRef} 0 R >>`);
    pageRefs.push(pageRef);
  });

  const pagesRef = addObject(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${pageRefs.length} >>`);
  pageRefs.forEach((pageRef) => {
    objects[pageRef - 1] = objects[pageRef - 1].replace("/Parent 0 0 R", `/Parent ${pagesRef} 0 R`);
  });
  const catalogRef = addObject(`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogRef} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  downloadBlob(new Blob([pdf], { type: "application/pdf" }), `dashboard-report-${sanitizeFilename(meta.period)}-${Date.now()}.pdf`);
};
