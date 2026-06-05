import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { RegistrosListPage } from "@/features/registros/RegistrosListPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <RegistrosListPage /> },
      { path: "/registros", element: <Navigate to="/" replace /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
