import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

/** Every test tracks console errors + failed requests and asserts none. */
function trackErrors(page: Page) {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      // Filter noise that isn't actionable.
      const text = msg.text();
      if (
        text.includes("Failed to load resource") ||
        text.includes("favicon.ico") ||
        text.includes("_next/static") // hydration hash mismatches during deploy race
      ) {
        return;
      }
      consoleErrors.push(text);
    }
  });
  page.on("pageerror", (err) => {
    consoleErrors.push(`pageerror: ${err.message}`);
  });
  page.on("requestfailed", (req) => {
    const url = req.url();
    const err = req.failure()?.errorText ?? "";
    // Ignore known-benign noise:
    //  · favicon / static asset 404s
    //  · Next.js RSC prefetches cancelled when the test navigates faster
    //    than the sidebar hover-prefetch can complete
    if (url.includes("favicon") || url.includes("_next/static")) return;
    // ERR_ABORTED = browser cancelled a request because the user (or in this
    // case the test) navigated / clicked before it finished. Server didn't
    // reject anything; real HTTP errors surface as different errorText.
    if (err === "net::ERR_ABORTED") return;
    failedRequests.push(`${req.method()} ${url} — ${err}`);
  });

  return { consoleErrors, failedRequests };
}

test.describe("public surface", () => {
  test("root redirects to /login and login form renders", async ({ page }) => {
    const errs = trackErrors(page);

    const res = await page.goto("/");
    expect(res?.status(), "root should return 2xx after redirect").toBeLessThan(400);
    await expect(page).toHaveURL(/\/login/);

    // Xentrix mark should render, not a placeholder "X"
    const logo = page.getByLabel("Xentrix").first();
    await expect(logo).toBeVisible();

    // Sign-in form
    await expect(page.getByPlaceholder("you@xentrix.xyz").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();

    // Cream background token should be applied.
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    expect(bg).toMatch(/rgb\(245, 243, 238\)|#f5f3ee/i);

    expect(errs.consoleErrors, "no console errors on login").toEqual([]);
    expect(errs.failedRequests, "no failed requests on login").toEqual([]);
  });
});

test.describe("authenticated flow", () => {
  test.skip(!EMAIL || !PASSWORD, "TEST_EMAIL / TEST_PASSWORD env not set");

  test("sign in, browse core pages, open ⌘K, quick capture a task", async ({
    page,
  }) => {
    const errs = trackErrors(page);

    // ---------------- SIGN IN ----------------
    await page.goto("/login");
    await page.getByPlaceholder("you@xentrix.xyz").first().fill(EMAIL!);
    await page.locator('input[name="password"]').fill(PASSWORD!);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/login"), {
        timeout: 15_000,
      }),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    // Should land on /my (workers) or / (founders).
    const landing = new URL(page.url()).pathname;
    expect(["/my", "/"]).toContain(landing);

    // ---------------- MY WORK ----------------
    if (landing !== "/my") await page.goto("/my");
    await expect(page.getByRole("heading", { name: /^my work$/i })).toBeVisible();

    // ---------------- SIDEBAR + BRAND ----------------
    // Click the first Brand nav item under "Brands"
    const brandsLabel = page.getByText(/^brands$/i).first();
    await expect(brandsLabel).toBeVisible();
    const firstBrandLink = page.locator("aside a[href^='/b/']").first();
    await firstBrandLink.click();
    await page.waitForURL(/\/b\/[^/]+$/);

    // Brand landing shows stat tiles and activity feed
    await expect(page.getByText(/open tasks/i).first()).toBeVisible();

    // ---------------- COMMAND BAR (⌘K search) ----------------
    await page.keyboard.press("Meta+k");
    const search = page.getByPlaceholder(/search tasks, projects, brands/i);
    await expect(search).toBeVisible();
    await search.fill("a");
    // Give it a beat for the debounced query
    await page.waitForTimeout(400);
    await page.keyboard.press("Escape");
    await expect(search).toBeHidden();

    // ---------------- THEME TOGGLE ----------------
    const themeBtn = page.getByRole("button", { name: /switch to (dark|light) theme/i }).first();
    await themeBtn.click();
    await page.waitForTimeout(200);
    const themeAttr = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(themeAttr).toBe("dark");
    // Flip back so we leave the state clean
    await themeBtn.click();

    // ---------------- SETTINGS / ACCOUNT ----------------
    await page.goto("/settings/account");
    await expect(page.getByRole("heading", { name: /account/i })).toBeVisible();

    // ---------------- SIGN OUT ----------------
    await page.getByRole("button", { name: /sign out/i }).click();
    await page.waitForURL(/\/login/);

    // Final error assertion
    expect(errs.consoleErrors, "no console errors during flow").toEqual([]);
    expect(errs.failedRequests, "no failed requests during flow").toEqual([]);
  });
});
