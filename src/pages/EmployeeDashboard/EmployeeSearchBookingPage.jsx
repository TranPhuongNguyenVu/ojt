import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import BookingService from "../../services/BookingService";
import { getApiErrorMessage } from "../../services/ApiErrorUtils";

const EmployeeSearchBookingPage = () => {
  const navigate = useNavigate();
  const [invoiceId, setInvoiceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (event) => {
    event.preventDefault();
    setError("");

    const normalizedId = invoiceId.trim().replace(/^#/, "");
    if (!normalizedId || Number.isNaN(Number(normalizedId))) {
      setError("Vui lòng nhập mã hóa đơn hợp lệ.");
      return;
    }

    setLoading(true);
    try {
      const response = await BookingService.getEmployeeBookingDetail(normalizedId);
      if (response.data?.status === 200 && response.data?.data) {
        navigate(`/employee/booking/success/${normalizedId}`, {
          state: { bookingDetail: response.data.data },
        });
        return;
      }
      setError(response.data?.message || "Không tìm thấy hóa đơn.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Không tìm thấy hóa đơn."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#C00000] dark:text-[#ff4d57]">
          Tra cứu hóa đơn
        </p>
        <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">Tìm kiếm hóa đơn</h1>
        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-white/50">
          Nhập mã hóa đơn để xem chi tiết vé bán tại quầy.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md p-6 shadow-sm transition-colors duration-300"
      >
        <label htmlFor="invoiceId" className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-white/45">
          Mã hóa đơn
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40"
            />
            <input
              id="invoiceId"
              type="text"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              placeholder="Ví dụ: 1024"
              className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#4CC9F0]/40"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-[#C00000] dark:bg-[#E50914] px-5 text-sm font-black text-white hover:bg-red-700 dark:hover:bg-[#ff1a25] disabled:cursor-wait disabled:bg-gray-300 dark:disabled:bg-white/20"
          >
            {loading ? "Đang tìm..." : "Tìm hóa đơn"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default EmployeeSearchBookingPage;
