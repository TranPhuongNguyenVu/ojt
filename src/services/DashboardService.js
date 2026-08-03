import AuthService from "./AuthService";

const dashboardBase = "admin/dashboard";

const DashboardService = {
  getOverview: (params) => AuthService.get(`${dashboardBase}/overview`, { params }),

  getOperational: () => AuthService.get(`${dashboardBase}/operational`),

  getMovies: () => AuthService.get(`${dashboardBase}/movies`),
};

export default DashboardService;
