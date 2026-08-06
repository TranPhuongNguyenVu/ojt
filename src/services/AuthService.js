import axios from "axios";
const AuthService = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // DÒNG NÀY LÀ LINH HỒN CỦA TÍNH NĂNG: Ép Trình duyệt kẹp Cookie gửi đi!
  withCredentials: true,
});

export default AuthService;
