import AuthService from "./AuthService";

const ConcessionService = {
  getAllFoods: () => AuthService.get("foods"),
  searchFoods: (keyword) => AuthService.get("foods/search", { params: { keyword } }),
  getFoodById: (id) => AuthService.get(`foods/${id}`),
  createFood: (data) => AuthService.post("foods", data),
  updateFood: (id, data) => AuthService.put(`foods/${id}`, data),
  restoreFood: (id) => AuthService.patch(`foods/${id}/activate`),
  deleteFood: (id) => AuthService.delete(`foods/${id}`),

  getAllDrinks: () => AuthService.get("drinks"),
  searchDrinks: (keyword) => AuthService.get("drinks/search", { params: { keyword } }),
  getDrinkById: (id) => AuthService.get(`drinks/${id}`),
  createDrink: (data) => AuthService.post("drinks", data),
  updateDrink: (id, data) => AuthService.put(`drinks/${id}`, data),
  restoreDrink: (id) => AuthService.patch(`drinks/${id}/activate`),
  deleteDrink: (id) => AuthService.delete(`drinks/${id}`),

  getAllCombos: () => AuthService.get("combos"),
  searchCombos: (keyword) => AuthService.get("combos/search", { params: { keyword } }),
  getComboById: (id) => AuthService.get(`combos/${id}`),
  createCombo: (data) => AuthService.post("combos", data),
  updateCombo: (id, data) => AuthService.put(`combos/${id}`, data),
  restoreCombo: (id) => AuthService.patch(`combos/${id}/activate`),
  deleteCombo: (id) => AuthService.delete(`combos/${id}`),

  uploadImage: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return AuthService.post("upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export default ConcessionService;
