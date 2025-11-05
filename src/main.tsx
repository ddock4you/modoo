import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import "./index.css";
import { AppRouter } from "./routes/AppRouter";
import { StorageProvider } from "./lib/storage/StorageContext";
import { queryClient } from "./lib/queryClient";

// import { initDB } from "./lib/storage/db";

// async function main() {
//   try {
//     await initDB();
//     console.log("Database initialized successfully");

//     // 개발용 테스트 데이터 추가
//     // await seedTestData();
//   } catch (error) {
//     console.error("Failed to initialize database:", error);
//   }

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StorageProvider>
        {import.meta.env.DEV && <div>DEV</div>}
        <AppRouter />
        {import.meta.env.DEV && <ReactQueryDevtools />}
      </StorageProvider>
    </QueryClientProvider>
  </StrictMode>
);
