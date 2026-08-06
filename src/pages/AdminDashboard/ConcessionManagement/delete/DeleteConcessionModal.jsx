import { useState } from "react";
import { CONCESSION_SERVICE_BY_TYPE, ITEM_TYPE_META, getApiErrorMessage } from "../shared/concessionFormConstants";
import { CONCESSION_LABELS, COMMON_LABELS } from "../../../../constants/labels";

const DeleteConcessionModal = ({ itemType, item, onClose, onSuccess }) => {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const idKey = ITEM_TYPE_META[itemType].idKey;
  const nameKey = ITEM_TYPE_META[itemType].nameKey;

  const handleConfirm = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      await CONCESSION_SERVICE_BY_TYPE[itemType].remove(item[idKey]);
      onSuccess();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, CONCESSION_LABELS.errorDelete));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl border border-slate-200 dark:border-gray-800">
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">{CONCESSION_LABELS.confirmDeleteTitle}</h3>
        <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
          {CONCESSION_LABELS.confirmDeleteMessage} (<strong>{item[nameKey]}</strong>)
        </p>
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-2.5 text-xs font-bold text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
          >
            {COMMON_LABELS.cancel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 text-white rounded-lg text-sm font-bold transition-colors shadow-sm cursor-pointer"
          >
            {isSubmitting ? COMMON_LABELS.saving : COMMON_LABELS.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConcessionModal;
