import AuthService from "./AuthService";

const CustomerService = {   
    Login: (username, password) => {
        return AuthService.post("auth/login", { username, password });
    },
    Register: (data) => {
        return AuthService.post("auth/register", data);
    },
    Logout: () => {
        return AuthService.post("auth/logout");
    },
  lookupMember: (query) => {
    return AuthService.get("members/lookup", { params: { query } });
  },
  getCustomers: () => {
    return AuthService.get("members");
  },
  // Tự xem thông tin cá nhân của chính mình (không cần quyền Admin/Employee)
  getMyProfile: () => {
    return AuthService.get("members/me");
  },
  // Tự cập nhật thông tin cá nhân của chính mình
  updateMyProfile: (data) => {
    return AuthService.put("members/me", data);
  },
    // Thêm mới Member
    createCustomer: (data) => {
        return AuthService.post("members", data);
    },
    // Cập nhật thông tin Member
    updateCustomer: (memberId, data) => {
        return AuthService.put(`members/${memberId}`, data);
    },
    // Xóa vĩnh viễn Member
    deleteCustomer: (memberId) => {
        return AuthService.delete(`members/${memberId}`);
    },
    // Khóa tài khoản
    lockCustomer: (memberId) => {
        return AuthService.patch(`members/${memberId}/lock`);
    },
    // Mở khóa tài khoản
    unlockCustomer: (memberId) => {
        return AuthService.patch(`members/${memberId}/unlock`);
    },
    // Reset mật khẩu ngẫu nhiên gửi mail
    resetMemberPassword: (memberId) => {
        return AuthService.post(`members/${memberId}/reset-password`);
    },
    verifyOtp: (email, otpCode) => {
        return AuthService.post(`auth/verify-otp?email=${email}&otpCode=${otpCode}`);
    },
    checkOtp: (email, otpCode) => {
        return AuthService.post(`auth/check-otp?email=${email}&otpCode=${otpCode}`);
    },
    verifyAndChangePassword: (email, otpCode, newPassword) => {
        return AuthService.post("auth/verify-and-change-password", { email, otpCode, newPassword });
    },
    checkEmail: (email) => {
        return AuthService.post(`auth/check-email?email=${email}`);
    },
    forgotPassword: (email) => {
        return AuthService.post(`auth/forgot-password?email=${email}`);
    },
    verifyForgotOtp: (email, otpCode) => {
        return AuthService.post(`auth/verify-forgot-otp?email=${email}&otpCode=${otpCode}`);
    },
    resetPassword: (data) => {
        return AuthService.post("auth/reset-password", data);
    },
    requestChangePassword: (data) => {
        return AuthService.post("auth/change-password/request", data);
    },
    confirmChangePassword: (data) => {
        return AuthService.post("auth/change-password/confirm", data);
    },
    uploadImage: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return AuthService.post("upload/image", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
    }
};

export default CustomerService;