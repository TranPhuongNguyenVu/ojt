import { useState } from "react";
import ModalShell from "../../../../components/ModalShell";
import ConcessionModalFooter from "../shared/ConcessionModalFooter";
import ConcessionFormFields from "../shared/ConcessionFormFields";
import {
  CONCESSION_SERVICE_BY_TYPE,
  ITEM_TYPE_META,
  emptyConcessionForm,
  buildConcessionPayload,
  mapConcessionApiError,
} from "../shared/concessionFormConstants";
import { validateConcessionForm } from "../shared/concessionValidation";
import { CONCESSION_LABELS } from "../../../../constants/labels";

const AddConcessionModal = ({ itemType, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(emptyConcessionForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (patch) => {
    setFormData((prev) => ({ ...prev, ...patch }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationError = validateConcessionForm(formData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await CONCESSION_SERVICE_BY_TYPE[itemType].create(buildConcessionPayload(itemType, formData));
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(mapConcessionApiError(error, CONCESSION_LABELS.errorCreate));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title={`${CONCESSION_LABELS.addModalTitle} — ${ITEM_TYPE_META[itemType].label}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <ConcessionFormFields formData={formData} onChange={handleChange} />
        </div>
        <ConcessionModalFooter onCancel={onClose} submitLabel={CONCESSION_LABELS.addButton} isSubmitting={isSubmitting} />
      </form>
    </ModalShell>
  );
};

export default AddConcessionModal;
