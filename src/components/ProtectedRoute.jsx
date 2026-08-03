import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {
  const location = useLocation();
  const userStr = localStorage.getItem("USER_LOGIN");

  if (!userStr) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch (e) {
    localStorage.removeItem("USER_LOGIN");
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const userRole = user?.roleName || user?.role?.roleName || "";
  const normalizedUserRole = userRole.trim().toLowerCase();

  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some(
      (role) => role.trim().toLowerCase() === normalizedUserRole
    );

    if (!isAllowed) {
      if (normalizedUserRole === "systemadmin") {
        return <Navigate to="/system-admin/admins" replace />;
      }
      if (normalizedUserRole === "admin") {
        return <Navigate to="/admin/statistics" replace />;
      }
      if (normalizedUserRole === "employee") {
        return <Navigate to="/employee/statistics" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
