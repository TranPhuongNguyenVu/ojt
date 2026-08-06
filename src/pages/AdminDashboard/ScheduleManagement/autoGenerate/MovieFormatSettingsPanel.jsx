import { ChevronUp } from "lucide-react";
import { fieldLabelClass, roomAcceptsVersion, roomFormatBadge } from "../shared/scheduleFormConstants";
import { MIN_FORMAT_RATIO, MAX_FORMAT_RATIO, classifyVersions, computeFormatWeights } from "./movieFormatSettings";

const MovieFormatSettingsPanel = ({
  movie,
  rooms,
  selectedRoomIds,
  ratio,
  onChangeRatio,
  settings,
  onChangeFormatRatio,
  onToggleFormat,
  onToggleRoom,
  onCollapse,
  exclusiveRoomsByMovie = {}, // roomId -> movieId (other movies that have claimed this room)
}) => {
  const allVersions = movie.versions || [];
  const selectedRooms = rooms.filter((r) => selectedRoomIds.includes(r.cinemaRoomId));

  // Classify versions: ratio (2D/3D share a room) vs toggle (4DX/IMAX exclusive rooms)
  const { ratioVersionIds, toggleVersionIds } = classifyVersions(movie, selectedRooms);

  const ratioVersions = allVersions.filter((v) => ratioVersionIds.has(v.versionId));
  const toggleVersions = allVersions.filter((v) => toggleVersionIds.has(v.versionId));

  // Currently active ratio-group versions (those with a key in formatRatios)
  const formatRatiosForRatioGroup = settings?.formatRatios
    ? Object.fromEntries(
        Object.entries(settings.formatRatios).filter(([vid]) =>
          ratioVersionIds.has(Number(vid))
        )
      )
    : {};

  const formatWeights = computeFormatWeights(
    { versions: ratioVersions },
    Object.keys(formatRatiosForRatioGroup).length ? formatRatiosForRatioGroup : null
  );

  const activeRatioVersionIds = formatWeights.map((f) => f.versionId);
  const ratioOf = (versionId) => settings?.formatRatios?.[String(versionId)] ?? MIN_FORMAT_RATIO;
  const isToggleOn = (versionId) =>
    Object.prototype.hasOwnProperty.call(settings?.formatRatios ?? {}, String(versionId));
  const isLastRatioIncluded = activeRatioVersionIds.length === 1;

  // Active ratio versions that are currently enabled (checked)
  const activeRatioVersions = ratioVersions.filter((v) => activeRatioVersionIds.includes(v.versionId));
  // Show the inline ratio editor only when ≥2 ratio-group versions are active
  const showInlineRatio = activeRatioVersions.length >= 2;

  // Eligible rooms depend on all currently active versions
  const allActiveVersionIds = [
    ...activeRatioVersionIds,
    ...toggleVersions.filter((v) => isToggleOn(v.versionId)).map((v) => v.versionId),
  ];
  const eligibleRooms = selectedRooms.filter((r) =>
    allActiveVersionIds.some((vid) => roomAcceptsVersion(r, vid))
  );

  const roomIds = settings?.roomIds ?? [];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate">
          Cấu hình: {movie.movieNameVn}
        </p>
        <button
          type="button"
          onClick={onCollapse}
          className="flex-none text-gray-400 hover:text-[#C00000] dark:hover:text-[#ff4d57] transition-colors"
          aria-label="Thu gọn"
          title="Thu gọn"
        >
          <ChevronUp size={16} />
        </button>
      </div>

      {/* Movie priority + inline 2D/3D ratio (same row) */}
      <section>
        <div className="flex items-end gap-6 flex-wrap">
          {/* Priority input */}
          <div>
            <p className={fieldLabelClass}>Ưu tiên giữa các phim</p>
            <input
              type="number"
              min="1"
              max="5"
              value={ratio}
              onChange={(e) => onChangeRatio(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
              className="w-20 text-sm text-center border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white rounded-lg px-2 py-1.5"
            />
          </div>

          {/* Inline 2D/3D ratio — only visible when >=2 ratio versions are active */}
          {showInlineRatio && (
            <div>
              <p className={fieldLabelClass}>
                Tỉ lệ {activeRatioVersions.map((v) => v.versionName).join(" / ")}{" "}
                <span className="text-gray-400 dark:text-gray-500 font-normal normal-case">(trong cùng 1 phòng)</span>
              </p>
              <div className="flex items-center gap-1.5">
                {activeRatioVersions.map((v, idx) => (
                  <span key={v.versionId} className="flex items-center gap-1.5">
                    {idx > 0 && (
                      <span className="text-gray-400 dark:text-gray-500 font-bold text-sm">:</span>
                    )}
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-8 text-right">
                      {v.versionName}
                    </span>
                    <input
                      type="number"
                      min={MIN_FORMAT_RATIO}
                      max={MAX_FORMAT_RATIO}
                      value={ratioOf(v.versionId)}
                      onChange={(e) =>
                        onChangeFormatRatio(
                          movie,
                          v.versionId,
                          Math.min(MAX_FORMAT_RATIO, Math.max(MIN_FORMAT_RATIO, Number(e.target.value) || MIN_FORMAT_RATIO))
                        )
                      }
                      className="w-14 text-sm text-center border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white rounded-lg px-2 py-1.5"
                    />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Format checkboxes — simple ON/OFF for all formats, no ratio numbers */}
      <section>
        <p className={fieldLabelClass}>Tỉ lệ định dạng chiếu</p>
        <div className="space-y-2 mt-2">
          {allVersions.map((v) => {
            const isRatio = ratioVersionIds.has(v.versionId);
            const included = isRatio
              ? activeRatioVersionIds.includes(v.versionId)
              : isToggleOn(v.versionId);
            const isLastRatio = isRatio && included && isLastRatioIncluded;

            return (
              <div key={v.versionId} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={included}
                  disabled={isLastRatio}
                  title={isLastRatio ? "Phải giữ lại ít nhất 1 định dạng 2D/3D" : undefined}
                  onChange={(e) => onToggleFormat(movie, v.versionId, e.target.checked)}
                  className="accent-[#C00000]"
                />
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  {v.versionName}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Optional room restriction */}
      <section>
        <p className={fieldLabelClass}>Phòng chiếu riêng (tuỳ chọn)</p>
        <div
          className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-800 rounded-lg p-2 bg-white dark:bg-gray-900/60 mt-2"
          title="Chỉ chọn nếu muốn giới hạn phim này vào 1 số phòng cụ thể. Mỗi phòng chỉ gắn được với 1 phim."
        >
          {eligibleRooms.map((r) => {
            const takenByOther = exclusiveRoomsByMovie[r.cinemaRoomId] && exclusiveRoomsByMovie[r.cinemaRoomId] !== movie.movieId;
            const isChecked = roomIds.includes(r.cinemaRoomId);
            return (
              <label
                key={r.cinemaRoomId}
                className={`flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 py-0.5 ${
                  takenByOther ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                title={takenByOther ? "Phòng này đã được chọn làm phòng chiếu riêng của phim khác" : undefined}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={takenByOther}
                  onChange={() => !takenByOther && onToggleRoom(movie, r.cinemaRoomId)}
                  className="accent-[#C00000] disabled:cursor-not-allowed"
                />
                <span className="flex-1 truncate" title={r.cinemaRoomName}>
                  {r.cinemaRoomName}
                </span>
                <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">
                  {roomFormatBadge(r)}
                </span>
                {takenByOther && (
                  <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold">Đã dùng</span>
                )}
              </label>
            );
          })}
          {eligibleRooms.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-1">Không có phòng phù hợp trong phạm vi đã chọn.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MovieFormatSettingsPanel;
