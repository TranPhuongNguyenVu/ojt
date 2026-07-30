import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  Clapperboard,
  Download,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Percent,
  Printer,
  RefreshCw,
  Ticket,
  TrendingUp,
  Users,
} from "lucide-react";
import DashboardService from "../../services/DashboardService";
import {
  buildReportMeta,
  exportDashboardToExcel,
  exportDashboardToPdf,
  formatReportMoney,
  formatReportNumber,
  formatReportPercent,
  getAdminAccountName,
  getRevenueByMovieRows,
} from "../../utils/dashboardReportExport";

const TIME_FILTERS = [
  { value: "TODAY", label: "Today" },
  { value: "THIS_WEEK", label: "Week" },
  { value: "THIS_MONTH", label: "Month" },
  { value: "THIS_QUARTER", label: "Quarter" },
  { value: "THIS_YEAR", label: "Year" },
  { value: "CUSTOM", label: "Custom" },
];

const emptyOverview = {
  kpis: {},
  revenueTrend: [],
  revenueByMovie: [],
  ticketSalesByTimeSlot: [],
  topRevenueMovies: [],
  operational: {},
};

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const number = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));

const percent = (value) => `${Number(value || 0).toFixed(2)}%`;

const unwrap = (response) => response.data?.data ?? response.data;

const buildParams = (filters) => {
  const params = {
    timeFilter: filters.timeFilter,
    movieId: filters.movieId || undefined,
  };

  if (filters.timeFilter === "CUSTOM") {
    params.startDate = filters.startDate || undefined;
    params.endDate = filters.endDate || undefined;
  }

  return params;
};

const exceedsOneYear = (filters) => {
  if (filters.timeFilter !== "CUSTOM" || !filters.startDate || !filters.endDate) {
    return false;
  }

  const start = new Date(filters.startDate);
  const end = new Date(filters.endDate);
  const days = (end - start) / (1000 * 60 * 60 * 24) + 1;

  return days > 366;
};

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-black text-gray-950">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={21} strokeWidth={2.3} />
      </div>
    </div>
  </div>
);

const RevenueLine = ({ data }) => {
  const points = useMemo(() => {
    if (!data.length) return "";
    const max = Math.max(...data.map((item) => Number(item.revenue || 0)), 1);
    return data
      .map((item, index) => {
        const x = data.length === 1 ? 300 : (index / (data.length - 1)) * 600;
        const y = 190 - (Number(item.revenue || 0) / max) * 160;
        return `${x},${y}`;
      })
      .join(" ");
  }, [data]);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-black text-gray-950">Revenue Trend</h2>
        <BarChart3 size={19} className="text-[#C00000]" />
      </div>
      <div className="h-64">
        {data.length ? (
          <>
            <svg viewBox="0 0 600 210" className="h-52 w-full overflow-visible">
              <polyline
                fill="none"
                stroke="#C00000"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="4"
                points={points}
              />
              {points.split(" ").map((point) => {
                const [cx, cy] = point.split(",");
                return <circle key={point} cx={cx} cy={cy} r="4.5" fill="#C00000" />;
              })}
            </svg>
            <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 sm:grid-cols-5">
              {data.slice(0, 5).map((item) => (
                <span key={item.label} className="truncate">
                  {item.label}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-semibold text-gray-400">
            No revenue data
          </div>
        )}
      </div>
    </div>
  );
};

const MovieDistribution = ({ data }) => {
  const colors = ["#C00000", "#111827", "#F59E0B", "#2563EB", "#16A34A", "#9333EA"];
  const total = data.reduce((sum, item) => sum + Number(item.totalRevenue || 0), 0);
  let cursor = 0;
  const gradient = data.length
    ? data
        .map((item, index) => {
          const start = cursor;
          const slice = total ? (Number(item.totalRevenue || 0) / total) * 100 : 0;
          cursor += slice;
          return `${colors[index % colors.length]} ${start}% ${cursor}%`;
        })
        .join(", ")
    : "#E5E7EB 0% 100%";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-black text-gray-950">Revenue by Movie</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]">
        <div
          className="mx-auto h-44 w-44 rounded-full border border-gray-200"
          style={{ background: `conic-gradient(${gradient})` }}
          aria-label="Revenue distribution pie chart"
        />
        <div className="space-y-3">
          {data.length ? (
            data.slice(0, 6).map((item, index) => (
              <div key={item.movieId || item.movieName} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="truncate text-sm font-bold text-gray-700">{item.movieName}</span>
                </div>
                <span className="shrink-0 text-sm font-black text-gray-950">{money(item.totalRevenue)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm font-semibold text-gray-400">No movie revenue data</p>
          )}
        </div>
      </div>
    </div>
  );
};

const TimeSlotBars = ({ data }) => {
  const max = Math.max(...data.map((item) => Number(item.ticketsSold || 0)), 1);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-black text-gray-950">Ticket Sales by Time Slot</h2>
      <div className="mt-5 space-y-4">
        {data.length ? (
          data.map((item) => (
            <div key={item.timeSlot}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-bold text-gray-700">{item.timeSlot}</span>
                <span className="font-black text-gray-950">{number(item.ticketsSold)}</span>
              </div>
              <div className="h-3 rounded-full bg-gray-100">
                <div
                  className="h-3 rounded-full bg-[#C00000]"
                  style={{ width: `${Math.max((Number(item.ticketsSold || 0) / max) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-gray-400">No time slot data</p>
        )}
      </div>
    </div>
  );
};

const PrintReportTables = ({ overview }) => {
  const kpis = overview.kpis || {};
  const operational = overview.operational || {};
  const revenueByMovie = getRevenueByMovieRows(overview);

  return (
    <div className="hidden print:block">
      <section className="mt-6">
        <h2 className="text-base font-black text-gray-950">KPI Summary</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <tbody>
            <tr><td className="border px-2 py-1 font-bold">Total Revenue</td><td className="border px-2 py-1">{formatReportMoney(kpis.totalRevenue)}</td></tr>
            <tr><td className="border px-2 py-1 font-bold">Total Tickets Sold</td><td className="border px-2 py-1">{formatReportNumber(kpis.totalTicketsSold)}</td></tr>
            <tr><td className="border px-2 py-1 font-bold">Average Occupancy Rate</td><td className="border px-2 py-1">{formatReportPercent(kpis.averageOccupancyRate)}</td></tr>
            <tr><td className="border px-2 py-1 font-bold">Average Revenue per Ticket</td><td className="border px-2 py-1">{formatReportMoney(kpis.averageRevenuePerTicket)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-black text-gray-950">Revenue Trend</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead><tr><th className="border px-2 py-1 text-left">Date / week / month</th><th className="border px-2 py-1 text-left">Revenue</th><th className="border px-2 py-1 text-left">Tickets sold</th></tr></thead>
          <tbody>
            {(overview.revenueTrend || []).map((item) => (
              <tr key={item.label}><td className="border px-2 py-1">{item.label}</td><td className="border px-2 py-1">{formatReportMoney(item.revenue)}</td><td className="border px-2 py-1">{formatReportNumber(item.ticketsSold)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-black text-gray-950">Revenue Distribution by Movie</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead><tr><th className="border px-2 py-1 text-left">Phim</th><th className="border px-2 py-1 text-left">Revenue</th><th className="border px-2 py-1 text-left">Revenue percentage</th></tr></thead>
          <tbody>
            {revenueByMovie.map((item) => (
              <tr key={item.movieId || item.movieName}><td className="border px-2 py-1">{item.movieName}</td><td className="border px-2 py-1">{formatReportMoney(item.totalRevenue)}</td><td className="border px-2 py-1">{formatReportPercent(item.revenuePercentage)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-black text-gray-950">Ticket Sales by Time Slot</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead><tr><th className="border px-2 py-1 text-left">Time slot</th><th className="border px-2 py-1 text-left">Tickets sold</th></tr></thead>
          <tbody>
            {(overview.ticketSalesByTimeSlot || []).map((item) => (
              <tr key={item.timeSlot}><td className="border px-2 py-1">{item.timeSlot}</td><td className="border px-2 py-1">{formatReportNumber(item.ticketsSold)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-black text-gray-950">Top Revenue Movies</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <thead><tr><th className="border px-2 py-1 text-left">Phim</th><th className="border px-2 py-1 text-left">Tickets sold</th><th className="border px-2 py-1 text-left">Total revenue</th><th className="border px-2 py-1 text-left">Average occupancy rate</th></tr></thead>
          <tbody>
            {(overview.topRevenueMovies || []).map((item) => (
              <tr key={item.movieId || item.movieName}><td className="border px-2 py-1">{item.movieName}</td><td className="border px-2 py-1">{formatReportNumber(item.ticketsSold)}</td><td className="border px-2 py-1">{formatReportMoney(item.totalRevenue)}</td><td className="border px-2 py-1">{formatReportPercent(item.averageOccupancyRate)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-black text-gray-950">Current Operational Statistics</h2>
        <table className="mt-2 w-full border-collapse text-sm">
          <tbody>
            <tr><td className="border px-2 py-1 font-bold">Number of Active Showtimes</td><td className="border px-2 py-1">{formatReportNumber(operational.activeShowtimes)}</td></tr>
            <tr><td className="border px-2 py-1 font-bold">Tickets Sold Today</td><td className="border px-2 py-1">{formatReportNumber(operational.ticketsSoldToday)}</td></tr>
            <tr><td className="border px-2 py-1 font-bold">Today's Total Revenue</td><td className="border px-2 py-1">{formatReportMoney(operational.todayRevenue)}</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

const MainDashboard = () => {
  const [filters, setFilters] = useState({
    timeFilter: "THIS_MONTH",
    movieId: "",
    startDate: "",
    endDate: "",
  });
  const [movies, setMovies] = useState([]);
  const [overview, setOverview] = useState(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [refreshingOperational, setRefreshingOperational] = useState(false);
  const [refreshingDashboard, setRefreshingDashboard] = useState(false);
  const [exporting, setExporting] = useState("");
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [reportGeneratedAt, setReportGeneratedAt] = useState(new Date());

  const fetchOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await DashboardService.getOverview(buildParams(filters));
      const data = unwrap(response) || emptyOverview;
      setOverview({ ...emptyOverview, ...data });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOperational = async () => {
    setRefreshingOperational(true);
    try {
      const response = await DashboardService.getOperational();
      const operational = unwrap(response) || {};
      setOverview((current) => ({ ...current, operational }));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refresh operational statistics.");
    } finally {
      setRefreshingOperational(false);
    }
  };

  const refreshDashboard = async () => {
    setRefreshingDashboard(true);
    setError("");
    try {
      const response = await DashboardService.getOverview(buildParams(filters));
      const data = unwrap(response) || emptyOverview;
      setOverview({ ...emptyOverview, ...data });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refresh dashboard data.");
    } finally {
      setRefreshingDashboard(false);
    }
  };

  useEffect(() => {
    DashboardService.getMovies()
      .then((response) => setMovies(unwrap(response) || []))
      .catch(() => setMovies([]));
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [filters.timeFilter, filters.movieId, filters.startDate, filters.endDate]);

  useEffect(() => {
    const intervalId = window.setInterval(fetchOperational, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const kpis = overview.kpis || {};
  const operational = overview.operational || {};
  const canUseCustom = filters.timeFilter === "CUSTOM";
  const adminName = getAdminAccountName();
  const reportMeta = useMemo(
    () => buildReportMeta({ filters, movies, generatedAt: reportGeneratedAt, adminName }),
    [filters, movies, reportGeneratedAt, adminName],
  );

  const loadFreshOverviewForReport = async () => {
    if (exceedsOneYear(filters)) {
      throw new Error("Report date range cannot exceed one year.");
    }

    const response = await DashboardService.getOverview(buildParams(filters));
    const data = unwrap(response) || emptyOverview;
    const nextOverview = { ...emptyOverview, ...data };
    const generatedAt = new Date();

    setOverview(nextOverview);
    setLastUpdated(generatedAt);
    setReportGeneratedAt(generatedAt);

    return {
      overview: nextOverview,
      meta: buildReportMeta({ filters, movies, generatedAt, adminName }),
    };
  };

  const handleExport = async (type) => {
    setExportMenuOpen(false);
    setExporting(type);
    setError("");
    try {
      const report = await loadFreshOverviewForReport();
      if (type === "excel") {
        exportDashboardToExcel(report.overview, report.meta);
      } else {
        exportDashboardToPdf(report.overview, report.meta);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to export dashboard report.");
    } finally {
      setExporting("");
    }
  };

  const handlePrint = async () => {
    setExporting("print");
    setError("");
    try {
      await loadFreshOverviewForReport();
      window.setTimeout(() => window.print(), 100);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Unable to print dashboard report.");
    } finally {
      window.setTimeout(() => setExporting(""), 200);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 print:max-w-none print:space-y-4">
      <div className="hidden print:block">
        <h1 className="text-2xl font-black text-gray-950">{reportMeta.title}</h1>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <p><span className="font-bold">Report Period:</span> {reportMeta.period}</p>
          <p><span className="font-bold">Selected Movie:</span> {reportMeta.selectedMovie}</p>
          <p><span className="font-bold">Report Generation Date:</span> {reportMeta.generatedDate}</p>
          <p><span className="font-bold">Report Generation Time:</span> {reportMeta.generatedTime}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between print:hidden">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#C00000]">Admin statistics</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950">Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString("vi-VN")}` : "Loading dashboard data"}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:w-[760px]">
          <select
            value={filters.timeFilter}
            onChange={(event) => setFilters((current) => ({ ...current, timeFilter: event.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 outline-none focus:border-[#C00000]"
          >
            {TIME_FILTERS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={filters.movieId}
            onChange={(event) => setFilters((current) => ({ ...current, movieId: event.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 outline-none focus:border-[#C00000]"
          >
            <option value="">All movies</option>
            {movies.map((movie) => (
              <option key={movie.movieId} value={movie.movieId}>
                {movie.movieName}
              </option>
            ))}
          </select>

          <input
            type="date"
            disabled={!canUseCustom}
            value={filters.startDate}
            onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 outline-none focus:border-[#C00000] disabled:bg-gray-100 disabled:text-gray-400"
          />

          <input
            type="date"
            disabled={!canUseCustom}
            value={filters.endDate}
            onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 outline-none focus:border-[#C00000] disabled:bg-gray-100 disabled:text-gray-400"
          />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 print:hidden">
        <div className="relative">
          <button
            type="button"
            onClick={() => setExportMenuOpen((current) => !current)}
            disabled={Boolean(exporting)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-black text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-wait disabled:text-gray-400"
          >
            <Download size={16} />
            {exporting === "excel" || exporting === "pdf" ? "Exporting..." : "Export Report"}
            <ChevronDown size={15} />
          </button>
          {exportMenuOpen && (
            <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              <button
                type="button"
                onClick={() => handleExport("excel")}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <FileSpreadsheet size={16} className="text-green-600" />
                Export to Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => handleExport("pdf")}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <FileText size={16} className="text-[#C00000]" />
                Export to PDF (.pdf)
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handlePrint}
          disabled={Boolean(exporting)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C00000] px-4 text-sm font-black text-white shadow-sm transition hover:bg-red-700 disabled:cursor-wait disabled:bg-gray-300"
        >
          <Printer size={16} />
          {exporting === "print" ? "Preparing..." : "Print Report"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:hidden">
        <StatCard icon={DollarSign} label="Total Revenue" value={money(kpis.totalRevenue)} tone="bg-red-50 text-[#C00000]" />
        <StatCard icon={Ticket} label="Tickets Sold" value={number(kpis.totalTicketsSold)} tone="bg-gray-100 text-gray-950" />
        <StatCard icon={Percent} label="Occupancy" value={percent(kpis.averageOccupancyRate)} tone="bg-amber-50 text-amber-600" />
        <StatCard
          icon={TrendingUp}
          label="Avg Revenue/Ticket"
          value={money(kpis.averageRevenuePerTicket)}
          tone="bg-blue-50 text-blue-600"
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm print:hidden">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-black text-gray-950">Operational</h2>
            <p className="text-sm font-medium text-gray-500">Auto refreshes every 5 minutes</p>
          </div>
          <button
            type="button"
            onClick={refreshDashboard}
            disabled={refreshingDashboard}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C00000] px-4 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-wait disabled:bg-gray-300"
          >
            <RefreshCw size={16} className={refreshingDashboard ? "animate-spin" : ""} />
            Refresh Now
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard icon={CalendarDays} label="Active Showtimes" value={number(operational.activeShowtimes)} tone="bg-green-50 text-green-600" />
          <StatCard icon={Users} label="Today's Tickets" value={number(operational.ticketsSoldToday)} tone="bg-purple-50 text-purple-600" />
          <StatCard icon={DollarSign} label="Today's Revenue" value={money(operational.todayRevenue)} tone="bg-red-50 text-[#C00000]" />
        </div>
      </div>

      <div className={loading ? "pointer-events-none opacity-60 print:hidden" : "space-y-6 print:hidden"}>
        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <RevenueLine data={overview.revenueTrend || []} />
          <TimeSlotBars data={overview.ticketSalesByTimeSlot || []} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <MovieDistribution data={overview.revenueByMovie || []} />

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-gray-950">Top Revenue Movies</h2>
              <Clapperboard size={19} className="text-[#C00000]" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-black uppercase tracking-wide text-gray-400">
                    <th className="py-3 pr-4">Movie</th>
                    <th className="py-3 pr-4">Revenue</th>
                    <th className="py-3 pr-4">Tickets</th>
                    <th className="py-3">Occupancy</th>
                  </tr>
                </thead>
                <tbody>
                  {(overview.topRevenueMovies || []).map((movie) => (
                    <tr key={movie.movieId || movie.movieName} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-bold text-gray-800">{movie.movieName}</td>
                      <td className="py-3 pr-4 font-black text-gray-950">{money(movie.totalRevenue)}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-600">{number(movie.ticketsSold)}</td>
                      <td className="py-3 font-semibold text-gray-600">{percent(movie.averageOccupancyRate)}</td>
                    </tr>
                  ))}
                  {!overview.topRevenueMovies?.length && (
                    <tr>
                      <td colSpan="4" className="py-8 text-center font-semibold text-gray-400">
                        No movie ranking data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <PrintReportTables overview={overview} />

      <div className="hidden border-t pt-3 text-xs font-semibold text-gray-700 print:block">
        Admin Account Name: {reportMeta.adminName} | Report Export Date: {reportMeta.generatedDate} | Report Export Time: {reportMeta.generatedTime}
      </div>
    </div>
  );
};

export default MainDashboard;
