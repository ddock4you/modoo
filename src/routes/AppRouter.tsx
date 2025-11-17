import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { MobileGuard } from "./MobileGuard";
import { Dashboard } from "./pages/Dashboard";
import { Plants } from "./pages/Plants";
import { PlantDetail } from "./pages/PlantDetail";
import { Settings } from "./pages/Settings";
import { Weather } from "./pages/Weather";
import { DebugDb } from "./pages/DebugDb";
import { WeatherProvider } from "../lib/weather/WeatherProvider";

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
  {
    path: "/weather",
    element: (
      <MobileGuard>
        <Weather />
      </MobileGuard>
    ),
  },
  {
    path: "/_debug/db",
    element: <DebugDb />,
  },
]);

export function AppRouter() {
  return (
    <WeatherProvider>
      <RouterProvider router={router} />
    </WeatherProvider>
  );
}
