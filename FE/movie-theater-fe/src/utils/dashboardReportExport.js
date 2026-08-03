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

const toIsoDate = (date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const formatDateRange = (start, end = start) =>
  start === end ? start : `${start}-to-${end}`;

const getReportPeriod = (filters, generatedAt) => {
  if (filters.timeFilter === "CUSTOM" && filters.startDate && filters.endDate) {
    return formatDateRange(filters.startDate, filters.endDate);
  }

  const now = new Date(generatedAt);
  const start = new Date(now);
  const end = new Date(now);

  switch (filters.timeFilter) {
    case "TODAY":
      return toIsoDate(now);
    case "THIS_WEEK": {
      const weekday = (now.getDay() + 6) % 7;
      start.setDate(now.getDate() - weekday);
      end.setDate(start.getDate() + 6);
      return formatDateRange(toIsoDate(start), toIsoDate(end));
    }
    case "THIS_MONTH":
      start.setDate(1);
      end.setMonth(now.getMonth() + 1, 0);
      return formatDateRange(toIsoDate(start), toIsoDate(end));
    case "THIS_QUARTER": {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      start.setMonth(quarterStartMonth, 1);
      end.setMonth(quarterStartMonth + 3, 0);
      return formatDateRange(toIsoDate(start), toIsoDate(end));
    }
    case "THIS_YEAR":
      start.setMonth(0, 1);
      end.setMonth(11, 31);
      return formatDateRange(toIsoDate(start), toIsoDate(end));
    default:
      return toIsoDate(now);
  }
};

const getReportFilenamePrefix = (timeFilter) => ({
  TODAY: "report",
  THIS_WEEK: "weekly-report",
  THIS_MONTH: "monthly-report",
  THIS_QUARTER: "quarterly-report",
  THIS_YEAR: "yearly-report",
  CUSTOM: "report",
}[timeFilter] || "report");

export const buildReportMeta = ({ filters, movies, generatedAt = new Date(), adminName }) => {
  const selectedMovie = movies.find((movie) => movie.movieId === filters.movieId);
  const period = getReportPeriod(filters, generatedAt);

  return {
    title: "Báo cáo kinh doanh",
    period,
    filenamePrefix: getReportFilenamePrefix(filters.timeFilter),
    selectedMovie: selectedMovie?.movieName || "Tất cả phim",
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

const buildSheets = (overview, meta) => {
  const kpis = overview.kpis || {};
  const movieRows = getRevenueByMovieRows(overview);
  return [
    { name: "Tổng quan", rows: [[textCell(meta.title, true)], [textCell("Khoảng thời gian", true), textCell(meta.period)], [textCell("Phim đã chọn", true), textCell(meta.selectedMovie)], [textCell("Thời gian xuất", true), textCell(`${meta.generatedDate} ${meta.generatedTime}`)], emptyRow(), [textCell("Tổng quan KPI", true)], [textCell("Chỉ số", true), textCell("Giá trị", true)], [textCell("Tổng doanh thu"), numberCell(kpis.totalRevenue, { currency: true })], [textCell("Tỷ lệ lấp đầy trung bình"), numberCell(kpis.averageOccupancyRate / 100, { percent: true })]] },
    { name: "Doanh thu theo phim", rows: [[textCell("Doanh thu theo phim", true)], [textCell("Phim", true), textCell("Doanh thu", true), textCell("Tỷ trọng doanh thu", true)], ...movieRows.map((item) => [textCell(item.movieName), numberCell(item.totalRevenue, { currency: true }), numberCell(item.revenuePercentage / 100, { percent: true })])] },
    { name: "Vé theo khung giờ", rows: [[textCell("Vé bán theo khung giờ", true)], [textCell("Khung giờ", true), textCell("Vé đã bán", true)], ...(overview.ticketSalesByTimeSlot || []).map((item) => [textCell(item.timeSlot), numberCell(item.ticketsSold)])] },
    { name: "Phim doanh thu cao", rows: [[textCell("Phim có doanh thu cao nhất", true)], [textCell("Phim", true), textCell("Vé đã bán", true), textCell("Doanh thu", true), textCell("Tỷ lệ lấp đầy", true)], ...(overview.topRevenueMovies || []).map((item) => [textCell(item.movieName), numberCell(item.ticketsSold), numberCell(item.totalRevenue, { currency: true }), numberCell(item.averageOccupancyRate / 100, { percent: true })])] },
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
  const sheets = buildSheets(overview, meta);
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  ${sheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n  ")}
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
  ${sheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("\n  ")}
  <Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets.map((sheet, index) => `<sheet name="${sheet.name}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets>
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
    ...sheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: sheetXml(sheet.rows) })),
  ];

  const zip = createZip(files);
  downloadBlob(
    new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${meta.filenamePrefix}-${sanitizeFilename(meta.period)}-${Date.now()}.xlsx`,
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
  const revenueByMovie = getRevenueByMovieRows(overview);

  return [
    `Thời gian xuất: ${meta.generatedDate} ${meta.generatedTime}`,
    `Khoảng thời gian: ${meta.period}`,
    `Phim đã chọn: ${meta.selectedMovie}`,
    `Tài khoản quản trị: ${meta.adminName}`,
    "",
    "Tổng quan KPI",
    `Tổng doanh thu: ${formatPdfMoney(kpis.totalRevenue)}`,
    `Tỷ lệ lấp đầy trung bình: ${formatReportPercent(kpis.averageOccupancyRate)}`,
    "",
    "Doanh thu theo phim",
    ...revenueByMovie.map((item) => `${item.movieName} | ${formatPdfMoney(item.totalRevenue)} | ${formatReportPercent(item.revenuePercentage)}`),
    "",
    "Vé bán theo khung giờ",
    ...(overview.ticketSalesByTimeSlot || []).map((item) => `${item.timeSlot} | ${formatReportNumber(item.ticketsSold)} vé`),
    "",
    "Phim có doanh thu cao nhất",
    ...(overview.topRevenueMovies || []).map(
      (item) =>
        `${item.movieName} | Vé: ${formatReportNumber(item.ticketsSold)} | Doanh thu: ${formatPdfMoney(item.totalRevenue)} | Lấp đầy: ${formatReportPercent(item.averageOccupancyRate)}`,
    ),
    "",
    `Người xuất: ${meta.adminName} | ${meta.generatedDate} ${meta.generatedTime}`,
  ];
};

export const exportDashboardToPdf = (overview, meta) => {
  const kpis = overview.kpis || {};
  const movieRows = getRevenueByMovieRows(overview);
  const pageRows = [
    ["Tổng quan KPI", `Tổng doanh thu: ${formatReportMoney(kpis.totalRevenue)}`, `Tỷ lệ lấp đầy trung bình: ${formatReportPercent(kpis.averageOccupancyRate)}`],
    ["Doanh thu theo phim", ...movieRows.map((item) => `${item.movieName} | ${formatReportMoney(item.totalRevenue)} | ${formatReportPercent(item.revenuePercentage)}`)],
    ["Vé bán theo khung giờ", ...(overview.ticketSalesByTimeSlot || []).map((item) => `${item.timeSlot} | ${formatReportNumber(item.ticketsSold)} vé`)],
    ["Phim có doanh thu cao nhất", ...(overview.topRevenueMovies || []).map((item) => `${item.movieName} | Vé: ${formatReportNumber(item.ticketsSold)} | Doanh thu: ${formatReportMoney(item.totalRevenue)} | Lấp đầy: ${formatReportPercent(item.averageOccupancyRate)}`)],
  ];
  const images = pageRows.map((lines, pageIndex) => {
    const canvas = document.createElement("canvas"); canvas.width = 1190; canvas.height = 1684;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 1190, 1684);
    ctx.fillStyle = "#C00000"; ctx.font = "bold 42px Arial, sans-serif"; ctx.fillText(meta.title, 100, 110); ctx.fillRect(100, 130, 990, 3);
    ctx.fillStyle = "#555"; ctx.font = "20px Arial, sans-serif"; ctx.fillText(`Khoảng thời gian: ${meta.period}`, 100, 165);
    let y = 230; lines.forEach((line, index) => { const heading = index === 0; ctx.fillStyle = heading ? "#C00000" : "#1f2937"; ctx.font = heading ? "bold 27px Arial, sans-serif" : "20px Arial, sans-serif"; ctx.fillText(String(line).slice(0, 105), 100, y); y += heading ? 45 : 32; });
    ctx.fillStyle = "#6b7280"; ctx.font = "16px Arial, sans-serif"; ctx.fillText(`Xuất lúc ${meta.generatedDate} ${meta.generatedTime} | Trang ${pageIndex + 1}/${pageRows.length}`, 100, 1630);
    const binary = atob(canvas.toDataURL("image/jpeg", 0.95).split(",")[1]); return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  });
  const encoder = new TextEncoder(); const ascii = (value) => encoder.encode(value); const join = (parts) => { const size = parts.reduce((sum, part) => sum + part.length, 0); const result = new Uint8Array(size); let offset = 0; parts.forEach((part) => { result.set(part, offset); offset += part.length; }); return result; };
  const pageRefs = images.map((_, index) => 5 + index * 3); const objects = [ascii("<< /Type /Catalog /Pages 2 0 R >>"), ascii(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${images.length} >>`)];
  images.forEach((image, index) => { const imageRef = 3 + index * 3; const contentRef = imageRef + 1; const draw = `q\n595 0 0 842 0 0 cm\n/Im${index} Do\nQ\n`; objects.push(join([ascii(`<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`), image, ascii("\nendstream")])); objects.push(ascii(`<< /Length ${ascii(draw).length} >>\nstream\n${draw}endstream`)); objects.push(ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${index} ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`)); });
  const parts = [ascii("%PDF-1.4\n")]; const offsets = [0]; let offset = parts[0].length; objects.forEach((object, index) => { offsets.push(offset); const wrapped = join([ascii(`${index + 1} 0 obj\n`), object, ascii("\nendobj\n")]); parts.push(wrapped); offset += wrapped.length; }); const xref = offset; parts.push(ascii(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((item) => `${String(item).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
  downloadBlob(new Blob([join(parts)], { type: "application/pdf" }), `${meta.filenamePrefix}-${sanitizeFilename(meta.period)}-${Date.now()}.pdf`);
  return;

  {
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
  const boldFontRef = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  pages.forEach((pageLines, pageIndex) => {
    const commands = [
      "0.75 0 0 rg", "BT", "/F2 20 Tf", "50 790 Td", `(${escapePdfText(pageIndex === 0 ? meta.title : "Bao cao kinh doanh").slice(0, 80)}) Tj`, "ET",
      "0.75 0 0 RG", "1 w", "50 775 m", "545 775 l", "S",
      "0.35 0.35 0.35 rg", "BT", "/F1 9 Tf", "50 758 Td", `(Khoang thoi gian: ${escapePdfText(meta.period)}) Tj`, "ET",
      "0 0 0 rg", "BT", "/F1 10 Tf", "50 735 Td",
      ...pageLines.flatMap((line, lineIndex) => [
        lineIndex === 0 ? "" : "0 -16 Td",
        line.endsWith(":") || ["Tong quan KPI", "Doanh thu theo phim", "Ve ban theo khung gio", "Phim co doanh thu cao nhat"].includes(line) ? "/F2 11 Tf" : "/F1 10 Tf",
        `(${escapePdfText(line).slice(0, 105)}) Tj`,
      ]),
      "ET",
      "0.45 0.45 0.45 rg", "BT /F1 8 Tf 50 35 Td", `(Xuat luc ${escapePdfText(meta.generatedDate)} ${escapePdfText(meta.generatedTime)} | Trang ${pageIndex + 1}/${pages.length}) Tj`, "ET",
    ]
      .filter(Boolean)
      .join("\n");
    const streamRef = addObject(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
    const pageRef = addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontRef} 0 R /F2 ${boldFontRef} 0 R >> >> /Contents ${streamRef} 0 R >>`);
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

  downloadBlob(new Blob([pdf], { type: "application/pdf" }), `${meta.filenamePrefix}-${sanitizeFilename(meta.period)}-${Date.now()}.pdf`);
  }
};
