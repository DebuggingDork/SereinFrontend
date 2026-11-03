import { expect, test, type Page } from "@playwright/test";
import { createReadyUser, watchErrors } from "./helpers";

async function modal(page: Page, name: string | RegExp) {
  const dialog = page.getByRole("dialog", { name });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("old diet links land on the health pages", async ({ page }) => {
  await createReadyUser(page);
  await page.goto("/diet/weight");
  await expect(page).toHaveURL(/\/health\/weight/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Progress");
});

test("health: a new account builds a plan and logs a workout against it", async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await createReadyUser(page);

  // A new account starts with no plan and is offered one.
  await page.goto("/health/plan");
  await page.getByRole("button", { name: "Set up your plan" }).click();
  let dialog = await modal(page, "Set up your plan");
  await dialog.getByLabel("Name").fill("Summer cut");
  await dialog.getByLabel("Weight at the start (kg)").fill("80");
  await dialog.getByLabel("Target weight (kg)").fill("75");
  await dialog.getByLabel("Easy first weeks").fill("0");
  await dialog.getByRole("button", { name: "Create plan" }).click();
  await expect(page.getByText("Day 1 of 84 · Week 1")).toBeVisible();

  // Build today's session from nothing.
  await page.goto("/health/workouts");
  await page.getByRole("button", { name: /Edit week/ }).click();
  await page.getByRole("button", { name: /^Set up / }).click();
  dialog = await modal(page, /session/);
  await dialog.getByLabel("Name").fill("Push day");
  await dialog.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Add exercise" }).click();
  dialog = await modal(page, "New exercise");
  await dialog.getByLabel("Exercise").fill("Bench press");
  await dialog.getByLabel("Target").fill("2 × 8");
  await dialog.getByLabel("Sets to log").fill("2");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Bench press")).toBeVisible();
  await page.getByRole("button", { name: "Done editing" }).click();

  // Log a set, and see that it stays after a reload.
  await page.getByLabel("Bench press set 1 weight in kilograms").fill("40");
  await page.getByLabel("Bench press set 1 reps").fill("8");
  await page.getByRole("checkbox", { name: "Bench press set 1 done" }).click();
  await expect(page.getByRole("checkbox", { name: "Bench press set 1 done" })).toBeChecked();
  await expect(page.getByText("1 of 2 ticked")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Bench press set 1 weight in kilograms")).toHaveValue("40");

  await page.getByRole("button", { name: "Finish session" }).click();
  await expect(page.getByText("Done", { exact: true }).first()).toBeVisible();

  // The finished session ticks the checklist on its own, and a manual item can be ticked.
  await page.goto("/health");
  await expect(page.getByRole("heading", { name: "Push day" })).toBeVisible();
  const session = page.getByRole("checkbox", { name: /Did today's session/ });
  await expect(session).toBeChecked();
  const steps = page.getByRole("checkbox", { name: /8,000\+ steps/ });
  await steps.click();
  await expect(steps).toBeChecked();
  await page.reload();
  await expect(page.getByRole("checkbox", { name: /8,000\+ steps/ })).toBeChecked();

  // A weigh-in reaches the checklist and the plan.
  await page.getByLabel("Weight in kilograms").fill("79.5");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("checkbox", { name: /Weighed in this morning/ })).toBeChecked();
  await expect(page.getByText("-0.5 kg")).toBeVisible();

  await page.goto("/health/charts");
  await expect(page.getByRole("heading", { name: "Heaviest set by lift" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sessions per week" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("health: foods sort into pick lists and add to today in one tap", async ({ page }) => {
  const errors = watchErrors(page);
  await createReadyUser(page);

  await page.goto("/health/foods");
  await page.getByRole("button", { name: "New food" }).click();
  const dialog = await modal(page, "New food");
  await dialog.getByLabel("Name").fill("Paneer");
  await dialog.getByLabel("List").selectOption("protein");
  await dialog.getByLabel("Diet", { exact: true }).selectOption("veg");
  await dialog.getByLabel("Calories").fill("265");
  await dialog.getByLabel("Protein (g)").fill("18");
  await dialog.getByLabel("Carbs (g)").fill("3");
  await dialog.getByLabel("Fat (g)").fill("20");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Paneer")).toBeVisible();

  await page.getByRole("button", { name: "Non-veg" }).click();
  await expect(page.getByText("Paneer")).toHaveCount(0);
  await page.getByRole("button", { name: "Veg", exact: true }).click();
  await page.getByRole("button", { name: "Add Paneer to today" }).click();
  await expect(page.getByText("Added to today")).toBeVisible();

  await page.goto("/health");
  await expect(page.getByText("Paneer")).toBeVisible();
  await expect(page.getByText("265").first()).toBeVisible();
  expect(errors).toEqual([]);
});
