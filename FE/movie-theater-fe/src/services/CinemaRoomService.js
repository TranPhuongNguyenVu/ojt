import AuthService from "./AuthService";

const CinemaRoomService = {
  getAll: () => AuthService.get("cinema-rooms"),

  search: (keyword) =>
    AuthService.get("cinema-rooms/search", { params: { keyword } }),

  getById: (cinemaRoomId) => AuthService.get(`cinema-rooms/${cinemaRoomId}`),

  create: (data) => AuthService.post("cinema-rooms", data),

  /** Cập nhật thông tin cơ bản: tên + danh sách format. KHÔNG đụng seat map. */
  update: (id, data) => AuthService.put(`cinema-rooms/${id}`, data),

  deactivate: (id) => AuthService.delete(`cinema-rooms/${id}`),

  activate: (id) => AuthService.patch(`cinema-rooms/${id}/activate`),

  getByFormat: (versionId) => AuthService.get(`cinema-rooms/by-format/${versionId}`),

  getSeats: (id) => AuthService.get(`cinema-rooms/${id}/seats`),

  updateSeats: (id, data) => AuthService.put(`cinema-rooms/${id}/seats`, data),

  /** Tái tạo sơ đồ ghế: chỉ gửi { rows, columns }. Backend tự tính capacity. */
  recreateSeats: (id, data) =>
    AuthService.put(`cinema-rooms/${id}/recreate-seats`, data),
};

export default CinemaRoomService;
