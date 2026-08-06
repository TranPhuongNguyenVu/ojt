import React, { useEffect, useMemo, useRef, useState } from "react";
import { Edit, Search, Plus, Film, Ban, RotateCcw, Filter, ChevronDown, X } from "lucide-react";
import Pagination from "../../../components/Pagination";
import MovieService from "../../../services/MovieService";
import AddMovieModal from "./add/AddMovieModal";
import EditMovieModal from "./edit/EditMovieModal";
import MovieDetailModal from "./detail/MovieDetailModal";
import CellTooltip from "./shared/CellTooltip";
import {
  compareMoviesByStatusThenName,
  formatDate,
  getApiErrorMessage,
  getStatusBadge,
  mapMovieApiError,
} from "./shared/movieFormConstants";
import { extractTypeAndVersionOptions } from "../../../utils/extractTypesAndVersions";
import { MOVIE_LABELS, COMMON_LABELS } from "../../../constants/labels";

const PAGE_SIZE = 10;

const MovieManagement = () => {
  const [movies, setMovies] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState({ id: null, msg: "" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [viewingMovie, setViewingMovie] = useState(null);
  const [typeOptions, setTypeOptions] = useState([]);
  const [versionOptions, setVersionOptions] = useState([]);

  const [genreFilterIds, setGenreFilterIds] = useState([]);
  const [formatFilterIds, setFormatFilterIds] = useState([]);
  const [isGenreDropdownOpen, setIsGenreDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  const searchTimeoutRef = useRef(null);
  const genreDropdownRef = useRef(null);
  const formatDropdownRef = useRef(null);

  useEffect(() => {
    if (!isGenreDropdownOpen && !isFormatDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (genreDropdownRef.current && !genreDropdownRef.current.contains(e.target)) {
        setIsGenreDropdownOpen(false);
      }
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target)) {
        setIsFormatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isGenreDropdownOpen, isFormatDropdownOpen]);

  const fetchAll = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [moviesRes, typesRes] = await Promise.all([
        MovieService.getAllMoviesAdmin(),
        MovieService.getTypes(),
      ]);
      const data = moviesRes.data?.data || moviesRes.data || [];
      const { versionOptions: vo } = extractTypeAndVersionOptions(data);
      setTypeOptions(typesRes.data?.data || typesRes.data || []);
      setVersionOptions(vo);
      setMovies(data);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể tải danh sách phim."));
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateType = async (typeName) => {
    const res = await MovieService.createType(typeName);
    const created = res.data?.data || res.data;
    setTypeOptions((prev) => [...prev, created]);
    return created;
  };

  const fetchSearch = async (kw) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const res = await MovieService.searchMoviesAdmin(kw);
      setMovies(res.data?.data || res.data || []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể tìm kiếm phim."));
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleRefresh = () => {
    if (keyword.trim()) {
      fetchSearch(keyword.trim());
    } else {
      fetchAll();
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setKeyword(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (val.trim()) {
        fetchSearch(val.trim());
      } else {
        fetchAll();
      }
    }, 300);
  };

  const toggleGenreFilter = (typeId) => {
    setGenreFilterIds((prev) =>
      prev.includes(typeId) ? prev.filter((id) => id !== typeId) : [...prev, typeId]
    );
  };

  const toggleFormatFilter = (versionId) => {
    setFormatFilterIds((prev) =>
      prev.includes(versionId) ? prev.filter((id) => id !== versionId) : [...prev, versionId]
    );
  };

  const clearFilters = () => {
    setStatusFilter("ALL");
    setGenreFilterIds([]);
    setFormatFilterIds([]);
  };

  const hasActiveFilters =
    statusFilter !== "ALL" || genreFilterIds.length > 0 || formatFilterIds.length > 0;

  const filtered = useMemo(() => {
    return movies
      .filter((m) => {
        const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
        const matchesGenre =
          genreFilterIds.length === 0 ||
          (m.types || []).some((t) => genreFilterIds.includes(t.typeId));
        const matchesFormat =
          formatFilterIds.length === 0 ||
          (m.versions || []).some((v) => formatFilterIds.includes(v.versionId));
        return matchesStatus && matchesGenre && matchesFormat;
      })
      .sort(compareMoviesByStatusThenName);
  }, [movies, statusFilter, genreFilterIds, formatFilterIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // Reset page only when the filter/search criteria change, not on a plain refresh
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, genreFilterIds, formatFilterIds]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleDeactivateMovie = async (movie) => {
    setActionError({ id: null, msg: "" });
    try {
      await MovieService.deleteMovie(movie.movieId);
      handleRefresh();
    } catch (error) {
      const msg = mapMovieApiError(error, "Không thể ngừng hoạt động phim.");
      setActionError({ id: movie.movieId, msg });
    }
  };

  const handleRestoreMovie = async (movie) => {
    setActionError({ id: null, msg: "" });
    try {
      await MovieService.restoreMovie(movie.movieId);
      handleRefresh();
    } catch (error) {
      const msg = mapMovieApiError(error, "Không thể khôi phục phim.");
      setActionError({ id: movie.movieId, msg });
    }
  };

  const thClass =
    "px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-bold overflow-hidden";
  const tdClass = "px-4 py-3 text-sm text-gray-600 dark:text-gray-300 overflow-hidden";

  const statusOptions = [
    { value: "ALL", label: MOVIE_LABELS.filterAll },
    { value: "UPCOMING", label: MOVIE_LABELS.statusUpcoming },
    { value: "SHOWING", label: MOVIE_LABELS.statusShowing },
    { value: "ENDED", label: MOVIE_LABELS.statusEnded },
    { value: "UNSCHEDULED", label: MOVIE_LABELS.statusUnscheduled },
    { value: "INACTIVE", label: MOVIE_LABELS.statusInactive },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shrink-0 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white shrink-0">Quản lý phim</h2>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={handleSearchChange}
              maxLength={100}
              placeholder="Tìm kiếm phim..."
              className="bg-gray-100 dark:bg-gray-800/60 dark:text-white text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 w-48"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <Plus size={16} />
            Thêm phim
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 px-5 py-4 flex flex-wrap items-center gap-6">
          <Filter size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{MOVIE_LABELS.filterStatus}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2" ref={formatDropdownRef}>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{MOVIE_LABELS.filterFormat}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFormatDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 min-w-[90px] justify-between"
              >
                <span className="truncate max-w-[140px]">
                  {formatFilterIds.length === 0
                    ? MOVIE_LABELS.filterAll
                    : versionOptions
                        .filter((v) => formatFilterIds.includes(v.versionId))
                        .map((v) => v.versionName)
                        .join(", ")}
                </span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
              </button>

              {isFormatDropdownOpen && (
                <div className="absolute z-10 mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1">
                  {versionOptions.map((option) => {
                    const isChecked = formatFilterIds.includes(option.versionId);
                    return (
                      <label
                        key={option.versionId}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFormatFilter(option.versionId)}
                          className="accent-indigo-600 cursor-pointer"
                        />
                        {option.versionName}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2" ref={genreDropdownRef}>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{MOVIE_LABELS.filterGenre}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsGenreDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 min-w-[90px] justify-between"
              >
                <span className="truncate max-w-[140px]">
                  {genreFilterIds.length === 0
                    ? MOVIE_LABELS.filterAll
                    : typeOptions
                        .filter((t) => genreFilterIds.includes(t.typeId))
                        .map((t) => t.typeName)
                        .join(", ")}
                </span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
              </button>

              {isGenreDropdownOpen && (
                <div className="absolute z-10 mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1">
                  {typeOptions.map((option) => {
                    const isChecked = genreFilterIds.includes(option.typeId);
                    return (
                      <label
                        key={option.typeId}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleGenreFilter(option.typeId)}
                          className="accent-indigo-600 cursor-pointer"
                        />
                        {option.typeName}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-[#C00000] transition-colors cursor-pointer"
            >
              <X size={14} />
              {MOVIE_LABELS.clearFilters}
            </button>
          )}
        </div>

        <div className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1340px] table-fixed text-left border-collapse">
              <colgroup>
                <col className="w-20" />
                <col className="w-64" />
                <col className="w-40" />
                <col className="w-28" />
                <col className="w-28" />
                <col className="w-56" />
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-28" />
              </colgroup>
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                  <th className={thClass}>Poster</th>
                  <th className={thClass}>Tên phim</th>
                  <th className={`${thClass} whitespace-nowrap`}>{MOVIE_LABELS.columnDuration}</th>
                  <th className={thClass}>{MOVIE_LABELS.columnStartDate}</th>
                  <th className={thClass}>{MOVIE_LABELS.columnEndDate}</th>
                  <th className={thClass}>Thể loại</th>
                  <th className={thClass}>Định dạng</th>
                  <th className={`${thClass} text-center`}>Trạng thái</th>
                  <th className={`${thClass} text-center`}>Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-4 py-16 text-center text-gray-500 dark:text-gray-400">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-16 text-center text-[#C00000] font-black text-2xl tracking-widest uppercase"
                    >
                      {hasActiveFilters ? MOVIE_LABELS.noMovieMatchesFilter : COMMON_LABELS.emptyList}
                    </td>
                  </tr>
                ) : (
                  paginated.map((movie) => {
                    const statusBadge = getStatusBadge(movie.status);
                    const isInactive = movie.status === "INACTIVE";
                    const types = movie.types || [];
                    const versions = movie.versions || [];
                    const visibleTypes = types.slice(0, 2);
                    const visibleVersions = versions.slice(0, 3);
                    return (
                      <tr
                        key={movie.movieId}
                        onClick={() => setViewingMovie(movie)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer"
                      >
                        {/* Poster */}
                        <td className={tdClass}>
                          <div className="w-10 h-14 rounded overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            {movie.smallImage ? (
                              <img
                                src={movie.smallImage}
                                alt={movie.movieNameVn}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                <Film size={18} />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Tên */}
                        <td className={tdClass}>
                          <p className="font-semibold text-gray-900 dark:text-white truncate" title={movie.movieNameVn}>
                            {movie.movieNameVn}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate" title={movie.movieNameEnglish}>
                            {movie.movieNameEnglish}
                          </p>
                        </td>

                        {/* Thời lượng */}
                        <td className={`${tdClass} whitespace-nowrap`}>{movie.duration ?? "—"}</td>

                        {/* Ngày bắt đầu / kết thúc */}
                        <td className={`${tdClass} text-xs whitespace-nowrap`}>{formatDate(movie.fromDate)}</td>
                        <td className={`${tdClass} text-xs whitespace-nowrap`}>{formatDate(movie.toDate)}</td>

                        {/* Thể loại */}
                        <td className={tdClass}>
                          <CellTooltip
                            items={types}
                            renderItem={(t) => t.typeName}
                            ariaLabel={`Thể loại: ${types.map((t) => t.typeName).join(", ") || "—"}`}
                          >
                            <div className="flex flex-wrap gap-1">
                              {visibleTypes.map((t) => (
                                <span
                                  key={t.typeId}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-950/40 text-[#C00000] dark:text-red-300 font-medium whitespace-nowrap"
                                >
                                  {t.typeName}
                                </span>
                              ))}
                              {types.length > visibleTypes.length && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                  +{types.length - visibleTypes.length}
                                </span>
                              )}
                            </div>
                          </CellTooltip>
                        </td>

                        {/* Định dạng */}
                        <td className={tdClass}>
                          <CellTooltip
                            items={versions}
                            renderItem={(v) => v.versionName}
                            ariaLabel={`Định dạng: ${versions.map((v) => v.versionName).join(", ") || "—"}`}
                          >
                            <div className="flex flex-wrap gap-1">
                              {visibleVersions.map((v) => (
                                <span
                                  key={v.versionId}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium whitespace-nowrap"
                                >
                                  {v.versionName}
                                </span>
                              ))}
                              {versions.length > visibleVersions.length && (
                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                  +{versions.length - visibleVersions.length}
                                </span>
                              )}
                            </div>
                          </CellTooltip>
                        </td>

                        {/* Status badge */}
                        <td className={tdClass}>
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className={tdClass} onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              {!isInactive && (
                                <button
                                  type="button"
                                  onClick={() => setEditingMovie(movie)}
                                  className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                                  title="Chỉnh sửa"
                                >
                                  <Edit size={15} />
                                </button>
                              )}

                              {isInactive ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreMovie(movie)}
                                  className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1.5 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                                  title="Khôi phục"
                                >
                                  <RotateCcw size={15} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDeactivateMovie(movie)}
                                  className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-md transition-colors"
                                  title="Ngừng hoạt động"
                                >
                                  <Ban size={15} />
                                </button>
                              )}
                            </div>

                            {/* Inline action error for this row */}
                            {actionError.id === movie.movieId && (
                              <p className="text-xs text-red-500 dark:text-red-400 text-center max-w-[120px] leading-tight">
                                {actionError.msg}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filtered.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="phim"
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {isAddModalOpen && (
        <AddMovieModal
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleRefresh}
          typeOptions={typeOptions}
          versionOptions={versionOptions}
          onCreateType={handleCreateType}
        />
      )}

      {editingMovie && (
        <EditMovieModal
          movie={editingMovie}
          onClose={() => setEditingMovie(null)}
          onSuccess={handleRefresh}
          typeOptions={typeOptions}
          versionOptions={versionOptions}
          onCreateType={handleCreateType}
        />
      )}

      {viewingMovie && (
        <MovieDetailModal
          movie={viewingMovie}
          onClose={() => setViewingMovie(null)}
          onEdit={() => {
            setEditingMovie(viewingMovie);
            setViewingMovie(null);
          }}
        />
      )}
    </div>
  );
};

export default MovieManagement;
