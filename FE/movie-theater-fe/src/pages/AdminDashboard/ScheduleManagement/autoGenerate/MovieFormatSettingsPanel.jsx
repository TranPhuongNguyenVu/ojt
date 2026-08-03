import { ChevronUp } from "lucide-react";
import { fieldLabelClass, roomAcceptsVersion, roomFormatBadge } from "../shared/scheduleFormConstants";
import { MIN_FORMAT_RATIO, MAX_FORMAT_RATIO, computeFormatWeights } from "./movieFormatSettings";

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
}) => {
  const formatWeights = computeFormatWeights(movie, settings?.formatRatios);
  const ratioOf = (versionId) => settings?.formatRatios?.[String(versionId)] ?? MIN_FORMAT_RATIO;
  const activeVersionIds = formatWeights.map((f) => f.versionId);
  const allVersions = movie.versions || [];
  const showFormatCheckbox = allVersions.length > 1;
  const roomIds = settings?.roomIds ?? [];

  const eligibleRooms = rooms.filter(
    (r) => selectedRoomIds.includes(r.cinemaRoomId) && activeVersionIds.some((vid) => roomAcceptsVersion(r, vid))
  );

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 p-4 space-y-4">
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

      <section>
        <p className={fieldLabelClass}>Ưu tiên giữa các phim</p>
        <input
          type="number"
          min="1"
          max="5"
          value={ratio}
          onChange={(e) => onChangeRatio(Math.min(5, Math.max(1, Number(e.target.value) || 1)))}
          className="w-20 text-sm text-center border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white rounded-lg px-2 py-1.5"
        />
      </section>

      <section>
        <p className={fieldLabelClass}>Tỉ lệ định dạng chiếu</p>
        <div className="space-y-2 mt-2">
          {allVersions.map((v) => {
            const w = formatWeights.find((f) => f.versionId === v.versionId);
            const included = activeVersionIds.includes(v.versionId);
            const isLastIncluded = included && activeVersionIds.length === 1;
            return (
              <div key={v.versionId} className="flex items-center gap-3 text-sm">
                {showFormatCheckbox && (
                  <input
                    type="checkbox"
                    checked={included}
                    disabled={isLastIncluded}
                    title={isLastIncluded ? "Phải giữ lại ít nhất 1 định dạng" : undefined}
                    onChange={(e) => onToggleFormat(movie, v.versionId, e.target.checked)}
                    className="accent-[#C00000]"
                  />
                )}
                <span className="w-16 font-semibold text-gray-700 dark:text-gray-300">{v.versionName}</span>
                <input
                  type="number"
                  min={MIN_FORMAT_RATIO}
                  max={MAX_FORMAT_RATIO}
                  disabled={!included}
                  value={ratioOf(v.versionId)}
                  onChange={(e) =>
                    onChangeFormatRatio(
                      movie,
                      v.versionId,
                      Math.min(MAX_FORMAT_RATIO, Math.max(MIN_FORMAT_RATIO, Number(e.target.value) || MIN_FORMAT_RATIO))
                    )
                  }
                  className="w-16 text-sm text-center border border-gray-200 dark:border-gray-700 dark:bg-gray-800/60 dark:text-white rounded-lg px-2 py-1.5 disabled:opacity-40"
                />
                <span className="ml-auto text-xs font-bold text-[#C00000] dark:text-[#ff4d57] w-14 text-right">
                  {w ? `${w.percent.toFixed(1)}%` : "0%"}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <p className={fieldLabelClass}>Phòng chiếu riêng (tuỳ chọn)</p>
        <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 dark:border-gray-800 rounded-lg p-2 bg-white dark:bg-gray-900/60 mt-2">
          {eligibleRooms.map((r) => (
            <label key={r.cinemaRoomId} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer py-0.5">
              <input
                type="checkbox"
                checked={roomIds.includes(r.cinemaRoomId)}
                onChange={() => onToggleRoom(movie, r.cinemaRoomId)}
                className="accent-[#C00000]"
              />
              <span className="flex-1 truncate" title={r.cinemaRoomName}>
                {r.cinemaRoomName}
              </span>
              <span className="text-[10.5px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded px-1.5 py-0.5">
                {roomFormatBadge(r)}
              </span>
            </label>
          ))}
          {eligibleRooms.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 py-1">Không có phòng phù hợp trong phạm vi đã chọn.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default MovieFormatSettingsPanel;
