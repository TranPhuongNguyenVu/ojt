import { Routes, Route, Navigate } from "react-router-dom";
import MainDashboard from "./pages/AdminDashboard/MainDashboard.jsx";
import EmployeeDashboard from "./pages/EmployeeDashboard/EmployeeDashboard.jsx";
import AdminTemplate from "./templates/AdminTemplate.jsx";
import SystemAdminTemplate from "./templates/SystemAdminTemplate.jsx";
import HomePage from "./pages/CustomerPage/HomePage.jsx";
import CustomerTemplate from "./templates/CustomerTemplate.jsx";
import LoginPage from "./pages/CustomerPage/LoginPage.jsx";
import RegisterPage from "./pages/CustomerPage/RegisterPage.jsx";
import CustomerManagement from "./pages/AdminDashboard/CustomerManagement/CustomerManagement.jsx";
import EmployeeManagement from "./pages/AdminDashboard/EmployeeManagement/EmployeeManagement.jsx";
import EmployeeForm from "./pages/AdminDashboard/EmployeeManagement/EmployeeForm.jsx";
import CinemaRoomManagement from "./pages/AdminDashboard/CinemaRoomManagement/CinemaRoomManagement.jsx";
import CinemaRoomDetail from "./pages/AdminDashboard/CinemaRoomManagement/CinemaRoomDetail.jsx";
import PromotionManagement from "./pages/AdminDashboard/PromotionManagement/PromotionManagement.jsx";
import PromotionForm from "./pages/AdminDashboard/PromotionManagement/PromotionForm.jsx";
import MovieManagement from "./pages/AdminDashboard/MovieManagement/MovieManagement.jsx";
import ScheduleManagement from "./pages/AdminDashboard/ScheduleManagement/ScheduleManagement.jsx";
import AutoGenerateSchedulePage from "./pages/AdminDashboard/ScheduleManagement/AutoGenerateSchedulePage.jsx";
import PricingConfigPage from "./pages/AdminDashboard/PricingConfig/PricingConfigPage.jsx";
import ConcessionManagement from "./pages/AdminDashboard/ConcessionManagement/ConcessionManagement.jsx";
import EmployeeTemplate from "./templates/EmployeeTemplate.jsx";
import DetailPage from "./pages/CustomerPage/DetailPage.jsx";
import AdminManagement from "./pages/SystemAdminDashboard/AdminManagement.jsx";
import AdminProfile from "./pages/AdminDashboard/Profile/AdminProfile.jsx";

import VerifyOtpPage from "./pages/CustomerPage/OtpVerificationPage.jsx";
import ConfirmEmailPage from "./pages/CustomerPage/ConfirmEmailPage.jsx";
import ForgotPasswordPage from "./pages/CustomerPage/ForgotPasswordPage.jsx";
import ProfilePage from "./pages/CustomerPage/ProfilePage.jsx";
import SelectShowtimePage from "./pages/CustomerPage/SelectShowtimePage.jsx";
import EmployeeSelectShowtimePage from "./pages/EmployeeDashboard/EmployeeSelectShowtimePage.jsx";
import EmployeeBookingSeatPage from "./pages/EmployeeDashboard/EmployeeBookingSeatPage.jsx";
import EmployeeTicketInformationPage from "./pages/EmployeeDashboard/EmployeeTicketInformationPage.jsx";
import EmployeeBookingSuccessPage from "./pages/EmployeeDashboard/EmployeeBookingSuccessPage.jsx";
import EmployeeSearchBookingPage from "./pages/EmployeeDashboard/EmployeeSearchBookingPage.jsx";
import EmployeeSalesHistoryPage from "./pages/EmployeeDashboard/EmployeeSalesHistoryPage.jsx";
import EmployeeMovieListPage from "./pages/EmployeeDashboard/EmployeeMovieListPage.jsx";
import EmployeePromotionsPage from "./pages/EmployeeDashboard/EmployeePromotionsPage.jsx";
import BookingSeatPage from "./pages/CustomerPage/BookingSeatPage.jsx";
import BookingPaymentPage from "./pages/CustomerPage/BookingPaymentPage.jsx";
import BookingSuccessPage from "./pages/CustomerPage/BookingSuccessPage.jsx";
import MomoCallbackPage from "./pages/CustomerPage/MomoCallbackPage.jsx";
import MoviesPage from "./pages/CustomerPage/MoviesPage.jsx";
import ContactPage from "./pages/CustomerPage/ContactPage.jsx";

function App() {
  return (
    <Routes>
      <Route path="/admin" element={<AdminTemplate />}>
        <Route index element={<Navigate to="statistics" replace />} />
        <Route path="statistics" element={<MainDashboard />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="employees" element={<EmployeeManagement />} />
        <Route path="employees/add" element={<EmployeeForm />} />
        <Route path="employees/edit/:id" element={<EmployeeForm />} />
        <Route path="cinema-rooms" element={<CinemaRoomManagement />} />
        <Route path="cinema-rooms/:id" element={<CinemaRoomDetail />} />
        <Route path="promotions" element={<PromotionManagement />} />
        <Route path="promotions/add" element={<PromotionForm />} />
        <Route path="promotions/edit/:id" element={<PromotionForm />} />
        <Route path="movies" element={<MovieManagement />} />
        <Route path="schedules" element={<ScheduleManagement />} />
        <Route path="schedules/auto-generate" element={<AutoGenerateSchedulePage />} />
        <Route path="pricing" element={<PricingConfigPage />} />
        <Route path="concessions" element={<ConcessionManagement />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      {/* ─── System Admin routes ─────────────────────────────────────────── */}
      <Route path="/system-admin" element={<SystemAdminTemplate />}>
        <Route index element={<Navigate to="admins" replace />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      <Route path="/employee" element={<EmployeeTemplate />}>
  <Route index element={<Navigate to="statistics" replace />} />

  <Route path="statistics" element={<EmployeeDashboard />} />

  <Route path="showtime" element={<EmployeeSelectShowtimePage />} />
  <Route path="tickets/sell" element={<EmployeeSelectShowtimePage />} />
  <Route path="showtimes" element={<EmployeeSelectShowtimePage />} />

  <Route
    path="booking/seat/:scheduleId"
    element={<EmployeeBookingSeatPage />}
  />

  <Route
    path="booking/ticket/:scheduleId"
    element={<EmployeeTicketInformationPage />}
  />

  <Route
    path="booking/success/:invoiceId"
    element={<EmployeeBookingSuccessPage />}
  />

  <Route path="bookings/search" element={<EmployeeSearchBookingPage />} />
  <Route path="tickets/history" element={<EmployeeSalesHistoryPage />} />
  <Route path="movies" element={<EmployeeMovieListPage />} />
  <Route path="promotions" element={<EmployeePromotionsPage />} />

  <Route path="customers" element={<CustomerManagement />} />
  <Route path="employees" element={<EmployeeManagement />} />
  <Route path="profile" element={<AdminProfile />} />
</Route>

      <Route path="/" element={<CustomerTemplate />}>
        <Route index element={<HomePage />} />
        <Route path="movies" element={<MoviesPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="confirm-email" element={<ConfirmEmailPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="verify-otp" element={<VerifyOtpPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="detail/:id" element={<DetailPage />} />
        <Route
          path="select-showtime/:movieId"
          element={<SelectShowtimePage />}
        />
        <Route
          path="booking/seat/:scheduleId"
          element={<BookingSeatPage />}
        />
        <Route
          path="booking/payment/:scheduleId"
          element={<BookingPaymentPage />}
        />
        <Route
          path="booking/success/:invoiceId"
          element={<BookingSuccessPage />}
        />
        <Route
          path="payment/momo-callback"
          element={<MomoCallbackPage />}
        />
      </Route>
    </Routes>
  );
}

export default App;