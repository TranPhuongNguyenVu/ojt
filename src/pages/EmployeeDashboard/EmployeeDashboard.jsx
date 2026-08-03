import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarClock,
  Clapperboard,
  RefreshCw,
  Search,
  Tag,
  Ticket,
  Wallet,
} from "lucide-react";
import EmployeeDashboardService from "../../services/EmployeeDashboardService";

const emptyOverview = {
  operationalStats: {},
  upcomingShowtimes: [],
};

const unwrap = (response) => response.data?.data ?? response.data;

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const number = (value) => new Intl.NumberFormat("vi-VN").format(Number(value || 0));

const formatTime = (value) => {
  if (!value) return "--:--";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
};

const quickActions = [
  {
    label: "Bán vé",
    description: "Chọn phim để bán vé",
    icon: Ticket,
    to: "/employee/movies",
    tone: "bg-red-50 text-[#C00000] dark:bg-red-950/40 dark:text-[#ff4d57]",
  },
  {
    label: "Search Booking",
    description: "Find existing booking",
    icon: Search,
    to: "/employee/bookings/search",
    tone: "bg-gray-100 text-gray-950 dark:bg-white/10 dark:text-white",
  },
  {
    label: "View Promotions",
    description: "Active offers",
    icon: Tag,
    to: "/employee/promotions",
    tone: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300",
  },
];

const StatCard = ({ icon: Icon, label, value, tone }) => (
  <div className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md p-5 shadow-sm transition-colors duration-300">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-gray-400 dark:text-white/45">{label}</p>
        <p className="mt-2 text-2xl font-black text-gray-950 dark:text-white">{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${tone}`}>
        <Icon size={21} strokeWidth={2.3} />
      </div>
    </div>
  </div>
);

const EmployeeDashboard = () => {
  const [overview, setOverview] = useState(emptyOverview);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await EmployeeDashboardService.getOverview();
      setOverview({ ...emptyOverview, ...(unwrap(response) || {}) });
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load employee dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const refreshNow = async () => {
    setRefreshing(true);
    setError("");
    try {
      const [operationalResponse, showtimeResponse] = await Promise.all([
        EmployeeDashboardService.getOperational(),
        EmployeeDashboardService.getUpcomingShowtimes(),
      ]);

      setOverview((current) => ({
        ...current,
        operationalStats: unwrap(operationalResponse) || {},
        upcomingShowtimes: unwrap(showtimeResponse) || [],
      }));
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || "Unable to refresh dashboard data.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(refreshNow, 5 * 60 * 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  const stats = overview.operationalStats || {};
  const showtimes = overview.upcomingShowtimes || [];
  const startsSoonCount = showtimes.filter((showtime) => showtime.startsSoon).length;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#C00000] dark:text-[#ff4d57]">Employee operations</p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">Operational Dashboard</h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-white/50">
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString("vi-VN")}` : "Loading latest operations"}
          </p>
        </div>

        <button
          type="button"
          onClick={refreshNow}
          disabled={refreshing}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#C00000] dark:bg-[#E50914] px-4 text-sm font-black text-white transition hover:bg-red-700 dark:hover:bg-[#ff1a25] disabled:cursor-wait disabled:bg-gray-300 dark:disabled:bg-white/20"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh Now
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm font-bold text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.to}
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#C00000] dark:hover:border-[#E50914] hover:shadow-md"
            >
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${action.tone}`}>
                <Icon size={21} strokeWidth={2.3} />
              </div>
              <h2 className="text-sm font-black text-gray-950 dark:text-white">{action.label}</h2>
              <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-white/50">{action.description}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Ticket}
          label="Tickets Sold Today"
          value={number(stats.ticketsSoldToday)}
          tone="bg-red-50 text-[#C00000] dark:bg-red-950/40 dark:text-[#ff4d57]"
        />
        <StatCard
          icon={Wallet}
          label="Revenue Today"
          value={money(stats.revenueToday)}
          tone="bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400"
        />
        <StatCard
          icon={CalendarClock}
          label="Next 2 Hours"
          value={`${number(showtimes.length)} showtimes`}
          tone="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-[#4CC9F0]"
        />
        <StatCard
          icon={RefreshCw}
          label="Starting Soon"
          value={`${number(startsSoonCount)} reminders`}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"
        />
      </section>

      <div className={loading ? "pointer-events-none opacity-60" : "space-y-6"}>
        <section className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md p-5 shadow-sm transition-colors duration-300">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-gray-950 dark:text-white">Upcoming Showtimes</h2>
              <p className="text-sm font-medium text-gray-500 dark:text-white/50">Scheduled within the next 2 hours</p>
            </div>
            <Clapperboard size={20} className="text-[#C00000] dark:text-[#E50914]" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 text-xs font-black uppercase tracking-wide text-gray-400 dark:text-white/40">
                  <th className="py-3 pr-4">Movie</th>
                  <th className="py-3 pr-4">Format</th>
                  <th className="py-3 pr-4">Showtime</th>
                  <th className="py-3 pr-4">Room</th>
                  <th className="py-3 pr-4">Seats</th>
                  <th className="py-3">Availability</th>
                </tr>
              </thead>
              <tbody>
                {showtimes.map((showtime) => {
                  const totalSeats = Number(showtime.totalSeats || 0);
                  const availableSeats = Number(showtime.availableSeats || 0);
                  const availablePercent = totalSeats ? (availableSeats / totalSeats) * 100 : 0;

                  return (
                    <tr
                      key={showtime.scheduleId}
                      className={`border-b border-gray-100 dark:border-white/5 ${showtime.startsSoon ? "bg-red-50/70 dark:bg-red-950/30" : ""}`}
                    >
                      <td className="py-3 pr-4 font-black text-gray-950 dark:text-white">{showtime.movieName}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-600 dark:text-white/60">{showtime.movieFormat || "Standard"}</td>
                      <td className="py-3 pr-4">
                        <div className="font-black text-[#C00000] dark:text-[#ff4d57]">{formatTime(showtime.showtime)}</div>
                        {showtime.startsSoon && (
                          <span className="mt-1 inline-flex rounded bg-red-100 dark:bg-red-950/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#C00000] dark:text-[#ff4d57]">
                            Starts soon
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-gray-600 dark:text-white/60">{showtime.cinemaRoom}</td>
                      <td className="py-3 pr-4 font-semibold text-gray-600 dark:text-white/60">
                        {number(showtime.soldSeats)} sold / {number(showtime.totalSeats)}
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-28 rounded-full bg-gray-100 dark:bg-white/10">
                            <div
                              className="h-3 rounded-full bg-green-500"
                              style={{ width: `${Math.max(availablePercent, totalSeats ? 4 : 0)}%` }}
                            />
                          </div>
                          <div>
                            <div className="font-black text-gray-950 dark:text-white">
                              {number(showtime.availableSeats)} / {number(showtime.totalSeats)} available
                            </div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-white/45">
                              {Number(showtime.occupancyRate || 0).toFixed(2)}% occupied
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!showtimes.length && (
                  <tr>
                    <td colSpan="6" className="py-10 text-center font-semibold text-gray-400 dark:text-white/40">
                      No showtimes in the next 2 hours
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
