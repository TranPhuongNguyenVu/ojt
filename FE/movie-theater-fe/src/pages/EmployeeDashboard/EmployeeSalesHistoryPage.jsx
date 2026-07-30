import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, Search } from "lucide-react";
import BookingService from "../../services/BookingService";
import { getApiErrorMessage } from "../../services/ApiErrorUtils";

const PAGE_SIZE = 10;

const money = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
};

const EmployeeSalesHistoryPage = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    BookingService.getEmployeeSalesHistory()
      .then((response) => {
        setHistory(response.data?.data || []);
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, "Không thể tải lịch sử bán vé."));
        setHistory([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredHistory = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const filtered = !q
      ? [...history]
      : history.filter((item) =>
          [
            item.invoiceId,
            item.movieName,
            item.screen,
            item.seats,
            item.memberFullName,
            item.phoneNumber,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        );

    return filtered.sort((a, b) => {
      const timeA = a.bookingDate ? new Date(a.bookingDate).getTime() : 0;
      const timeB = b.bookingDate ? new Date(b.bookingDate).getTime() : 0;
      return timeB - timeA;
    });
  }, [history, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedHistory = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredHistory.slice(start, start + PAGE_SIZE);
  }, [filteredHistory, safePage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#C00000] dark:text-[#ff4d57]">
            Bán vé tại quầy
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">Lịch sử bán vé</h1>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-white/50">
            Danh sách các hóa đơn đã bán thành công tại quầy.
          </p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã HĐ, phim, khách..."
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#4CC9F0]/40"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md shadow-sm transition-colors duration-300">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-black text-gray-950 dark:text-white">
            <History size={16} className="text-[#C00000] dark:text-[#E50914]" />
            Giao dịch gần đây
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-black uppercase tracking-wide text-gray-500 dark:text-white/45">
                <th className="px-4 py-3">Mã HĐ</th>
                <th className="px-4 py-3">Thời gian bán</th>
                <th className="px-4 py-3">Phim</th>
                <th className="px-4 py-3">Suất chiếu</th>
                <th className="px-4 py-3">Ghế</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Thành tiền</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center font-semibold text-gray-400 dark:text-white/40">
                    Đang tải lịch sử bán vé...
                  </td>
                </tr>
              )}

              {!loading &&
                pagedHistory.map((item) => (
                  <tr key={item.invoiceId} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50/80 dark:hover:bg-white/5">
                    <td className="px-4 py-3 font-black text-[#C00000] dark:text-[#ff4d57]">#{item.invoiceId}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-white/70">
                      {formatDateTime(item.bookingDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-black text-gray-950 dark:text-white">{item.movieName}</div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-white/45">{item.screen}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-white/70">
                      {formatDateTime(item.showtime)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-white/70">{item.seats || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="font-black text-gray-950 dark:text-white">
                        {item.phoneNumber
                          ? item.memberFullName || "Khách hàng"
                          : item.soldByEmployeeName || item.memberFullName || "Khách lẻ"}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-white/45">
                        {item.phoneNumber ||
                          (item.soldByEmployeeName ? "Người bán vé" : "Không có SĐT")}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-black text-gray-950 dark:text-white">{money(item.totalMoney)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => navigate(`/employee/booking/success/${item.invoiceId}`)}
                        className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-black text-gray-700 dark:text-white/70 transition hover:border-[#C00000] dark:hover:border-[#E50914] hover:text-[#C00000] dark:hover:text-[#ff4d57]"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}

              {!loading && !filteredHistory.length && (
                <tr>
                  <td colSpan="8" className="px-4 py-10 text-center font-semibold text-gray-400 dark:text-white/40">
                    {keyword.trim()
                      ? "Không tìm thấy hóa đơn phù hợp."
                      : "Chưa có lịch sử bán vé tại quầy."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 border-t border-gray-100 dark:border-white/10 px-4 py-4">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={safePage === 1}
              className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-white/60 disabled:opacity-40"
            >
              Trước
            </button>
            <span className="text-xs font-bold text-gray-500 dark:text-white/50">
              Trang {safePage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={safePage === totalPages}
              className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-gray-600 dark:text-white/60 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSalesHistoryPage;
