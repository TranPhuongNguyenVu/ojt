import AuthService from "./AuthService";

const employeeDashboardBase = "employee/dashboard";

const EmployeeDashboardService = {
  getOverview: () => AuthService.get(`${employeeDashboardBase}/overview`),

  getOperational: () => AuthService.get(`${employeeDashboardBase}/operational`),

  getUpcomingShowtimes: () => AuthService.get(`${employeeDashboardBase}/upcoming-showtimes`),
};

export default EmployeeDashboardService;
