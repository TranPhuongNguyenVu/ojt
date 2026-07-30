import AuthService from "./AuthService";

const SystemAdminService = {
  // ── Admin Management ───────────────────────────────────────────────────────
  getAdmins: () =>
    AuthService.get("system-admin/admins"),

  getAdmin: (accountId) =>
    AuthService.get(`system-admin/admins/${accountId}`),

  createAdmin: (data) =>
    AuthService.post("system-admin/admins", data),

  updateAdmin: (accountId, data) =>
    AuthService.put(`system-admin/admins/${accountId}`, data),

  deactivateAdmin: (accountId) =>
    AuthService.patch(`system-admin/admins/${accountId}/deactivate`),

  restoreAdmin: (accountId) =>
    AuthService.patch(`system-admin/admins/${accountId}/restore`),

  resetAdminPassword: (accountId) =>
    AuthService.post(`system-admin/admins/${accountId}/reset-password`),

  deleteAdmin: (accountId) =>
    AuthService.delete(`system-admin/admins/${accountId}`),

  // ── Profile (shared for all roles) ────────────────────────────────────────
  getMyProfile: () =>
    AuthService.get("profile"),

  updateMyProfile: (data) =>
    AuthService.put("profile", data),

  changeMyPassword: (currentPassword, newPassword) =>
    AuthService.post("profile/change-password", { currentPassword, newPassword }),
};

export default SystemAdminService;
