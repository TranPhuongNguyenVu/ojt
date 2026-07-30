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
