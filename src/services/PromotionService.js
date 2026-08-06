import AuthService from "./AuthService";

const PromotionService = {
  getAll: (keyword) =>
    AuthService.get("promotions", {
      params: keyword?.trim() ? { keyword: keyword.trim() } : undefined,
    }),

  getActive: () => AuthService.get("promotions/active"),

  getById: (promotionId) => AuthService.get(`promotions/${promotionId}`),

  create: (data) => AuthService.post("promotions", data),

  update: (promotionId, data) =>
    AuthService.put(`promotions/${promotionId}`, data),

  delete: (promotionId) => AuthService.delete(`promotions/${promotionId}`),

  activate: (promotionId) => AuthService.patch(`promotions/${promotionId}/activate`),

  deactivate: (promotionId) => AuthService.patch(`promotions/${promotionId}/deactivate`),

  reactivate: (promotionId, status) =>
    AuthService.patch(`promotions/${promotionId}/reactivate`, status ? { status } : undefined),

  validateByCode: (code, scheduleId, memberId) =>
    AuthService.get("promotions/validate", {
      params: {
        code: code?.trim(),
        scheduleId,
        ...(memberId ? { memberId } : {}),
      },
    }),

  // --- API quản trị: trả toàn bộ khuyến mãi kể cả đã xóa mềm (Admin/SystemAdmin) ---
  getAllAdmin: (keyword) =>
    AuthService.get("admin/promotions", {
      params: keyword?.trim() ? { keyword: keyword.trim() } : undefined,
    }),

  getByIdAdmin: (promotionId) => AuthService.get(`admin/promotions/${promotionId}`),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return AuthService.post("upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default PromotionService;
