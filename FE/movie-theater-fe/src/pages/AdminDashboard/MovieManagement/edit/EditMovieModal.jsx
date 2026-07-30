import React, { useState } from "react";
import MovieService from "../../../../services/MovieService";
import ModalShell from "../../../../components/ModalShell";
import MovieModalFooter from "../shared/MovieModalFooter";
import MovieFormFields from "../shared/MovieFormFields";
import {
  buildMoviePayload,
  getApiErrorMessage,
  toDateInputValue,
} from "../shared/movieFormConstants";
import { validateMovieForm } from "../shared/movieValidation";

const EditMovieModal = ({ movie, onClose, onSuccess, typeOptions, versionOptions }) => {
  const [formData, setFormData] = useState({
    movieNameEnglish: movie.movieNameEnglish || "",
    movieNameVn: movie.movieNameVn || "",
    director: movie.director || "",
    actor: movie.actor || "",
    movieProductionCompany: movie.movieProductionCompany || "",
    duration: movie.duration || "",
    trailer: movie.trailer || "",
    fromDate: toDateInputValue(movie.fromDate),
    toDate: toDateInputValue(movie.toDate),
    content: movie.content || "",
    largeImage: movie.largeImage || "",
    smallImage: movie.smallImage || "",
    typeIds: (movie.types || []).map((t) => t.typeId),
    versionIds: (movie.versions || []).map((v) => v.versionId),
  });
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
      await MovieService.updateMovie(movie.movieId, buildMoviePayload(formData));
      onSuccess();
      onClose();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể cập nhật phim."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell title={`Sửa phim: ${movie.movieNameVn}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col overflow-hidden flex-1">
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
          submitLabel="Lưu thay đổi"
          isSubmitting={isSubmitting}
        />
      </form>
    </ModalShell>
  );
};

export default EditMovieModal;
