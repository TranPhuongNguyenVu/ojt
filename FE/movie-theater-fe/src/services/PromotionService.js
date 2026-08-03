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

  validateByCode: (code) =>
    AuthService.get("promotions/validate", {
      params: { code: code?.trim() },
    }),
};

export default PromotionService;
