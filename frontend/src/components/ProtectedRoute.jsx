import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children, allowedRole, allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    return <Navigate to="/" />;
  }

  if (user.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "admin") {
      return <Navigate to="/staff/users" replace />;
    }
    return <Navigate to={user.role === "parent" ? "/parent/dashboard" : "/staff/dashboard"} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/staff/users" replace />;
    }
    return <Navigate to={user.role === "parent" ? "/parent/dashboard" : "/staff/dashboard"} replace />;
  }

  return children;
}

export default ProtectedRoute;
