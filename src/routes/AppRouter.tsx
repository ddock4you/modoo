import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";
import { Plants } from "./pages/Plants";
import { PlantDetail } from "./pages/PlantDetail";
import { Settings } from "./pages/Settings";
import { Weather } from "./pages/Weather";
import { DebugDb } from "./pages/DebugDb";
import { IconGallery } from "./pages/IconGallery";
import App from "../App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "plants",
        element: <Plants />,
      },
      {
        path: "plants/:id",
        element: <PlantDetail />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "weather",
        element: <Weather />,
      },
      {
        path: "_debug/db",
        element: <DebugDb />,
      },
      {
        path: "_debug/icons",
        element: <IconGallery />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
