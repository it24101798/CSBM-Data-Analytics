import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRole }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  let user = null;
  try {
    user = JSON.parse(userRaw);
  } catch (error) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "admin") {
      return <Navigate to="/admin-dashboard" replace />;
    }
    return <Navigate to="/user-dashboard" replace />;
  }

  return children;
}