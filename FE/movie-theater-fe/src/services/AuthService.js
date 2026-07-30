import axios from "axios";
const AuthService = axios.create({
  // Giữ nguyên cái đường dẫn cũ của sếp
  baseURL: "http://localhost:8080/api/", 
  
  // DÒNG NÀY LÀ LINH HỒN CỦA TÍNH NĂNG: Ép Trình duyệt kẹp Cookie gửi đi!
  withCredentials: true, 
});

export default AuthService;
