import AuthService from "./AuthService";

const EmployeeService = {
  getEmployees: (keyword) =>
    AuthService.get("employees", {
      params: keyword?.trim() ? { keyword: keyword.trim() } : undefined,
    }),

  getEmployeeById: (employeeId) => AuthService.get(`employees/${employeeId}`),

  createEmployee: (data) => AuthService.post("employees", data),

  updateEmployee: (employeeId, data) =>
    AuthService.put(`employees/${employeeId}`, data),

  deleteEmployee: (employeeId) => AuthService.delete(`employees/${employeeId}`),
};

export default EmployeeService;
