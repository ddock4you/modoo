import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MobileGuard } from "./MobileGuard";
import { Dashboard } from "./pages/Dashboard";
import { Plants } from "./pages/Plants";
import { PlantDetail } from "./pages/PlantDetail";
import { Settings } from "./pages/Settings";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <MobileGuard>
        <Dashboard />
      </MobileGuard>
    ),
  },
  {
    path: "/plants",
    element: (
      <MobileGuard>
        <Plants />
      </MobileGuard>
    ),
  },
  {
    path: "/plants/:id",
    element: (
      <MobileGuard>
        <PlantDetail />
      </MobileGuard>
    ),
  },
  {
    path: "/settings",
    element: (
      <MobileGuard>
        <Settings />
      </MobileGuard>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
