import AuthService from "./AuthService";

const BookingService = {
  // Lấy sơ đồ ghế của 1 suất chiếu
  getSeatsByScheduleId: (scheduleId) => {
    return AuthService.get(`booking/showtime/${scheduleId}/seats`);
  },
  // Lấy danh sách ghế và giữ ghế (DRAFT) trước khi thanh toán
  confirmBooking: (scheduleId, seatIds) => {
    return AuthService.post(`booking/showtime/${scheduleId}/confirm`, seatIds);
  },
  // Hủy giữ ghế DRAFT
  releaseSeats: (scheduleId, seatIds) => {
    return AuthService.post(`booking/showtime/${scheduleId}/release`, seatIds);
  },
  // Lấy điểm thành viên hiện có
  getMemberScore: () => {
    return AuthService.get("booking/member-score");
  },
  // Xác nhận thanh toán hóa đơn
  confirmPayment: (scheduleId, paymentData) => {
    return AuthService.post(`booking/showtime/${scheduleId}/payment`, paymentData);
  },
  // Lấy lịch sử đặt vé của user
  getBookingHistory: () => {
    return AuthService.get("booking/history");
  },
  // Lấy lịch sử tích/dùng điểm của user
  getPointsHistory: () => {
    return AuthService.get("booking/points-history");
  },
  // Hủy vé đặt
  cancelTicket: (invoiceId) => {
    return AuthService.post(`booking/invoice/${invoiceId}/cancel`);
  },
  // Tạo link thanh toán qua MoMo
  createMomoPayment: (paymentData) => {
    return AuthService.post("payment/momo/create", paymentData);
  },
  employeeConfirmBooking: (scheduleId, bookingData) => {
    return AuthService.post(`employee/booking/showtime/${scheduleId}/confirm`, bookingData);
  },
  getEmployeeBookingDetail: (invoiceId) => {
    return AuthService.get(`employee/booking/invoice/${invoiceId}`);
  },
  getEmployeeSalesHistory: () => {
    return AuthService.get("employee/booking/sales-history");
  },
  // Xác minh giao dịch sau khi redirect từ MoMo
  verifyMomoRedirect: (params) => {
    return AuthService.get("payment/momo/verify-redirect", { params });
  },
  // Tạo lại link thanh toán MoMo cho hóa đơn chờ thanh toán
  recreateMomoPayment: (invoiceId) => {
    return AuthService.post(`payment/momo/recreate?invoiceId=${invoiceId}`);
  }
};

export default BookingService;
