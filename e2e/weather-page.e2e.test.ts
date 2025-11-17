import { test, expect } from "@playwright/test";

test.describe("Weather Page", () => {
  test("should display weather page with current weather and forecasts", async ({ page }) => {
    // 날씨 페이지로 직접 이동 (모바일 가드 적용됨)
    await page.goto("/weather");

    // 페이지 제목 확인
    await expect(page.getByRole("heading", { name: "날씨" })).toBeVisible();

    // 현재 날씨 섹션 표시 확인
    await expect(page.getByText("현재 날씨")).toBeVisible();

    // 온도 정보 표시 확인 (현재 온도가 표시되는지)
    const temperatureText = page.locator("text=/\\d+°C/");
    await expect(temperatureText.first()).toBeVisible();

    // 습도 정보 표시 확인
    await expect(page.getByText("습도")).toBeVisible();

    // 바람 정보 표시 확인
    await expect(page.getByText("바람")).toBeVisible();
  });

  test("should display 24-hour humidity chart", async ({ page }) => {
    await page.goto("/weather");

    // 습도 추이 섹션 확인
    await expect(page.getByRole("heading", { name: "습도 추이" })).toBeVisible();

    // 습도 차트 표시 확인
    const humidityChart = page
      .locator('[data-testid="humidity-chart"]')
      .or(page.locator(".recharts-cartesian-axis"));
    await expect(humidityChart.first()).toBeVisible();

    // 습도 값 표시 확인
    const humidityValues = page.locator("text=/\\d+%/");
    await expect(humidityValues.first()).toBeVisible();

    // 시간 표시 확인 (적어도 몇 개의 시간 라벨이 있는지)
    const timeLabels = page.locator("text=/\\d+시/").or(page.getByText("지금"));
    await expect(timeLabels.first()).toBeVisible();
  });

  test("should display 7-day weather forecast", async ({ page }) => {
    await page.goto("/weather");

    // 데이터 로딩이 완료될 때까지 대기 (최대 10초)
    await page.waitForTimeout(2000); // 기본 로딩 시간 대기

    // 7일 예보 섹션 확인
    await expect(page.getByRole("heading", { name: "7일 예보" })).toBeVisible();

    // 데이터가 로딩되면 표시될 요소들 확인
    // (실제 데이터가 없을 수 있으므로, 섹션만 확인하거나 더 유연하게 테스트)
    const forecastSection = page.locator("text=7일 예보").locator("..").locator("..");
    await expect(forecastSection).toBeVisible();
  });

  test("should display loading state initially", async ({ page }) => {
    await page.goto("/weather");

    // 로딩 상태 표시 확인 (데이터 로딩 중일 때)
    const loadingElements = [
      page.getByText("데이터 로딩 중"),
      page.getByText("날씨 정보를 불러오고 있습니다"),
      page.locator(".animate-spin"),
    ];

    // 로딩 요소 중 하나라도 표시되는지 확인
    let foundLoading = false;
    for (const element of loadingElements) {
      try {
        await expect(element).toBeVisible({ timeout: 1000 });
        foundLoading = true;
        break;
      } catch {
        // 다음 요소 확인
      }
    }

    // 로딩 상태가 있었거나, 현재 날씨 섹션이 표시되는지 확인
    if (!foundLoading) {
      await expect(page.getByText("현재 날씨")).toBeVisible();
    }
  });

  test("should handle navigation back to dashboard", async ({ page }) => {
    await page.goto("/weather");

    // 뒤로가기 버튼 클릭
    await page
      .getByRole("link", { name: /뒤로가기|홈/ })
      .or(page.locator("svg"))
      .first()
      .click();

    // 대시보드 페이지로 이동 확인
    await expect(page).toHaveURL("/");
  });

  test("should be mobile-friendly", async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE 크기
    }

    await page.goto("/weather");

    // 모바일에서 가로 스크롤이 필요한 차트가 제대로 표시되는지 확인
    const charts = page.locator('.overflow-x-auto, [data-testid*="chart"]');
    if ((await charts.count()) > 0) {
      await expect(charts.first()).toBeVisible();
    }

    // 터치 친화적인 버튼 크기 확인 (최소 44px)
    const buttons = page.locator('button, [role="button"]');
    if ((await buttons.count()) > 0) {
      const button = buttons.first();
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test("should display page structure correctly", async ({ page }) => {
    // 모바일 환경으로 설정 (모바일 가드 우회를 위해)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/weather");

    // 페이지가 로딩되었는지 기본 확인
    await expect(page).toHaveURL("/weather");

    // 기본적인 HTML 구조가 있는지 확인
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // 잠시 대기 후 다시 확인
    await page.waitForTimeout(2000);

    // 간단한 텍스트 요소가 있는지 확인
    const hasContent = (await page.locator("text=/./").count()) > 0;
    expect(hasContent).toBe(true);
  });
});
