import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppRouter } from "./routes/AppRouter";

// import { initDB } from "./lib/storage/db";

// 개발 환경에서 수동 테스트 함수들을 전역으로 등록
if (import.meta.env.DEV) {
  import("./dev/weather/test-airkorea-manual.ts");
  import("./dev/weather/test-vworld-manual.ts");
  import("./dev/weather/test-cache-integration.ts");
}


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
    <AppRouter />
  </StrictMode>
);
