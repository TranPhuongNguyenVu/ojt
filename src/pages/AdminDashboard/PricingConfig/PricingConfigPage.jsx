import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Armchair,
  Clock3,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import VersionService from "../../../services/VersionService";
import PricingService from "../../../services/PricingService";
import ModalShell from "../../../components/ModalShell";

const DAY_OPTIONS = [
  { value: "MONDAY", label: "T2" },
  { value: "TUESDAY", label: "T3" },
  { value: "WEDNESDAY", label: "T4" },
  { value: "THURSDAY", label: "T5" },
  { value: "FRIDAY", label: "T6" },
  { value: "SATURDAY", label: "T7" },
  { value: "SUNDAY", label: "CN" },
];

const dayLabel = (value) => DAY_OPTIONS.find((d) => d.value === value)?.label || value;

const formatVnd = (value) =>
  value == null || value === "" ? "—" : `${Number(value).toLocaleString("vi-VN")} đ`;

const toHHMM = (time) => (time || "").substring(0, 5);

const SEAT_TYPE_DEFS = [
  { key: 1, label: "Ghế VIP" },
  { key: 2, label: "Ghế đôi" },
];

const conflictInfo = (error) => {
  if (error?.response?.status !== 409) return null;
  return {
    affected: error.response.data?.data?.affectedShowtimes ?? null,
    message: error.response.data?.message || "Có suất chiếu trong tương lai bị ảnh hưởng.",
  };
};

const inputClass =
  "block w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm";
const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1";
const cardClass = "bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm";
const thClass = "px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 font-bold tracking-wider whitespace-nowrap";
const tdClass = "px-4 py-3 text-sm text-gray-700 dark:text-gray-300";

const ConfirmForceDialog = ({ conflict, onConfirm, onCancel, isSubmitting }) => (
  <ModalShell title="Cảnh báo thay đổi giá" onClose={onCancel} maxWidth="max-w-md">
    <div className="p-6 space-y-4">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 dark:text-amber-300">
          <AlertTriangle size={28} />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300 font-semibold">
          {conflict.affected != null
            ? `Có ${conflict.affected} suất chiếu trong tương lai bị ảnh hưởng bởi thay đổi này.`
            : conflict.message}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Vé chưa bán của các suất đó sẽ áp dụng giá mới ngay. Vé đã bán giữ nguyên giá tại thời điểm thanh toán.
        </p>
      </div>
    </div>
    <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60"
      >
        Hủy
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={isSubmitting}
        className="px-4 py-2 bg-[#C00000] text-white text-sm font-semibold rounded-lg hover:bg-[#a00000] transition-colors shadow-sm disabled:opacity-60"
      >
        {isSubmitting ? "Đang áp dụng..." : "Vẫn cập nhật"}
      </button>
    </div>
  </ModalShell>
);

const emptyGoldenForm = () => ({
  startTime: "18:00",
  endTime: "21:00",
  daysOfWeek: DAY_OPTIONS.map((d) => d.value),
  extraPrice: "",
  active: true,
});

const PricingConfigPage = () => {
  const [versions, setVersions] = useState([]);
  const [goldenHours, setGoldenHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [editingFormatId, setEditingFormatId] = useState(null);
  const [formatDraft, setFormatDraft] = useState("");
  const [savingFormatId, setSavingFormatId] = useState(null);

  const [selectedFormatId, setSelectedFormatId] = useState("");
  const [editingSeatType, setEditingSeatType] = useState(null);
  const [seatTypeDraft, setSeatTypeDraft] = useState("");
  const [savingSeatType, setSavingSeatType] = useState(null);

  const [goldenModal, setGoldenModal] = useState(null);
  const [goldenForm, setGoldenForm] = useState(emptyGoldenForm());
  const [savingGolden, setSavingGolden] = useState(false);

  const [pendingForce, setPendingForce] = useState(null);
  const [forceSubmitting, setForceSubmitting] = useState(false);

  const flashSuccess = (msg) => {
    setSuccessMessage(msg);
    setErrorMessage("");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [versionRes, goldenRes] = await Promise.all([
        VersionService.getAll(),
        PricingService.getGoldenHours(),
      ]);
      setVersions(versionRes.data?.data || []);
      setGoldenHours(goldenRes.data?.data || []);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Không thể tải dữ liệu cấu hình giá.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setEditingSeatType(null);
    setSeatTypeDraft("");
  }, [selectedFormatId]);

  const runWithForceRetry = async (action, onDone) => {
    try {
      await action(false);
      await onDone();
    } catch (error) {
      const conflict = conflictInfo(error);
      if (conflict) {
        setPendingForce({ conflict, action, onDone });
      } else {
        setErrorMessage(error?.response?.data?.message || "Cập nhật thất bại.");
      }
    }
  };

  const confirmForce = async () => {
    if (!pendingForce) return;
    setForceSubmitting(true);
    try {
      await pendingForce.action(true);
      await pendingForce.onDone();
      setPendingForce(null);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Cập nhật thất bại.");
      setPendingForce(null);
    } finally {
      setForceSubmitting(false);
    }
  };

  const sortedVersionsByPrice = useMemo(
    () => [...versions].sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0)),
    [versions]
  );

  const startEditFormat = (version) => {
    setEditingFormatId(version.versionId);
    setFormatDraft(version.basePrice != null ? String(version.basePrice) : "");
  };

  const cancelEditFormat = () => {
    setEditingFormatId(null);
    setFormatDraft("");
  };

  const handleSaveFormat = async (version) => {
    const basePrice = Number(formatDraft);
    if (formatDraft === "" || isNaN(basePrice) || basePrice <= 0) {
      setErrorMessage("Giá vé cơ bản phải lớn hơn 0.");
      return;
    }
    setSavingFormatId(version.versionId);
    await runWithForceRetry(
      (force) => PricingService.updateRoomFormatPrice(version.versionId, basePrice, force),
      async () => {
        const res = await VersionService.getAll();
        setVersions(res.data?.data || []);
        cancelEditFormat();
        flashSuccess(`Đã cập nhật giá cơ bản của định dạng ${version.versionName}.`);
      }
    );
    setSavingFormatId(null);
  };

  const selectedFormat = useMemo(
    () => versions.find((v) => v.versionId === Number(selectedFormatId)),
    [versions, selectedFormatId]
  );

  const seatTypeSummary = useMemo(
    () =>
      SEAT_TYPE_DEFS.map((def) => ({
        ...def,
        currentExtraPrice: def.key === 1 ? selectedFormat?.vipPrice ?? 0 : selectedFormat?.couplePrice ?? 0,
      })).sort((a, b) => a.currentExtraPrice - b.currentExtraPrice),
    [selectedFormat]
  );

  const startEditSeatType = (def) => {
    setEditingSeatType(def.key);
    setSeatTypeDraft(String(def.currentExtraPrice ?? ""));
  };

  const cancelEditSeatType = () => {
    setEditingSeatType(null);
    setSeatTypeDraft("");
  };

  const handleApplySeatTypeExtra = async (seatType) => {
    const extraPrice = Number(seatTypeDraft);
    if (seatTypeDraft === "" || isNaN(extraPrice) || extraPrice < 0) {
      setErrorMessage("Phụ thu ghế không được âm.");
      return;
    }
    setSavingSeatType(seatType);
    await runWithForceRetry(
      (force) => PricingService.updateSeatTypeExtraPrice(selectedFormatId, seatType, extraPrice, force),
      async () => {
        const res = await VersionService.getAll();
        setVersions(res.data?.data || []);
        cancelEditSeatType();
        const label = SEAT_TYPE_DEFS.find((d) => d.key === seatType)?.label || "ghế";
        flashSuccess(`Đã cập nhật phụ thu ${label} cho định dạng ${selectedFormat?.versionName || ""}.`);
      }
    );
    setSavingSeatType(null);
  };

  const openGoldenCreate = () => {
    setGoldenForm(emptyGoldenForm());
    setGoldenModal({ mode: "create" });
  };

  const openGoldenEdit = (rule) => {
    setGoldenForm({
      startTime: toHHMM(rule.startTime),
      endTime: toHHMM(rule.endTime),
      daysOfWeek: rule.daysOfWeek || [],
      extraPrice: rule.extraPrice ?? "",
      active: rule.active !== false,
    });
    setGoldenModal({ mode: "edit", rule });
  };

  const toggleGoldenDay = (day) => {
    setGoldenForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day],
    }));
  };

  const refreshGoldenHours = async () => {
    const res = await PricingService.getGoldenHours();
    setGoldenHours(res.data?.data || []);
  };

  const handleGoldenSubmit = async (e) => {
    e.preventDefault();
    if (!goldenForm.startTime || !goldenForm.endTime || goldenForm.startTime >= goldenForm.endTime) {
      setErrorMessage("Giờ bắt đầu phải trước giờ kết thúc.");
      return;
    }
    if (goldenForm.daysOfWeek.length === 0) {
      setErrorMessage("Vui lòng chọn ít nhất một ngày áp dụng.");
      return;
    }
    const extraPrice = Number(goldenForm.extraPrice);
    if (goldenForm.extraPrice === "" || isNaN(extraPrice) || extraPrice < 0) {
      setErrorMessage("Phụ thu giờ vàng không được âm.");
      return;
    }
    const payload = {
      startTime: goldenForm.startTime,
      endTime: goldenForm.endTime,
      daysOfWeek: goldenForm.daysOfWeek,
      extraPrice,
      active: goldenForm.active,
    };
    const modal = goldenModal;
    setSavingGolden(true);
    await runWithForceRetry(
      (force) =>
        modal.mode === "create"
          ? PricingService.createGoldenHour(payload, force)
          : PricingService.updateGoldenHour(modal.rule.goldenHourId, payload, force),
      async () => {
        await refreshGoldenHours();
        setGoldenModal(null);
        flashSuccess(modal.mode === "create" ? "Đã tạo khung giờ vàng." : "Đã cập nhật khung giờ vàng.");
      }
    );
    setSavingGolden(false);
  };

  const handleGoldenToggleActive = async (rule) => {
    await runWithForceRetry(
      (force) =>
        PricingService.updateGoldenHour(rule.goldenHourId, { active: !(rule.active !== false) }, force),
      async () => {
        await refreshGoldenHours();
        flashSuccess("Đã cập nhật trạng thái khung giờ vàng.");
      }
    );
  };

  const handleGoldenDelete = async (rule) => {
    await runWithForceRetry(
      (force) => PricingService.deleteGoldenHour(rule.goldenHourId, force),
      async () => {
        await refreshGoldenHours();
        flashSuccess("Đã xóa khung giờ vàng.");
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24 text-gray-400 dark:text-gray-500">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <header className="px-8 py-5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <BadgeDollarSign size={22} className="text-[#C00000]" />
          Cấu hình giá vé
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Giá vé = giá cơ bản theo định dạng + phụ thu ghế + phụ thu giờ vàng (tính tại thời điểm đặt vé).
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-8 space-y-6">
        {errorMessage && (
          <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300 text-sm font-semibold rounded-lg">
            <AlertTriangle size={18} />
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300 text-sm font-semibold rounded-lg">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        <section className={cardClass}>
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <BadgeDollarSign size={16} className="text-[#C00000]" />
              Giá cơ bản theo định dạng chiếu
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60">
                <th className={thClass}>Định dạng</th>
                <th className={thClass}>Giá cơ bản</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sortedVersionsByPrice.map((version) => {
                const isEditing = editingFormatId === version.versionId;
                const isSaving = savingFormatId === version.versionId;
                return (
                  <tr key={version.versionId} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                    <td className={tdClass}>
                      <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                        {version.versionName}
                      </span>
                    </td>
                    <td className={tdClass}>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            autoFocus
                            min={1000}
                            step={1000}
                            value={formatDraft}
                            onChange={(e) => setFormatDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveFormat(version);
                              if (e.key === "Escape") cancelEditFormat();
                            }}
                            className={`${inputClass} max-w-[160px]`}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveFormat(version)}
                            disabled={isSaving || formatDraft === ""}
                            className="p-1.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md disabled:opacity-40"
                            title="Lưu"
                          >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditFormat}
                            disabled={isSaving}
                            className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                            title="Hủy"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditFormat(version)}
                          className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300 hover:text-[#C00000] transition-colors"
                          title="Bấm để chỉnh sửa"
                        >
                          {formatVnd(version.basePrice)}
                          <Pencil size={12} className="text-gray-300 dark:text-gray-600" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className={cardClass}>
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Armchair size={16} className="text-[#C00000]" />
              Phụ thu ghế theo định dạng
            </h2>
            <select
              value={selectedFormatId}
              onChange={(e) => setSelectedFormatId(e.target.value)}
              className={`${inputClass} max-w-[260px] bg-white dark:bg-gray-800/60`}
            >
              <option value="">— Chọn định dạng chiếu —</option>
              {sortedVersionsByPrice.map((version) => (
                <option key={version.versionId} value={version.versionId}>
                  {version.versionName}
                </option>
              ))}
            </select>
          </div>
          <div>
            {!selectedFormatId ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                Chọn một định dạng chiếu để xem và chỉnh phụ thu ghế VIP / ghế đôi áp dụng cho mọi phòng thuộc định dạng đó.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60">
                    <th className={thClass}>Loại ghế</th>
                    <th className={thClass}>Phụ thu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {seatTypeSummary.map((def) => {
                    const isEditing = editingSeatType === def.key;
                    const isSaving = savingSeatType === def.key;
                    return (
                      <tr key={def.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <td className={tdClass}>
                          <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                            {def.label}
                          </span>
                        </td>
                        <td className={tdClass}>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                autoFocus
                                min={0}
                                step={1000}
                                value={seatTypeDraft}
                                onChange={(e) => setSeatTypeDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleApplySeatTypeExtra(def.key);
                                  if (e.key === "Escape") cancelEditSeatType();
                                }}
                                className={`${inputClass} max-w-[160px]`}
                              />
                              <button
                                type="button"
                                onClick={() => handleApplySeatTypeExtra(def.key)}
                                disabled={isSaving || seatTypeDraft === ""}
                                className="p-1.5 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md disabled:opacity-40"
                                title="Lưu"
                              >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditSeatType}
                                disabled={isSaving}
                                className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md"
                                title="Hủy"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditSeatType(def)}
                              className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300 hover:text-[#C00000] transition-colors"
                              title="Bấm để chỉnh sửa"
                            >
                              {formatVnd(def.currentExtraPrice)}
                              <Pencil size={12} className="text-gray-300 dark:text-gray-600" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <Clock3 size={16} className="text-[#C00000]" />
              Khung giờ vàng
            </h2>
            <button
              type="button"
              onClick={openGoldenCreate}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#C00000] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#a00000] transition-colors"
            >
              <Plus size={14} />
              Thêm khung giờ
            </button>
          </div>
          {goldenHours.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-10">Chưa có khung giờ vàng nào.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60">
                  <th className={thClass}>Khung giờ</th>
                  <th className={thClass}>Ngày áp dụng</th>
                  <th className={thClass}>Phụ thu</th>
                  <th className={thClass}>Trạng thái</th>
                  <th className={`${thClass} w-32 text-center`}>Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {goldenHours.map((rule) => (
                  <tr key={rule.goldenHourId} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                    <td className={`${tdClass} font-semibold`}>
                      {toHHMM(rule.startTime)} – {toHHMM(rule.endTime)}
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        {(rule.daysOfWeek || []).map((d) => (
                          <span
                            key={d}
                            className="inline-block px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                          >
                            {dayLabel(d)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`${tdClass} font-semibold text-[#C00000]`}>
                      +{formatVnd(rule.extraPrice)}
                    </td>
                    <td className={tdClass}>
                      <button
                        type="button"
                        onClick={() => handleGoldenToggleActive(rule)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-colors ${
                          rule.active !== false
                            ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {rule.active !== false ? "Đang bật" : "Đang tắt"}
                      </button>
                    </td>
                    <td className={tdClass}>
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openGoldenEdit(rule)}
                          className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md"
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGoldenDelete(rule)}
                          className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-md"
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {goldenModal && (
        <ModalShell
          title={goldenModal.mode === "create" ? "Thêm khung giờ vàng" : "Sửa khung giờ vàng"}
          onClose={() => setGoldenModal(null)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleGoldenSubmit} className="flex flex-col overflow-hidden flex-1">
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Giờ bắt đầu</label>
                  <input
                    type="time"
                    value={goldenForm.startTime}
                    onChange={(e) => setGoldenForm((prev) => ({ ...prev, startTime: e.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Giờ kết thúc</label>
                  <input
                    type="time"
                    value={goldenForm.endTime}
                    onChange={(e) => setGoldenForm((prev) => ({ ...prev, endTime: e.target.value }))}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Ngày áp dụng</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const checked = goldenForm.daysOfWeek.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleGoldenDay(day.value)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                          checked
                            ? "bg-[#C00000] border-transparent text-white"
                            : "bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelClass}>Phụ thu (VND)</label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="Ví dụ: 20000"
                  value={goldenForm.extraPrice}
                  onChange={(e) => setGoldenForm((prev) => ({ ...prev, extraPrice: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={goldenForm.active}
                  onChange={(e) => setGoldenForm((prev) => ({ ...prev, active: e.target.checked }))}
                  className="accent-[#C00000]"
                />
                Kích hoạt khung giờ này
              </label>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/60 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setGoldenModal(null)}
                disabled={savingGolden}
                className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingGolden}
                className="px-4 py-2 bg-[#C00000] text-white text-sm font-semibold rounded-lg hover:bg-[#a00000] transition-colors shadow-sm disabled:opacity-60"
              >
                {savingGolden ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {pendingForce && (
        <ConfirmForceDialog
          conflict={pendingForce.conflict}
          onConfirm={confirmForce}
          onCancel={() => setPendingForce(null)}
          isSubmitting={forceSubmitting}
        />
      )}
    </div>
  );
};

export default PricingConfigPage;
