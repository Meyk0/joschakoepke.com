import { expect, test } from "@playwright/test";

test.describe("desktop foundation", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("supports keyboard navigation through Spotlight", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Meta+k");

    const search = page.getByRole("textbox", { name: "Spotlight search" });
    await expect(search).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(page.getByRole("button", { name: "Close Agent.app" })).toBeVisible();
  });

  test("opens the resume and exposes a real PDF download", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open Resume.pdf" }).click();

    const download = page.getByRole("link", { name: "Download PDF" });
    await expect(download).toBeVisible();
    await expect(download).toHaveAttribute("href", "/Joscha-Koepke-Resume.pdf");
  });

  test("honors reduced-motion preferences", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const transitionDuration = await page
      .getByRole("button", { name: "Open Terminal" })
      .evaluate((element) => getComputedStyle(element).transitionDuration);
    expect(Number.parseFloat(transitionDuration)).toBeLessThanOrEqual(0.001);
  });

  test("prompts for a name after a Surf.app wipeout", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Open Surf.app" }).click();
    await page.getByRole("button", { name: "Start run" }).click();

    const nameInput = page.getByRole("textbox", { name: "Save your" });
    await expect(nameInput).toBeVisible({ timeout: 12_000 });
    await nameInput.fill("Test Surfer");
    await page.getByRole("button", { name: "Add score" }).click();

    await expect(page.getByText("Test Surfer", { exact: true })).toBeVisible();
  });
});

test.describe("mobile foundation", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("keeps core apps keyboard and screen-reader addressable", async ({ page }) => {
    await page.goto("/");

    const agent = page.getByRole("button", { name: "Open Agent.app" });
    await expect(agent).toBeVisible();
    await agent.click();
    await expect(page.getByRole("heading", { name: "Ask Joscha" })).toBeVisible();
  });
});
