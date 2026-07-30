import AuthService from "./AuthService";

const PromotionService = {
  getAll: (keyword) =>
    AuthService.get("promotions", {
      params: keyword?.trim() ? { keyword: keyword.trim() } : undefined,
    }),

  getById: (promotionId) => AuthService.get(`promotions/${promotionId}`),

  create: (data) => AuthService.post("promotions", data),

  update: (promotionId, data) =>
    AuthService.put(`promotions/${promotionId}`, data),

  delete: (promotionId) => AuthService.delete(`promotions/${promotionId}`),

  validateByCode: (code) =>
    AuthService.get("promotions/validate", {
      params: { code: code?.trim() },
    }),
};

export default PromotionService;
