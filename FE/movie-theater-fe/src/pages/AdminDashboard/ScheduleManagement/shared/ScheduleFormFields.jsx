import React, { useEffect, useMemo, useState } from "react";
import { Film, Monitor, Clock, Layers } from "lucide-react";
import CinemaRoomService from "../../../../services/CinemaRoomService";
import { SCHEDULE_LABELS } from "../../../../constants/labels";
import DateTimeInput from "../../../../components/DateTimeInput";
import {
  fieldInputIconClass,
  fieldSelectClass,
  fieldLabelClass,
  minScheduleDateTime,
  maxScheduleDateTime,
  computeEndTime,
} from "./scheduleFormConstants";

const RequiredMark = () => <span className="text-red-500 ml-0.5">*</span>;

const ScheduleFormFields = ({
  formData,
  onChange,
  movies,      // Active movies list
  rooms,       // Active rooms list
  roomLocked = false, // Edit mode: room was fixed at creation and cannot be changed
}) => {
  // Room already chosen (e.g. prefilled from clicking a room's row in the timeline)
  const selectedRoom = useMemo(
    () => rooms.find((r) => String(r.cinemaRoomId) === String(formData.cinemaRoomId)),
    [rooms, formData.cinemaRoomId]
  );

  // When a room is already selected, only offer movies that have a version the
  // room actually supports (e.g. an IMAX room only ever shows IMAX-format movies).
  const movieOptions = useMemo(() => {
    if (!selectedRoom) return movies;
    const roomVersionIds = new Set((selectedRoom.formats || []).map((f) => f.versionId));
    return movies.filter((m) => (m.versions || []).some((v) => roomVersionIds.has(v.versionId)));
  }, [movies, selectedRoom]);

  useEffect(() => {
    if (!formData.movieId) return;
    const stillValid = movieOptions.some((m) => String(m.movieId) === String(formData.movieId));
    if (!stillValid) {
      onChange({ target: { name: "movieId", value: "" } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieOptions]);

  // Find selected movie to show duration and compute end time
  const selectedMovie = useMemo(
    () => movies.find((m) => String(m.movieId) === String(formData.movieId)),
    [movies, formData.movieId]
  );

  const estimatedEndTime = useMemo(
    () => computeEndTime(formData.startTime, selectedMovie?.duration),
    [formData.startTime, selectedMovie]
  );

  // Versions available for selected movie
  const movieVersions = useMemo(
    () => (selectedMovie?.versions ? [...selectedMovie.versions] : []),
    [selectedMovie]
  );

  // Versions that both the movie and the (already-selected) room support. With
  // no room selected yet there is nothing to narrow down, so all of the movie's
  // versions stay on the table.
  const matchingVersions = useMemo(() => {
    if (!selectedRoom) return movieVersions;
    const roomVersionIds = new Set((selectedRoom.formats || []).map((f) => f.versionId));
    return movieVersions.filter((v) => roomVersionIds.has(v.versionId));
  }, [movieVersions, selectedRoom]);

  // Exactly one format matches the room → assign it automatically, no picker.
  // More than one → clear an out-of-date choice and force an explicit pick.
  useEffect(() => {
    if (!selectedMovie || !selectedRoom) return;
    if (matchingVersions.length === 1) {
      const only = String(matchingVersions[0].versionId);
      if (String(formData.versionId) !== only) {
        onChange({ target: { name: "versionId", value: only } });
      }
    } else if (
      formData.versionId &&
      !matchingVersions.some((v) => String(v.versionId) === String(formData.versionId))
    ) {
      onChange({ target: { name: "versionId", value: "" } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMovie, selectedRoom, matchingVersions]);

  // Rooms filtered to the ones supporting the selected format
  const [formatFilteredRooms, setFormatFilteredRooms] = useState(null);

  useEffect(() => {
    if (roomLocked || !formData.versionId) {
      setFormatFilteredRooms(null);
      return;
    }
    let cancelled = false;
    CinemaRoomService.getByFormat(formData.versionId)
      .then((res) => {
        if (!cancelled) setFormatFilteredRooms(res.data?.data || res.data || []);
      })
      .catch(() => {
        if (!cancelled) setFormatFilteredRooms([]);
      });
    return () => {
      cancelled = true;
    };
  }, [formData.versionId, roomLocked]);

  const roomOptions = formatFilteredRooms !== null ? formatFilteredRooms : rooms;

  useEffect(() => {
    if (roomLocked || !formData.cinemaRoomId) return;
    const stillValid = roomOptions.some((r) => String(r.cinemaRoomId) === String(formData.cinemaRoomId));
    if (!stillValid) {
      onChange({ target: { name: "cinemaRoomId", value: "" } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomOptions, roomLocked]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-left">
      {/* Chọn phim */}
      <div className="md:col-span-2">
        <label className={fieldLabelClass}>
          Phim <RequiredMark />
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <Film size={15} />
          </span>
          <select
            name="movieId"
            value={formData.movieId}
            onChange={onChange}
            required
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white"
          >
            <option value="">-- Chọn phim --</option>
            {movieOptions.map((m) => (
              <option key={m.movieId} value={m.movieId}>
                {m.movieNameVn} ({m.duration} phút)
              </option>
            ))}
          </select>
        </div>
        {selectedMovie && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Thời lượng: {selectedMovie.duration} phút
          </p>
        )}
        {selectedRoom && movieOptions.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            Không có phim nào hỗ trợ định dạng của phòng này.
          </p>
        )}
      </div>

      {/* Định dạng chiếu — chỉ hiện sau khi đã chọn phim */}
      {selectedMovie && (
        <div className="md:col-span-2">
          <label className={fieldLabelClass}>
            Định dạng chiếu <RequiredMark />
          </label>
          {selectedRoom && matchingVersions.length === 1 ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                <Layers size={15} />
              </span>
              <input
                type="text"
                readOnly
                value={`${matchingVersions[0].versionName} (tự động gán — phòng chỉ hỗ trợ định dạng này)`}
                className="block w-full rounded-lg border border-gray-100 dark:border-gray-800 pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                <Layers size={15} />
              </span>
              <select
                name="versionId"
                value={formData.versionId}
                onChange={onChange}
                required
                className="block w-full rounded-lg border border-gray-200 dark:border-gray-700 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white dark:bg-gray-800/60 dark:text-white"
              >
                <option value="">-- Chọn định dạng --</option>
                {(selectedRoom ? matchingVersions : movieVersions).map((v) => (
                  <option key={v.versionId} value={v.versionId}>
                    {v.versionName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {(selectedRoom ? matchingVersions : movieVersions).length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              {selectedRoom
                ? "Phim này không có định dạng nào khớp với phòng đã chọn."
                : "Phim này chưa có định dạng nào được gán."}
            </p>
          )}
        </div>
      )}

      {/* Chọn phòng chiếu */}
      <div className="md:col-span-2">
        <label className={fieldLabelClass}>
          Phòng chiếu <RequiredMark />
        </label>
        {roomLocked ? (
          <>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-white/40 pointer-events-none">
                <Monitor size={15} />
              </span>
              <input
                type="text"
                readOnly
                value={selectedRoom ? `${selectedRoom.cinemaRoomName} (sức chứa: ${selectedRoom.seatQuantity ?? "?"})` : ""}
                className="block w-full rounded-lg border border-gray-100 dark:border-white/10 pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-white/5 text-[#6B7280] dark:text-white/50 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-[#9CA3AF] dark:text-white/40 mt-1">{SCHEDULE_LABELS.editRoomLockedHint}</p>
          </>
        ) : (
          <>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] dark:text-white/40 pointer-events-none">
                <Monitor size={15} />
              </span>
              <select
                name="cinemaRoomId"
                value={formData.cinemaRoomId}
                onChange={onChange}
                required
                className="block w-full rounded-lg border border-gray-200 dark:border-white/10 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all shadow-sm bg-white dark:bg-[#10131A]/90"
              >
                <option value="">-- Chọn phòng chiếu --</option>
                {roomOptions.map((r) => (
                  <option key={r.cinemaRoomId} value={r.cinemaRoomId}>
                    {r.cinemaRoomName} (sức chứa: {r.seatQuantity ?? "?"})
                  </option>
                ))}
              </select>
            </div>
            {formData.versionId && roomOptions.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                Không có phòng chiếu nào hỗ trợ định dạng đã chọn.
              </p>
            )}
          </>
        )}
      </div>

      {/* Ngày giờ bắt đầu */}
      <div>
        <label className={fieldLabelClass}>
          Ngày &amp; giờ bắt đầu <RequiredMark />
        </label>
        <DateTimeInput
          name="startTime"
          value={formData.startTime}
          onChange={onChange}
          min={minScheduleDateTime()}
          max={maxScheduleDateTime()}
          className={fieldInputIconClass}
        />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Phải từ ngày mai, tối đa 10 ngày tới. Khung giờ cho phép: 08:00 – 23:00.</p>
      </div>

      {/* Giờ kết thúc dự kiến (readonly) */}
      <div>
        <label className={fieldLabelClass}>Giờ kết thúc dự kiến</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <Clock size={15} />
          </span>
          <input
            type="text"
            readOnly
            value={estimatedEndTime || "— (chọn phim & giờ bắt đầu)"}
            className="block w-full rounded-lg border border-gray-100 dark:border-gray-800 pl-10 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tính tự động = startTime + thời lượng phim.</p>
      </div>

      {/* Thời gian nghỉ giữa suất chiếu */}
      <div>
        <label className={fieldLabelClass}>Thời gian nghỉ giữa suất chiếu (dọn vệ sinh, phút)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
            <Clock size={15} />
          </span>
          <input
            type="number"
            name="bufferTime"
            value={formData.bufferTime}
            onChange={onChange}
            min={0}
            max={120}
            placeholder="Mặc định: 30"
            className={fieldInputIconClass}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Khoảng trống giữa 2 suất chiếu (đã tính khi kiểm tra trùng giờ).</p>
      </div>
    </div>
  );
};

export default ScheduleFormFields;
