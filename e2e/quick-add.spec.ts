import { expect, test } from "@playwright/test";
import { createReadyUser, watchErrors } from "./helpers";

const PHONE = { width: 390, height: 844 };

test("quick add: the plus adds the right thing in each module", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await page.setViewportSize(PHONE);
  await createReadyUser(page);

  // Nothing to add from Home, so no plus there.
  await page.goto("/home");
  await expect(page.getByRole("link", { name: /^(Add a|Log a|Write a)/ })).toHaveCount(0);

  await page.goto("/finance");
  await page.getByRole("link", { name: "Add a transaction" }).click();
  await expect(page).toHaveURL(/\/finance\/transactions\?new=1/);
  await expect(page.getByRole("dialog", { name: "New entry" })).toBeVisible();

  await page.goto("/planner");
  await page.getByRole("link", { name: "Add a task" }).click();
  await expect(page).toHaveURL(/\/planner\/tasks\?new=1/);
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.goto("/health/plan");
  await page.getByRole("link", { name: "Log a meal" }).click();
  await expect(page).toHaveURL(/\/health\/log\?new=1/);
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.goto("/diary/moods");
  await page.getByRole("link", { name: "Write a new diary entry" }).click();
  await expect(page).toHaveURL(/\/diary\?new=1/);
  await expect(page.getByLabel("Entry", { exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test("quick add: it works again and again from the page it opens", async ({ page }) => {
  const errors = watchErrors(page);
  await page.setViewportSize(PHONE);
  await createReadyUser(page);

  await page.goto("/planner/tasks");
  const plus = page.getByRole("link", { name: "Add a task" });
  for (let round = 0; round < 2; round++) {
    await plus.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/planner\/tasks$/);
  }

  // A second new diary entry replaces the finished one in the editor.
  await page.goto("/diary?new=1");
  const entry = page.getByLabel("Entry", { exact: true });
  await entry.fill("First thought");
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  await page.getByRole("link", { name: "Write a new diary entry" }).click();
  await expect(page).toHaveURL(/\/diary\?new=2/);
  await expect(entry).toHaveValue("");
  expect(errors).toEqual([]);
});

test("quick add: phones and tablets only, and it names itself then settles", async ({ page }) => {
  await page.setViewportSize(PHONE);
  await createReadyUser(page);

  await page.goto("/finance");
  const plus = page.getByRole("link", { name: "Add a transaction" });
  await expect(plus).toContainText("Transaction");
  const wide = (await plus.boundingBox())!.width;
  expect(wide).toBeGreaterThan(80);
  await expect.poll(async () => (await plus.boundingBox())!.width, { timeout: 6000 }).toBeLessThan(60);

  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(plus).toBeHidden();
});
