import AuthService from "./AuthService";

const ScheduleService = {
  // Lấy danh sách suất chiếu của 1 phim theo ID
  getSchedulesByMovieId: (movieId) => {
    return AuthService.get(`schedules/movie/${movieId}`);
  },
  // Lấy chi tiết 1 suất chiếu theo ID
  getScheduleById: (id) => {
    return AuthService.get(`schedules/${id}`);
  },
  // Lấy danh sách suất chiếu theo phòng chiếu
  getSchedulesByCinemaRoomId: (cinemaRoomId) =>
    AuthService.get(`schedules/room/${cinemaRoomId}`),
  // Lọc suất chiếu theo phim / phòng / ngày
  filter: (params) => AuthService.get("schedules/filter", { params }),
  // Thêm suất chiếu (Admin)
  createSchedule: (data) => AuthService.post("schedules", data),
  // Sửa suất chiếu (Admin)
  updateSchedule: (id, data) => AuthService.put(`schedules/${id}`, data),
  // Xoá suất chiếu (Admin)
  deleteSchedule: (id) => AuthService.delete(`schedules/${id}`),
  // Tạo tự động: xem trước danh sách suất chiếu (Admin)
  autoGeneratePreview: (data) => AuthService.post("schedules/auto-generate", data),
  // Tạo tự động: lưu hàng loạt các suất chiếu đã duyệt (Admin)
  autoGenerateConfirm: (data) =>
    AuthService.post("schedules/auto-generate/confirm", data),
};

export default ScheduleService;
