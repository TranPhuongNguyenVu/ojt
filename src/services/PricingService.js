import AuthService from "./AuthService";

const PricingService = {
  updateRoomFormatPrice: (versionId, basePrice, force = false) =>
    AuthService.patch(`admin/room-formats/${versionId}?force=${force}`, { basePrice }),
  updateSeatTypeExtraPrice: (versionId, seatType, extraPrice, force = false) =>
    AuthService.patch(`admin/room-formats/${versionId}/seat-types/${seatType}/extra-price?force=${force}`, { extraPrice }),
  getGoldenHours: () => AuthService.get("admin/golden-hours"),
  createGoldenHour: (data, force = false) =>
    AuthService.post(`admin/golden-hours?force=${force}`, data),
  updateGoldenHour: (id, data, force = false) =>
    AuthService.patch(`admin/golden-hours/${id}?force=${force}`, data),
  deleteGoldenHour: (id, force = false) =>
    AuthService.delete(`admin/golden-hours/${id}?force=${force}`),
};

export default PricingService;
