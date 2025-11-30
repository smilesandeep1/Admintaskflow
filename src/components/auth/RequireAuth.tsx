import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import type { ReactNode } from "react";

interface RequireAuthProps {
  children: ReactNode;
  whiteList?: string[];
}

export function RequireAuth({ children, whiteList = [] }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isWhitelisted = whiteList.some((path) => {
    if (path.endsWith("/*")) {
      const basePath = path.slice(0, -2);
      return location.pathname.startsWith(basePath);
    }
    return location.pathname === path;
  });

  if (!user && !isWhitelisted) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
