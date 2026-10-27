import { expect, test, type Page } from "@playwright/test";
import { createReadyUser, watchErrors } from "./helpers";

const ALL_PAGES = [
  "/home", "/profile",
  "/finance", "/finance/transactions", "/finance/accounts", "/finance/budgets", "/finance/scheduled",
  "/finance/debts", "/finance/goals", "/finance/net-worth", "/finance/calendar", "/finance/charts", "/finance/settings",
  "/planner", "/planner/tasks", "/planner/deadlines", "/planner/calendar", "/planner/completed", "/planner/charts", "/planner/settings",
  "/diet", "/diet/log", "/diet/plans", "/diet/targets", "/diet/water", "/diet/weight", "/diet/foods", "/diet/charts", "/diet/settings",
  "/diary", "/diary/entries", "/diary/calendar", "/diary/moods", "/diary/search", "/diary/settings",
];

async function modal(page: Page, name: string | RegExp) {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("every page opens on an empty account without errors", async ({ page }) => {
  test.setTimeout(240_000);
  const errors = watchErrors(page);
  await createReadyUser(page);
  for (const path of ALL_PAGES) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).first(), path).toBeVisible();
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("This chart could not load"), path).toHaveCount(0);
    await expect(page.getByText("Something slipped"), path).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test("finance: an expense moves the balance and reaches the chart", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await createReadyUser(page);

  await page.goto("/finance/accounts");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  let dialog = await modal(page, "New account");
  await dialog.getByLabel("Nickname").fill("HDFC Salary");
  await dialog.getByLabel("Bank or provider").fill("HDFC");
  await dialog.getByLabel("Last four digits").fill("12");
  await dialog.getByLabel("Balance today").fill("10000");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByText("Exactly four digits")).toBeVisible();
  await dialog.getByLabel("Last four digits").fill("1234");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("HDFC Salary")).toBeVisible();
  await expect(page.getByText("₹10,000").first()).toBeVisible();

  await page.goto("/finance/transactions");
  const quick = page.getByLabel("Quick add an expense");
  await quick.fill("4111 1111 1111 4829 rent");
  await expect(page.getByRole("alert").filter({ hasText: "card or account number" })).toBeVisible();
  await quick.fill("200 rapido from HDFC via GPay");
  await expect(page.getByText("Rapido", { exact: true })).toBeVisible();
  await quick.press("Enter");
  await expect(page.getByRole("listitem").filter({ hasText: "rapido" })).toBeVisible();

  await page.goto("/finance/accounts");
  await expect(page.getByText("₹9,800").first()).toBeVisible();

  await page.goto("/finance/charts");
  await expect(page.getByRole("heading", { name: "Spending by category" })).toBeVisible();
  await expect(page.getByText("₹200").first()).toBeVisible();

  await page.goto("/finance/budgets");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  dialog = await modal(page, "New budget");
  await dialog.getByLabel("Category").selectOption({ label: "Transport" });
  await dialog.getByLabel("Limit").fill("1000");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("₹800").first()).toBeVisible();

  await page.goto("/finance/debts");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  dialog = await modal(page, "New debt");
  await dialog.getByLabel("Person").fill("Ravi");
  await dialog.getByLabel("Amount").fill("5000");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Ravi owes you")).toBeVisible();
  await page.getByRole("button", { name: "Record repayment" }).click();
  dialog = await modal(page, "Record repayment");
  await dialog.getByLabel("Amount").fill("3000");
  await dialog.getByLabel("Also record in account").selectOption({ index: 1 });
  await dialog.getByRole("button", { name: "Record" }).click();
  await expect(page.getByText("₹3,000 / ₹5,000")).toBeVisible();

  await page.goto("/finance/accounts");
  await expect(page.getByText("₹12,800").first()).toBeVisible();

  await page.goto("/finance/goals");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  dialog = await modal(page, "New goal");
  await dialog.getByLabel("Name").fill("Laptop");
  await dialog.getByLabel("Target").fill("80000");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Laptop")).toBeVisible();

  await page.goto("/finance/scheduled");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  dialog = await modal(page, "New scheduled item");
  await dialog.getByLabel("Name").fill("Netflix");
  await dialog.getByLabel("Amount").fill("649");
  await dialog.getByLabel("Account").selectOption({ index: 1 });
  await dialog.getByLabel("This is a subscription").check();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Netflix")).toBeVisible();
  await expect(page.getByText("₹649").first()).toBeVisible();

  await page.goto("/finance/net-worth");
  const real = page.getByLabel("Real balance of HDFC Salary");
  await real.fill("12500");
  await page.getByRole("button", { name: "Add adjustment" }).click();
  await expect(page.getByText("Adjustment added")).toBeVisible();

  await page.goto("/finance");
  await expect(page.getByText("You can spend about")).toBeVisible();
  expect(errors).toEqual([]);
});

test("planner: a task can be added, finished and reviewed; recurring tasks roll forward", async ({ page }) => {
  const errors = watchErrors(page);
  await createReadyUser(page);

  await page.goto("/planner");
  await page.getByLabel("Add a task").fill("Ship gate screen");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Ship gate screen")).toBeVisible();

  await page.getByRole("button", { name: "More options" }).click();
  const dialog = await modal(page, "New task");
  await dialog.getByLabel("Title").fill("Morning walk");
  await dialog.getByLabel("Repeats").selectOption("daily");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Morning walk")).toBeVisible();

  await page.getByRole("checkbox", { name: "Mark Ship gate screen done" }).click();
  await expect(page.getByText(/1 of 2 done/)).toBeVisible();

  await page.getByRole("checkbox", { name: "Mark Morning walk done" }).click();
  await expect(page.getByText(/2 of 2 done/)).toBeVisible();

  await page.goto("/planner/completed");
  await expect(page.getByText("Ship gate screen")).toBeVisible();

  await page.goto("/planner/tasks");
  await expect(page.getByText("Morning walk")).toBeVisible();
  await expect(page.getByText("Tomorrow")).toBeVisible();

  await page.goto("/planner/charts");
  await expect(page.getByText("1 days").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("diet: a meal counts against the target, water and weight log", async ({ page }) => {
  const errors = watchErrors(page);
  await createReadyUser(page);

  await page.goto("/diet/foods");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  let dialog = await modal(page, "New food");
  await dialog.getByLabel("Name").fill("Poha");
  await dialog.getByLabel("Calories").fill("320");
  await dialog.getByLabel("Protein (g)").fill("8");
  await dialog.getByLabel("Carbs (g)").fill("55");
  await dialog.getByLabel("Fat (g)").fill("7");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("320 kcal")).toBeVisible();

  await page.goto("/diet");
  await page.getByRole("button", { name: "Log a meal" }).click();
  dialog = await modal(page, "Log a meal");
  await dialog.getByLabel("From my foods").selectOption({ index: 1 });
  await dialog.getByLabel("Servings").fill("2");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("640").first()).toBeVisible();

  await page.getByRole("button", { name: "+500 ml" }).click();
  await expect(page.getByText("500").first()).toBeVisible();

  await page.goto("/diet/weight");
  await page.getByLabel("Weight in kilograms").fill("72.5");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Latest 72.5 kg")).toBeVisible();

  await page.goto("/diet/charts");
  await expect(page.getByRole("heading", { name: "Calories versus target" })).toBeVisible();
  await expect(page.getByText(/Protein \d+%/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("diary: autosave keeps one entry, search finds it, mood charts it", async ({ page }) => {
  const errors = watchErrors(page);
  await createReadyUser(page);

  await page.goto("/diary");
  await expect(page.getByText("Prompt of the day")).toBeVisible();
  await page.getByRole("radio", { name: "Settled" }).click();
  await page.getByLabel("Title").fill("Rain");
  await page.getByLabel("Entry", { exact: true }).fill("Walked home slowly. The rain made the street quiet.");
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
  await page.getByLabel("Entry", { exact: true }).pressSequentially(" Stayed out longer.");
  await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Entry", { exact: true })).toHaveValue(/Stayed out longer/);

  await page.goto("/diary/entries");
  await expect(page.getByRole("listitem")).toHaveCount(1);

  await page.goto("/diary/search");
  await page.getByLabel("Search your diary").fill("quiet street");
  await expect(page.locator("mark").first()).toBeVisible();

  await page.goto("/diary/moods");
  await expect(page.getByText("1 days").first()).toBeVisible();

  await page.goto("/home");
  await expect(page.getByText(/Walked home slowly/)).toBeVisible();
  expect(errors).toEqual([]);
});

test("home: widgets can be removed and the layout persists", async ({ page }) => {
  await createReadyUser(page);
  await expect(page.getByText("Calories today")).toBeVisible();
  await page.getByRole("button", { name: "Customize" }).click();
  await page.getByRole("button", { name: "Remove Calories today" }).click();
  await expect(page.getByText("Calories today")).toHaveCount(0);
  await page.getByRole("button", { name: "Add or remove" }).click();
  await page.getByRole("button", { name: /Safe to spend/ }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Done" }).click();
  await page.waitForTimeout(500);

  await page.reload();
  await expect(page.getByText("Safe to spend today")).toBeVisible();
  await expect(page.getByText("Calories today")).toHaveCount(0);
});
