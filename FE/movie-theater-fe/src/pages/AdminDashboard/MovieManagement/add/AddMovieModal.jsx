import React, { useState } from "react";
import MovieService from "../../../../services/MovieService";
import ModalShell from "../../../../components/ModalShell";
import MovieModalFooter from "../shared/MovieModalFooter";
import MovieFormFields from "../shared/MovieFormFields";
import { emptyMovieForm, buildMoviePayload, getApiErrorMessage } from "../shared/movieFormConstants";
import { validateMovieForm } from "../shared/movieValidation";

const AddMovieModal = ({ onClose, onSuccess, typeOptions, versionOptions }) => {
  const [formData, setFormData] = useState(emptyMovieForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrorMessage("");
  };

  const handleTypeChange = (newIds) => {
    setFormData((prev) => ({ ...prev, typeIds: newIds }));
    setErrorMessage("");
  };

  const handleVersionChange = (newIds) => {
    setFormData((prev) => ({ ...prev, versionIds: newIds }));
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const validationError = validateMovieForm(formData);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      await MovieService.createMovie(buildMoviePayload(formData));
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể thêm phim mới."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title="Thêm phim mới" onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
              {errorMessage}
            </div>
          )}
          <MovieFormFields
            formData={formData}
            onChange={handleChange}
            onTypeChange={handleTypeChange}
            onVersionChange={handleVersionChange}
            typeOptions={typeOptions}
            versionOptions={versionOptions}
          />
        </div>
        <MovieModalFooter
          onCancel={onClose}
          submitLabel="Thêm phim"
          isSubmitting={isSubmitting}
        />
      </form>
    </ModalShell>
  );
};

export default AddMovieModal;
