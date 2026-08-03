import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye, Plus, Power, PowerOff, Armchair, X, Filter, ChevronDown } from "lucide-react";
import CinemaRoomService from "../../../services/CinemaRoomService";
import VersionService from "../../../services/VersionService";
import Pagination from "../../../components/Pagination";
import AddCinemaRoomModal from "./add/AddCinemaRoomModal";
import DeactivateCinemaRoomModal from "./delete/DeactivateCinemaRoomModal";
import { CINEMA_ROOM_LABELS, COMMON_LABELS } from "../../../constants/labels";
import {
  ROOM_STATUS,
  buildFormatOptions,
  getApiErrorMessage,
  getRoomStatusBadge,
} from "./shared/cinemaRoomFormConstants";

const PAGE_SIZE = 10;
const STATUS_FILTER_ALL = "ALL";

const CinemaRoomManagement = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [versions, setVersions] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState({ id: null, msg: "" });

  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [formatFilterLabels, setFormatFilterLabels] = useState([]);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [roomToDeactivate, setRoomToDeactivate] = useState(null);

  const searchTimeoutRef = useRef(null);
  const formatDropdownRef = useRef(null);

  useEffect(() => {
    if (!isFormatDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target)) {
        setIsFormatDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFormatDropdownOpen]);

  const fetchRooms = async (searchKeyword = "") => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = searchKeyword.trim()
        ? await CinemaRoomService.search(searchKeyword.trim())
        : await CinemaRoomService.getAll();
      const sorted = [...(response.data.data || [])].sort((a, b) =>
        a.cinemaRoomName.localeCompare(b.cinemaRoomName, "vi", { numeric: true })
      );
      setRooms(sorted);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể tải danh sách phòng chiếu."));
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await VersionService.getAll();
      setVersions(response.data.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchVersions();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setKeyword(val);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchRooms(val);
    }, 300);
  };

  const formatOptions = useMemo(() => buildFormatOptions(versions), [versions]);

  const toggleFormatFilter = (label) => {
    setFormatFilterLabels((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    );
  };

  const clearFilters = () => {
    setStatusFilter(STATUS_FILTER_ALL);
    setFormatFilterLabels([]);
  };

  const hasActiveFilters = statusFilter !== STATUS_FILTER_ALL || formatFilterLabels.length > 0;

  const selectedFormatIds = useMemo(
    () =>
      formatOptions
        .filter((opt) => formatFilterLabels.includes(opt.label))
        .flatMap((opt) => opt.formatIds),
    [formatOptions, formatFilterLabels]
  );

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesStatus =
        statusFilter === STATUS_FILTER_ALL || room.status === statusFilter;

      const matchesFormat =
        selectedFormatIds.length === 0 ||
        (room.formats || []).some((f) => selectedFormatIds.includes(f.versionId));

      return matchesStatus && matchesFormat;
    });
  }, [rooms, statusFilter, selectedFormatIds]);

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, formatFilterLabels]);

  const totalPages = Math.max(1, Math.ceil(filteredRooms.length / PAGE_SIZE));
  const paginatedRooms = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRooms.slice(start, start + PAGE_SIZE);
  }, [filteredRooms, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleActivate = async (room) => {
    setActionError({ id: null, msg: "" });
    try {
      await CinemaRoomService.activate(room.cinemaRoomId);
      fetchRooms(keyword);
    } catch (error) {
      setActionError({ id: room.cinemaRoomId, msg: getApiErrorMessage(error, CINEMA_ROOM_LABELS.hasSchedulesError) });
    }
  };

  const renderFormatBadges = (formats) => {
    if (!formats || formats.length === 0) {
      return <span className="text-gray-400 dark:text-gray-500 text-xs italic">—</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {formats.map((f) => (
          <span
            key={f.versionId}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium"
          >
            {f.versionName}
          </span>
        ))}
      </div>
    );
  };

  const thClass = "px-4 py-3 text-xs tracking-wider text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap";
  const tdClass = "px-4 py-3 text-sm text-gray-600 dark:text-gray-300";

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-950 font-sans -m-8 md:-m-10 transition-colors duration-300">
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 shrink-0 gap-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white shrink-0">{CINEMA_ROOM_LABELS.pageTitle}</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={handleSearchChange}
              maxLength={100}
              placeholder={COMMON_LABELS.search}
              className="bg-gray-100 dark:bg-gray-800/60 dark:text-white text-sm rounded-full pl-10 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 w-56"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[#C00000] hover:bg-[#a00000] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <Plus size={16} />
            {CINEMA_ROOM_LABELS.addRoom}
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8">
        {errorMessage && (
          <div className="mb-4 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {errorMessage}
          </div>
        )}

        <div className="mb-4 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 px-5 py-4 flex flex-wrap items-center gap-6">
          <Filter size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{CINEMA_ROOM_LABELS.filterStatus}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
            >
              <option value={STATUS_FILTER_ALL}>{CINEMA_ROOM_LABELS.filterAll}</option>
              <option value={ROOM_STATUS.ACTIVE}>{CINEMA_ROOM_LABELS.statusActive}</option>
              <option value={ROOM_STATUS.INACTIVE}>{CINEMA_ROOM_LABELS.statusInactive}</option>
            </select>
          </div>

          <div className="flex items-center gap-2" ref={formatDropdownRef}>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{CINEMA_ROOM_LABELS.filterFormat}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFormatDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/60 dark:text-white border-none rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 min-w-[90px] justify-between"
              >
                <span className="truncate max-w-[140px]">
                  {formatFilterLabels.length === 0
                    ? CINEMA_ROOM_LABELS.filterAll
                    : formatFilterLabels.join(", ")}
                </span>
                <ChevronDown size={14} className="text-gray-400 dark:text-gray-500 shrink-0" />
              </button>

              {isFormatDropdownOpen && (
                <div className="absolute z-10 mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg py-1">
                  {formatOptions.map((option) => {
                    const isChecked = formatFilterLabels.includes(option.label);
                    return (
                      <label
                        key={option.label}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFormatFilter(option.label)}
                          className="accent-indigo-600 cursor-pointer"
                        />
                        {option.label}
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
              {CINEMA_ROOM_LABELS.clearFilters}
            </button>
          )}
        </div>

        <div className="w-full bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-800">
                  <th className={thClass}>{CINEMA_ROOM_LABELS.columnRoomName}</th>
                  <th className={thClass}>{CINEMA_ROOM_LABELS.columnCapacity}</th>
                  <th className={thClass}>{CINEMA_ROOM_LABELS.columnFormats}</th>
                  <th className={`${thClass} text-center`}>{CINEMA_ROOM_LABELS.columnStatus}</th>
                  <th className={`${thClass} text-center`}>{CINEMA_ROOM_LABELS.columnActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-16 text-center text-gray-500 dark:text-gray-400">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : filteredRooms.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-16 text-center text-[#C00000] font-black text-2xl tracking-widest uppercase">
                      {hasActiveFilters ? CINEMA_ROOM_LABELS.noRoomMatchesFilter : COMMON_LABELS.emptyList}
                    </td>
                  </tr>
                ) : (
                  paginatedRooms.map((room) => {
                    const badge = getRoomStatusBadge(room.status);
                    const isActive = room.status === ROOM_STATUS.ACTIVE;
                    return (
                      <tr key={room.cinemaRoomId} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <td className={`${tdClass} font-semibold text-gray-900 dark:text-white`}>{room.cinemaRoomName}</td>
                        <td className={tdClass}>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Armchair size={16} className="text-gray-400 dark:text-gray-500" />
                            {room.seatQuantity ?? 0} {CINEMA_ROOM_LABELS.seatsSuffix}
                          </div>
                        </td>
                        <td className={tdClass}>{renderFormatBadges(room.formats)}</td>
                        <td className={tdClass}>
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.cls}`}>
                              {badge.label}
                            </span>
                          </div>
                        </td>
                        <td className={tdClass}>
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/cinema-rooms/${room.cinemaRoomId}`)}
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors"
                                title={CINEMA_ROOM_LABELS.actionDetail}
                              >
                                <Eye size={15} />
                              </button>
                              {isActive ? (
                                <button
                                  type="button"
                                  onClick={() => setRoomToDeactivate(room)}
                                  className="text-amber-500 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 p-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-md transition-colors"
                                  title={CINEMA_ROOM_LABELS.actionDeactivate}
                                >
                                  <PowerOff size={15} />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleActivate(room)}
                                  className="text-green-500 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1.5 bg-green-50 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-md transition-colors"
                                  title={CINEMA_ROOM_LABELS.actionActivate}
                                >
                                  <Power size={15} />
                                </button>
                              )}
                            </div>
                            {actionError.id === room.cinemaRoomId && (
                              <p className="text-xs text-red-500 dark:text-red-400 text-center max-w-[140px] leading-tight">
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

          {!isLoading && filteredRooms.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRooms.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="phòng"
            />
          )}
        </div>
      </main>

      {isCreateModalOpen && (
        <AddCinemaRoomModal
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => fetchRooms(keyword)}
          versions={versions}
        />
      )}

      {roomToDeactivate && (
        <DeactivateCinemaRoomModal
          room={roomToDeactivate}
          onClose={() => setRoomToDeactivate(null)}
          onSuccess={() => fetchRooms(keyword)}
        />
      )}
    </div>
  );
};

export default CinemaRoomManagement;
