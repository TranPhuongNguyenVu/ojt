import AuthService from "./AuthService";

const MovieService = {
  // Lấy toàn bộ danh sách phim (Public)
  getAllMovies: () => {
    return AuthService.get("movies");
  },
  // Lấy chi tiết 1 phim theo ID (Public)
  getMovieById: (id) => {
    return AuthService.get(`movies/${id}`);
  },
  // Phim khả dụng để tạo suất chiếu (đã loại INACTIVE/DELETED ở BE)
  getSchedulableMovies: () => {
    return AuthService.get("movies/schedulable");
  },
  // Phim đang có suất chiếu trong tương lai (dùng cho ô đặt vé nhanh)
  getMoviesWithShowtimes: () => {
    return AuthService.get("movies/with-showtimes");
  },
  // Thêm phim mới (Admin)
  createMovie: (data) => AuthService.post("movies", data),
  // Sửa phim (Admin)
  updateMovie: (id, data) => AuthService.put(`movies/${id}`, data),
  // Tìm kiếm phim không dấu (Public)
  searchMovies: (keyword) => AuthService.get("movies/search", { params: { keyword } }),
  // Khôi phục phim đã xoá (Admin)
  restoreMovie: (id) => AuthService.patch(`movies/${id}/activate`),
  // Xoá phim (Admin)
  deleteMovie: (id) => AuthService.delete(`movies/${id}`),

  // --- API quản trị: trả toàn bộ phim kể cả UNSCHEDULED/INACTIVE (Admin/SystemAdmin) ---
  getAllMoviesAdmin: () => AuthService.get("admin/movies"),
  searchMoviesAdmin: (keyword) => AuthService.get("admin/movies/search", { params: { keyword } }),
  getMovieByIdAdmin: (id) => AuthService.get(`admin/movies/${id}`),
  // Lấy toàn bộ danh sách thể loại (Public)
  getTypes: () => AuthService.get("types"),
  // Thêm thể loại mới (Admin)
  createType: (typeName) => AuthService.post("types", { typeName }),
  // Upload ảnh lên Cloudinary
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return AuthService.post("upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default MovieService;
