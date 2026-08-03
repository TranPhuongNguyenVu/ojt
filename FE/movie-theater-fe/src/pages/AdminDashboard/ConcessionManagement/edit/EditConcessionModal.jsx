import { useState } from "react";
import ModalShell from "../../../../components/ModalShell";
import ConcessionModalFooter from "../shared/ConcessionModalFooter";
import ConcessionFormFields from "../shared/ConcessionFormFields";
import {
  CONCESSION_SERVICE_BY_TYPE,
  ITEM_TYPE_META,
  toConcessionFormState,
  buildConcessionPayload,
  mapConcessionApiError,
} from "../shared/concessionFormConstants";
import { validateConcessionForm } from "../shared/concessionValidation";
import { CONCESSION_LABELS, COMMON_LABELS } from "../../../../constants/labels";

const EditConcessionModal = ({ itemType, item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(() => toConcessionFormState(itemType, item));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const liveValidationError = validateConcessionForm(itemType, formData);

  const handleChange = (patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationError = validateConcessionForm(itemType, formData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const idKey = ITEM_TYPE_META[itemType].idKey;
    setIsSubmitting(true);
    try {
      await CONCESSION_SERVICE_BY_TYPE[itemType].update(item[idKey], buildConcessionPayload(itemType, formData));
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(mapConcessionApiError(error, CONCESSION_LABELS.errorUpdate));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title={`${CONCESSION_LABELS.editModalTitle}: ${item[ITEM_TYPE_META[itemType].nameKey]}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}
          <ConcessionFormFields itemType={itemType} formData={formData} onChange={handleChange} />
        </div>
        <ConcessionModalFooter
          onCancel={onClose}
          submitLabel={COMMON_LABELS.save}
          isSubmitting={isSubmitting}
          disabled={!!liveValidationError}
        />
      </form>
    </ModalShell>
  );
};

export default EditConcessionModal;
