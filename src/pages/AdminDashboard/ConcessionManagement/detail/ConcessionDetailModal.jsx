import React from "react";
import { Edit, Popcorn, FileText, Tag, ShoppingBag } from "lucide-react";
import ModalShell from "../../../../components/ModalShell";
import {
  ITEM_TYPE_META,
  SIZE_OPTIONS,
  getConcessionStatusBadge,
  formatVnd,
} from "../shared/concessionFormConstants";
import { CONCESSION_LABELS } from "../../../../constants/labels";

const SIZE_LABEL_BY_VALUE = SIZE_OPTIONS.reduce((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {});

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-2">
    {Icon && <Icon size={15} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="text-sm text-gray-800 dark:text-gray-200 break-words">
        {children ?? "—"}
      </div>
    </div>
  </div>
);

const ConcessionDetailModal = ({ itemType, item, onClose, onEdit }) => {
  const meta = ITEM_TYPE_META[itemType];
  const name = item[meta.nameKey];
  const statusBadge = getConcessionStatusBadge(item.status);
  const prices = item.prices || [];
  const comboItems = item.items || [];

  return (
    <ModalShell title={name || CONCESSION_LABELS.pageTitle} onClose={onClose}>
      <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <div className="flex flex-col gap-3">
          <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
            {item.image ? (
              <img src={item.image} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <Popcorn size={40} />
              </div>
            )}
          </div>
          <span
            className={`inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge.cls}`}
          >
            {statusBadge.label}
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Tag} label="Loại mục">
              {meta.label.charAt(0).toUpperCase() + meta.label.slice(1)}
            </InfoRow>
            <InfoRow icon={ShoppingBag} label="Tên">{name || "—"}</InfoRow>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {CONCESSION_LABELS.fieldPrices}
            </p>
            {prices.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500">—</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {prices.map((p, idx) => (
                  <span
                    key={`${p.size}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-[#C00000] dark:text-red-300"
                  >
                    {SIZE_LABEL_BY_VALUE[p.size] || p.size}
                    <span className="text-gray-500 dark:text-gray-400">·</span>
                    {formatVnd(p.price)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {itemType === "combo" && (
            <div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {CONCESSION_LABELS.comboCompositionLabel}
              </p>
              {comboItems.length === 0 ? (
                <p className="text-sm text-amber-600 dark:text-amber-400 font-semibold">
                  {CONCESSION_LABELS.comboEmptyWarning}
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {comboItems.map((line, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-1.5 last:border-0"
                    >
                      <span>
                        {line.foodName || line.drinkName || "—"}
                        <span className="ml-1.5 text-xs text-gray-400">
                          ({SIZE_LABEL_BY_VALUE[line.size] || line.size})
                        </span>
                      </span>
                      <span className="font-semibold shrink-0">x{line.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText size={13} />
              {CONCESSION_LABELS.fieldDescription}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {item.description || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-end gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Đóng
        </button>
        {item.status !== "DELETED" && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <Edit size={15} />
            {CONCESSION_LABELS.actionEdit}
          </button>
        )}
      </div>
    </ModalShell>
  );
};

export default ConcessionDetailModal;
