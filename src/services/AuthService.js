import axios from "axios";

const getBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8080/api/";
  }
  if (window.location.hostname === "ojt-f8jy.onrender.com") {
    return "https://ojt-f8jy.onrender.com/api/";
  }
  return "https://cinemapromaxbe-epfzgtawb0g9bjdj.centralindia-01.azurewebsites.net/api/";
};

const AuthService = axios.create({
  baseURL: getBaseURL(),
  // DÒNG NÀY LÀ LINH HỒN CỦA TÍNH NĂNG: Ép Trình duyệt kẹp Cookie gửi đi!
  withCredentials: true,
});

export default AuthService;
