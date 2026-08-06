import React from "react";
import { Edit, Film, User, Clock, Link as LinkIcon, Calendar, Building2 } from "lucide-react";
import ModalShell from "../../../../components/ModalShell";
import { formatDate, getStatusBadge } from "../shared/movieFormConstants";

const InfoRow = ({ icon: Icon, label, children }) => (
  <div className="flex items-start gap-2">
    {Icon && <Icon size={15} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />}
    <div className="min-w-0">
      <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-800 dark:text-gray-200 break-words">{children || "—"}</p>
    </div>
  </div>
);

const MovieDetailModal = ({ movie, onClose, onEdit }) => {
  const statusBadge = getStatusBadge(movie.status);
  const types = movie.types || [];
  const versions = movie.versions || [];

  return (
    <ModalShell title={movie.movieNameVn} onClose={onClose}>
      <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Poster */}
        <div className="flex flex-col gap-3">
          <div className="w-full aspect-[2/3] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
            {movie.largeImage || movie.smallImage ? (
              <img
                src={movie.largeImage || movie.smallImage}
                alt={movie.movieNameVn}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                <Film size={32} />
              </div>
            )}
          </div>
          <span
            className={`inline-flex self-start items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge.cls}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon={Film} label="Tên phim (Tiếng Việt)">{movie.movieNameVn}</InfoRow>
            <InfoRow icon={Film} label="Tên phim (Tiếng Anh)">{movie.movieNameEnglish}</InfoRow>
            <InfoRow icon={User} label="Đạo diễn">{movie.director}</InfoRow>
            <InfoRow icon={User} label="Diễn viên">{movie.actor}</InfoRow>
            <InfoRow icon={Building2} label="Nhà sản xuất">{movie.movieProductionCompany}</InfoRow>
            <InfoRow icon={Clock} label="Thời lượng">{movie.duration ? `${movie.duration} phút` : "—"}</InfoRow>
            <InfoRow icon={Calendar} label="Ngày bắt đầu">{formatDate(movie.fromDate)}</InfoRow>
            <InfoRow icon={Calendar} label="Ngày kết thúc">{formatDate(movie.toDate)}</InfoRow>
          </div>

          {movie.trailer && (
            <InfoRow icon={LinkIcon} label="Trailer">
              <a
                href={movie.trailer}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C00000] hover:underline break-all"
              >
                {movie.trailer}
              </a>
            </InfoRow>
          )}

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Thể loại</p>
            <div className="flex flex-wrap gap-1.5">
              {types.length === 0 ? (
                <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
              ) : (
                types.map((t) => (
                  <span
                    key={t.typeId}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-950/40 text-[#C00000] dark:text-red-300 font-medium"
                  >
                    {t.typeName}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Định dạng</p>
            <div className="flex flex-wrap gap-1.5">
              {versions.length === 0 ? (
                <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
              ) : (
                versions.map((v) => (
                  <span
                    key={v.versionId}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium"
                  >
                    {v.versionName}
                  </span>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Nội dung phim</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{movie.content || "—"}</p>
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
        {movie.status !== "INACTIVE" && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            <Edit size={15} />
            Chỉnh sửa
          </button>
        )}
      </div>
    </ModalShell>
  );
};

export default MovieDetailModal;
