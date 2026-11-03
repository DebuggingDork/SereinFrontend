import { expect, test } from "@playwright/test";
import { createReadyUser, watchErrors } from "./helpers";

const PHONE = { width: 390, height: 844 };

test("quick add: the plus opens the right form without leaving the page", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await page.setViewportSize(PHONE);
  await createReadyUser(page);

  // Nothing to add from Home, so no plus there.
  await page.goto("/home");
  await expect(page.getByLabel(/^New (transaction|task|meal|diary entry)/)).toHaveCount(0);

  await page.goto("/finance");
  await page.getByRole("button", { name: "New transaction" }).click();
  await expect(page.getByRole("dialog", { name: "New entry" })).toBeVisible();
  await expect(page).toHaveURL(/\/finance$/);

  await page.goto("/health/plan");
  await page.getByRole("button", { name: "New meal" }).click();
  await expect(page.getByRole("dialog", { name: "Log a meal" })).toBeVisible();
  await expect(page).toHaveURL(/\/health\/plan$/);

  // A saved task shows on the page underneath, with no reload.
  await page.goto("/planner");
  await page.getByRole("button", { name: "New task" }).click();
  const dialog = page.getByRole("dialog", { name: "New task" });
  await dialog.getByLabel("Title").fill("Pay the electrician");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/planner$/);
  await expect(page.getByText("Pay the electrician")).toBeVisible();

  // A diary entry needs the whole page.
  await page.goto("/diary/moods");
  await page.getByRole("link", { name: "New diary entry" }).click();
  await expect(page).toHaveURL(/\/diary\?new=1/);
  await expect(page.getByLabel("Entry", { exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test("quick add: back closes the form and it opens again", async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(PHONE);
  await createReadyUser(page);

  await page.goto("/planner/tasks");
  const plus = page.getByRole("button", { name: "New task" });
  const dialog = page.getByRole("dialog", { name: "New task" });
  await plus.click();
  await expect(dialog).toBeVisible();
  await page.goBack();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/planner\/tasks$/);

  await plus.click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/planner\/tasks$/);

  // The field being typed in keeps focus when the label settles behind the sheet.
  await page.goto("/planner/tasks");
  await plus.click();
  await dialog.getByLabel("Title").fill("Still typing");
  await page.getByRole("dialog").getByLabel("Priority").focus();
  await page.waitForTimeout(3000);
  await expect(dialog.getByLabel("Priority")).toBeFocused();

  // A second new diary entry replaces the finished one in the editor.
  await page.goto("/diary?new=1");
  const entry = page.getByLabel("Entry", { exact: true });
  await entry.fill("First thought");
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  await page.getByRole("link", { name: "New diary entry" }).click();
  await expect(page).toHaveURL(/\/diary\?new=2/);
  await expect(entry).toHaveValue("");
  expect(errors).toEqual([]);
});

test("quick add: phones and tablets only, where it replaces Log it now", async ({ page }) => {
  await page.setViewportSize(PHONE);
  await createReadyUser(page);

  await page.goto("/finance");
  const plus = page.getByRole("button", { name: "New transaction" });
  const logIt = page.getByRole("heading", { name: "Log it now" });
  await expect(plus).toContainText("Transaction");
  expect((await plus.boundingBox())!.width).toBeGreaterThan(80);
  await expect.poll(async () => (await plus.boundingBox())!.width, { timeout: 6000 }).toBeLessThan(60);
  await expect(logIt).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(plus).toBeHidden();
  await expect(logIt).toBeVisible();
});
