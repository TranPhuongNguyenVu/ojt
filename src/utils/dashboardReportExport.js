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
    title: "BÁO CÁO KINH DOANH",
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
    { name: "Tổng quan", rows: [[textCell(meta.title, true)], [textCell("Khoảng thời gian", true), textCell(meta.period)], [textCell("Phim đã chọn", true), textCell(meta.selectedMovie)], [textCell("Thời gian xuất", true), textCell(`${meta.generatedDate} ${meta.generatedTime}`)], emptyRow(), [textCell("Tổng quan:", true)], [textCell("Chỉ số", true), textCell("Giá trị", true)], [textCell("Tổng doanh thu"), numberCell(kpis.totalRevenue, { currency: true })], [textCell("Tỷ lệ lấp đầy trung bình"), numberCell(kpis.averageOccupancyRate / 100, { percent: true })]] },
    { name: "Doanh thu theo phim", rows: [[textCell("Doanh thu theo phim", true)], [textCell("Phim", true), textCell("Doanh thu", true), textCell("Tỷ trọng doanh thu", true)], ...movieRows.map((item) => [textCell(item.movieName), numberCell(item.totalRevenue, { currency: true }), numberCell(item.revenuePercentage / 100, { percent: true })])] },
    { name: "Vé theo khung giờ", rows: [[textCell("Vé bán theo khung giờ", true)], [textCell("Khung giờ", true), textCell("Vé đã bán", true)], ...(overview.ticketSalesByTimeSlot || []).map((item) => [textCell(item.timeSlot), numberCell(item.ticketsSold)])] },
    { name: "Top 5 phim doanh thu cao", rows: [[textCell("Top 5 phim doanh thu cao nhất", true)], [textCell("Phim", true), textCell("Vé đã bán", true), textCell("Doanh thu", true), textCell("Tỷ lệ lấp đầy", true)], ...(overview.topRevenueMovies || []).map((item) => [textCell(item.movieName), numberCell(item.ticketsSold), numberCell(item.totalRevenue, { currency: true }), numberCell(item.averageOccupancyRate / 100, { percent: true })])] },
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

const PDF_PAGE_WIDTH = 1190;
const PDF_PAGE_HEIGHT = 1684;
const PDF_MARGIN = 86;
const PDF_ROWS_PER_PAGE = 27;

const fitPdfText = (ctx, value, maxWidth) => {
  const text = String(value ?? "");
  if (ctx.measureText(text).width <= maxWidth) return text;

  let end = text.length;
  while (end > 0 && ctx.measureText(`${text.slice(0, end)}…`).width > maxWidth) end -= 1;
  return `${text.slice(0, end)}…`;
};

const drawPdfTable = (ctx, columns, rows, startY) => {
  const tableWidth = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
  const headerHeight = 48;
  const rowHeight = 42;
  const positions = columns.reduce((result, column) => {
    result.push((result.at(-1) || PDF_MARGIN) + tableWidth * column.width);
    return result;
  }, []);

  ctx.fillStyle = "#a71919";
  ctx.fillRect(PDF_MARGIN, startY, tableWidth, headerHeight);
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.fillStyle = "#fff";
  columns.forEach((column, index) => {
    const left = index === 0 ? PDF_MARGIN : positions[index - 1];
    const right = positions[index];
    ctx.textAlign = column.align || "left";
    ctx.fillText(fitPdfText(ctx, column.label, right - left - 24), column.align === "right" ? right - 12 : left + 12, startY + 31);
  });

  rows.forEach((row, rowIndex) => {
    const y = startY + headerHeight + rowIndex * rowHeight;
    ctx.fillStyle = rowIndex % 2 === 0 ? "#fff8f8" : "#ffffff";
    ctx.fillRect(PDF_MARGIN, y, tableWidth, rowHeight);
    ctx.strokeStyle = "#ead0d0";
    ctx.lineWidth = 1;
    ctx.strokeRect(PDF_MARGIN, y, tableWidth, rowHeight);
    ctx.font = "18px Arial, sans-serif";
    ctx.fillStyle = "#27303f";
    row.forEach((value, index) => {
      const column = columns[index];
      const left = index === 0 ? PDF_MARGIN : positions[index - 1];
      const right = positions[index];
      ctx.textAlign = column.align || "left";
      ctx.fillText(fitPdfText(ctx, value, right - left - 24), column.align === "right" ? right - 12 : left + 12, y + 27);
    });
  });
  ctx.textAlign = "left";
};

export const exportDashboardToPdf = (overview, meta) => {
  const kpis = overview.kpis || {};
  const operational = overview.operational || {};
  const movieRows = getRevenueByMovieRows(overview);
  const sections = [
    {
      title: "Tổng quan",
      columns: [{ label: "Chỉ số", width: 0.58 }, { label: "Giá trị", width: 0.42, align: "right" }],
      rows: [
        ["Tổng doanh thu", formatReportMoney(kpis.totalRevenue)],
        ["Tổng vé đã bán", formatReportNumber(kpis.totalTicketsSold)],
        ["Tỷ lệ lấp đầy trung bình", formatReportPercent(kpis.averageOccupancyRate)],
        ["Doanh thu trung bình / vé", formatReportMoney(kpis.averageRevenuePerTicket)],
        ["Suất chiếu đang hoạt động", formatReportNumber(operational.activeShowtimes)],
        ["Vé bán hôm nay", formatReportNumber(operational.ticketsSoldToday)],
        ["Doanh thu hôm nay", formatReportMoney(operational.todayRevenue)],
      ],
    },
    {
      title: "Doanh thu theo phim",
      columns: [{ label: "Phim", width: 0.48 }, { label: "Doanh thu", width: 0.32, align: "right" }, { label: "Tỷ trọng", width: 0.2, align: "right" }],
      rows: movieRows.map((item) => [item.movieName, formatReportMoney(item.totalRevenue), formatReportPercent(item.revenuePercentage)]),
    },
    {
      title: "Vé bán theo khung giờ",
      columns: [{ label: "Khung giờ", width: 0.6 }, { label: "Vé đã bán", width: 0.4, align: "right" }],
      rows: (overview.ticketSalesByTimeSlot || []).map((item) => [item.timeSlot, formatReportNumber(item.ticketsSold)]),
    },
    {
      title: "Top 5 phim có doanh thu cao nhất",
      columns: [{ label: "Phim", width: 0.35 }, { label: "Vé đã bán", width: 0.18, align: "right" }, { label: "Doanh thu", width: 0.27, align: "right" }, { label: "Lấp đầy", width: 0.2, align: "right" }],
      rows: (overview.topRevenueMovies || []).map((item) => [item.movieName, formatReportNumber(item.ticketsSold), formatReportMoney(item.totalRevenue), formatReportPercent(item.averageOccupancyRate)]),
    },
  ];
  const pages = sections.flatMap((section) => {
    const rows = section.rows.length
      ? section.rows
      : [section.columns.map((_, index) => (index === 0 ? "Chưa có dữ liệu" : ""))];
    return Array.from({ length: Math.ceil(rows.length / PDF_ROWS_PER_PAGE) }, (_, index) => ({
      ...section,
      title: index ? `${section.title} (tiếp theo)` : section.title,
      rows: rows.slice(index * PDF_ROWS_PER_PAGE, (index + 1) * PDF_ROWS_PER_PAGE),
    }));
  });
  const images = pages.map((page, pageIndex) => {
    const canvas = document.createElement("canvas"); canvas.width = PDF_PAGE_WIDTH; canvas.height = PDF_PAGE_HEIGHT;
    const ctx = canvas.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT);
    ctx.fillStyle = "#a71919"; ctx.fillRect(0, 0, PDF_PAGE_WIDTH, 22);
    ctx.fillStyle = "#a71919"; ctx.font = "bold 42px Arial, sans-serif"; ctx.fillText(meta.title, PDF_MARGIN, 105);
    ctx.fillStyle = "#5d6470"; ctx.font = "18px Arial, sans-serif"; ctx.fillText(`Khoảng thời gian: ${meta.period}  •  Phim: ${fitPdfText(ctx, meta.selectedMovie, 420)}`, PDF_MARGIN, 142);
    ctx.fillStyle = "#f9eeee"; ctx.fillRect(PDF_MARGIN, 174, PDF_PAGE_WIDTH - PDF_MARGIN * 2, 64);
    ctx.fillStyle = "#3a404a"; ctx.font = "17px Arial, sans-serif"; ctx.fillText(`Người xuất: ${meta.adminName}`, PDF_MARGIN + 18, 202); ctx.fillText(`Thời gian xuất: ${meta.generatedDate} ${meta.generatedTime}`, PDF_MARGIN + 18, 226);
    ctx.fillStyle = "#a71919"; ctx.font = "bold 27px Arial, sans-serif"; ctx.fillText(page.title, PDF_MARGIN, 292);
    drawPdfTable(ctx, page.columns, page.rows, 318);
    ctx.strokeStyle = "#d9dce1"; ctx.beginPath(); ctx.moveTo(PDF_MARGIN, 1580); ctx.lineTo(PDF_PAGE_WIDTH - PDF_MARGIN, 1580); ctx.stroke();
    ctx.fillStyle = "#707782"; ctx.font = "16px Arial, sans-serif"; ctx.fillText(`Báo cáo kinh doanh  |  Trang ${pageIndex + 1}/${pages.length}`, PDF_MARGIN, 1614);
    const binary = atob(canvas.toDataURL("image/jpeg", 0.95).split(",")[1]); return Uint8Array.from(binary, (char) => char.charCodeAt(0));
  });
  const encoder = new TextEncoder(); const ascii = (value) => encoder.encode(value); const join = (parts) => { const size = parts.reduce((sum, part) => sum + part.length, 0); const result = new Uint8Array(size); let offset = 0; parts.forEach((part) => { result.set(part, offset); offset += part.length; }); return result; };
  const pageRefs = images.map((_, index) => 5 + index * 3); const objects = [ascii("<< /Type /Catalog /Pages 2 0 R >>"), ascii(`<< /Type /Pages /Kids [${pageRefs.map((ref) => `${ref} 0 R`).join(" ")}] /Count ${images.length} >>`)];
  images.forEach((image, index) => { const imageRef = 3 + index * 3; const contentRef = imageRef + 1; const draw = `q\n595 0 0 842 0 0 cm\n/Im${index} Do\nQ\n`; objects.push(join([ascii(`<< /Type /XObject /Subtype /Image /Width 1190 /Height 1684 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`), image, ascii("\nendstream")])); objects.push(ascii(`<< /Length ${ascii(draw).length} >>\nstream\n${draw}endstream`)); objects.push(ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im${index} ${imageRef} 0 R >> >> /Contents ${contentRef} 0 R >>`)); });
  const parts = [ascii("%PDF-1.4\n")]; const offsets = [0]; let offset = parts[0].length; objects.forEach((object, index) => { offsets.push(offset); const wrapped = join([ascii(`${index + 1} 0 obj\n`), object, ascii("\nendobj\n")]); parts.push(wrapped); offset += wrapped.length; }); const xref = offset; parts.push(ascii(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((item) => `${String(item).padStart(10, "0")} 00000 n `).join("\n")}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`));
  downloadBlob(new Blob([join(parts)], { type: "application/pdf" }), `${meta.filenamePrefix}-${sanitizeFilename(meta.period)}-${Date.now()}.pdf`);
};
