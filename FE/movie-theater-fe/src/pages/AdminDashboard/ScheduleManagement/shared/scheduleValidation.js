import { isWithinAllowedHours, isWithinMaxDaysAhead, MAX_SCHEDULE_DAYS_AHEAD } from "./scheduleFormConstants";

/** Client-side validation for schedule form. Returns error string or null. */
export function validateScheduleForm(formData) {
  if (!formData.movieId) return "Vui lòng chọn phim.";
  if (!formData.versionId) return "Vui lòng chọn định dạng chiếu.";
  if (!formData.cinemaRoomId) return "Vui lòng chọn phòng chiếu.";
  if (!formData.startTime) return "Vui lòng chọn ngày giờ bắt đầu.";
  if (formData.startTime && !isWithinAllowedHours(formData.startTime))
    return "Suất chiếu chỉ được tạo trong khung giờ từ 08:00 đến 23:00.";
  if (formData.startTime && !isWithinMaxDaysAhead(formData.startTime))
    return `Chỉ có thể tạo suất chiếu trong vòng ${MAX_SCHEDULE_DAYS_AHEAD} ngày tới.`;
  if (formData.bufferTime !== "" && Number(formData.bufferTime) < 0)
    return "Thời gian đệm không được âm.";
  return null;
}
