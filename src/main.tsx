import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppRouter } from "./routes/AppRouter";
import { initDB } from "./lib/storage/db";

async function main() {
  try {
    await initDB();
    console.log("Database initialized successfully");

    // 개발용 테스트 데이터 추가
    // await seedTestData();
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <AppRouter />
    </StrictMode>
  );
}

main();
