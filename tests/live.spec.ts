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

  test("⌘⇧K quick capture creates a task, then task can be deleted", async ({
    page,
  }) => {
    const errs = trackErrors(page);
    const uniqueTitle = `Playwright smoke ${Date.now()}`;

    await page.goto("/login");
    await page.getByPlaceholder("you@xentrix.xyz").first().fill(EMAIL!);
    await page.locator('input[name="password"]').fill(PASSWORD!);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/login")),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    // Establish focus on the document before dispatching the keyboard
    // shortcut — Chromium headless can drop key events otherwise.
    await page.locator("body").click({ position: { x: 10, y: 10 } });
    await page.locator("body").press("Meta+k");
    await expect(
      page.getByPlaceholder(/search tasks, projects, brands/i)
    ).toBeVisible();
    // Flip to the Quick task tab
    await page.getByRole("button", { name: /^quick task$/i }).click();
    await expect(page.getByPlaceholder(/send follow-up/i)).toBeVisible();

    await page.getByPlaceholder(/send follow-up/i).fill(uniqueTitle);
    await Promise.all([
      page.waitForURL(/\/b\/[^/]+\/tasks$/),
      page.getByRole("button", { name: /add task/i }).click(),
    ]);

    // The just-created task title should be visible in the kanban
    await expect(page.getByText(uniqueTitle).first()).toBeVisible();

    // Click into it → task detail page
    await page.getByText(uniqueTitle).first().click();
    await page.waitForURL(/\/b\/[^/]+\/tasks\/[a-f0-9]{24}$/);

    // Delete it (server action redirects back to tasks list)
    page.once("dialog", (d) => d.accept());
    await Promise.all([
      page.waitForURL(/\/b\/[^/]+\/tasks$/),
      page.getByRole("button", { name: /delete task/i }).click(),
    ]);

    // Task title should not appear on the tasks board after delete
    await expect(page.getByText(uniqueTitle)).toHaveCount(0);

    expect(errs.consoleErrors, "no console errors during CRUD").toEqual([]);
    expect(errs.failedRequests, "no failed requests during CRUD").toEqual([]);
  });

  test("dark mode persists across a reload", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@xentrix.xyz").first().fill(EMAIL!);
    await page.locator('input[name="password"]').fill(PASSWORD!);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/login")),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    // Ensure we start in light mode
    let attr = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    if (attr === "dark") {
      await page
        .getByRole("button", { name: /switch to light theme/i })
        .first()
        .click();
    }

    // Flip to dark
    await page
      .getByRole("button", { name: /switch to dark theme/i })
      .first()
      .click();
    attr = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(attr).toBe("dark");

    // Reload — the inline theme-init script should apply data-theme=dark
    // synchronously before hydration so there's no light-mode flash
    await page.reload();
    attr = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme")
    );
    expect(attr, "dark theme should survive a page reload").toBe("dark");

    // Clean up: flip back to light so the next test starts fresh
    await page
      .getByRole("button", { name: /switch to light theme/i })
      .first()
      .click();
  });
});

test.describe("mobile viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.skip(!EMAIL || !PASSWORD, "TEST_EMAIL / TEST_PASSWORD env not set");

  test("hamburger opens the sidebar drawer, close button dismisses it", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByPlaceholder("you@xentrix.xyz").first().fill(EMAIL!);
    await page.locator('input[name="password"]').fill(PASSWORD!);
    await Promise.all([
      page.waitForURL((u) => !u.pathname.startsWith("/login")),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);

    // Sidebar exists in the DOM but hidden off-screen (translate-x-full)
    const myWorkLink = page.getByRole("link", { name: /my work/i });
    await expect(myWorkLink).not.toBeInViewport();

    // Tap the mobile hamburger
    await page.getByRole("button", { name: /open menu/i }).click();

    // Drawer slides in — My work link is now visible in the viewport
    await expect(myWorkLink).toBeInViewport();

    // Tap the close button
    await page.getByRole("button", { name: /close menu/i }).click();

    // Drawer slides out again
    await expect(myWorkLink).not.toBeInViewport();
  });
});
