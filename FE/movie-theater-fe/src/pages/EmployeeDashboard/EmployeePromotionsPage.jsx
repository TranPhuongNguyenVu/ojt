import React, { useEffect, useMemo, useState } from "react";
import { Tag } from "lucide-react";
import PromotionService from "../../services/PromotionService";
import { getApiErrorMessage } from "../../services/ApiErrorUtils";

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
};

const formatDiscount = (type, level) => {
  if (level == null) return "—";
  return type === "PERCENT" ? `${level}%` : `${Number(level).toLocaleString("vi-VN")}đ`;
};

const EmployeePromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    PromotionService.getAll()
      .then((response) => {
        setPromotions(response.data.data || []);
      })
      .catch((err) => {
        setError(getApiErrorMessage(err, "Không thể tải danh sách khuyến mãi."));
        setPromotions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredPromotions = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return promotions;
    return promotions.filter((promo) =>
      [promo.title, promo.detail, promo.discountType]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [promotions, keyword]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#C00000] dark:text-[#ff4d57]">
            Khuyến mãi
          </p>
          <h1 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">Danh sách khuyến mãi</h1>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-white/50">
            Xem nhanh các ưu đãi đang áp dụng tại quầy.
          </p>
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm theo tên khuyến mãi..."
          className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/35 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-[#4CC9F0]/40 sm:w-72"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#10131A]/80 dark:backdrop-blur-md shadow-sm transition-colors duration-300">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-black uppercase tracking-wide text-gray-500 dark:text-white/45">
                <th className="px-4 py-3">Tiêu đề</th>
                <th className="px-4 py-3">Giảm giá</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-4 py-12 text-center text-sm text-gray-500 dark:text-white/50">
                    Đang tải khuyến mãi...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-4 py-16 text-center text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">
                    Không có khuyến mãi
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((promo) => (
                  <tr key={promo.promotionId} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">
                          <Tag size={15} />
                        </div>
                        <div>
                          <div className="font-black text-gray-950 dark:text-white">{promo.title}</div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-white/50">{promo.detail || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-white/70">
                      {formatDiscount(promo.discountType, promo.discountLevel)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-white/60">
                      {formatDate(promo.startTime)} - {formatDate(promo.endTime)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                        {promo.status || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeePromotionsPage;
