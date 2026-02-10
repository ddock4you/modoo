import Header from "./components/Header";
import { Outlet } from "react-router-dom";
import { MobileNavigation } from "./components/mobile-navigation";
import { MobileGuard } from "./routes/MobileGuard";
import { QueryProvider } from "./lib/query/QueryProvider";
import { StorageProvider } from "./lib/storage/StorageProvider";
import { MediaProvider } from "./lib/media/MediaProviders";
import { WeatherProvider } from "./lib/weather/WeatherProvider";
import { AddPlantWizardProvider } from "./lib/plants/AddPlantWizardProvider";
import { AddPlantWizard } from "@/features/add-plant-wizard/components/AddPlantWizard";
import "./App.css";
import Footer from "./components/Footer";

function App() {
  return (
    <QueryProvider>
      <StorageProvider>
        <MediaProvider>
          <WeatherProvider>
            <MobileGuard>
              <AddPlantWizardProvider>
                <div className="bg-gray-200">
                  <div className="min-h-screen mx-auto max-w-2xl relative bg-white">
                    <Header />
                    <Outlet />
                    <Footer />
                    <MobileNavigation />
                    <AddPlantWizard />
                  </div>
                </div>
              </AddPlantWizardProvider>
            </MobileGuard>
          </WeatherProvider>
        </MediaProvider>
      </StorageProvider>
    </QueryProvider>
  );
}

export default App;
