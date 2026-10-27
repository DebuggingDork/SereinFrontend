import { expect, test } from "@playwright/test";
import { answerGate, createReadyUser, emailLink, fillQuestions, logIn, newEmail, signUp, watchErrors } from "./helpers";

test("landing page plays the freeze and gate demos", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("behind frosted glass");

  await page.getByRole("button", { name: /Trigger Freeze Demo/ }).click();
  await expect(page.getByRole("button", { name: "Close the glass" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Close the glass" })).toBeHidden();

  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: "Try a wrong answer" }).click();
  await expect(page.getByText("Nope. Nice try, detective.")).toBeVisible();
  await page.getByLabel("Your answer").fill("  SEREIN ");
  await page.getByRole("button", { name: /Open the door/ }).click();
  await expect(page.getByText("The door opens")).toBeVisible();

  await page.getByLabel("Try pasting a card number").fill("4111 1111 1111 4829");
  await expect(page.getByRole("alert").filter({ hasText: "card or account number" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("protected pages send visitors to login", async ({ page }) => {
  for (const path of ["/home", "/finance", "/planner", "/diet", "/diary", "/admin", "/onboarding", "/profile"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("signup needs a confirmed email, then forces setup, then opens on the right answer", async ({ page, context }) => {
  const errors = watchErrors(page);
  const email = newEmail();
  await signUp(page, email);

  await logIn(page, email);
  await expect(page.getByRole("alert").filter({ hasText: "not confirmed" })).toBeVisible();

  await page.goto(await emailLink(email, /confirm/i));
  await page.waitForURL(/\/gate\/setup/);

  // The dashboard stays locked until questions exist.
  await page.goto("/home");
  await expect(page).toHaveURL(/\/gate/);
  await page.waitForURL(/\/gate\/setup/);

  await fillQuestions(page);
  await page.getByRole("button", { name: "Save and go in" }).click();
  await page.waitForURL(/\/onboarding/);
  await expect(page.getByRole("heading", { name: /Where does your money sit/ })).toBeVisible();

  await page.getByLabel("Nickname").fill("Salary");
  await page.getByLabel("Bank or provider").fill("HDFC");
  await page.getByLabel("Last four digits").fill("4092");
  await page.getByLabel("Balance today").fill("50000");
  await page.getByRole("button", { name: "Add account" }).click();
  await expect(page.getByText("•••• 4092")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Skip for now/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: /Pick your home/ })).toBeVisible();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.waitForURL(/\/home/);
  await expect(page.getByText("Good", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("₹50,000").first()).toBeVisible();

  // A fresh session meets the gate again.
  await context.clearCookies();
  await logIn(page, email);
  await page.waitForURL(/\/gate/);
  await answerGate(page);
  await page.waitForURL(/\/home/);
  expect(errors).toEqual([]);
});

test("wrong answers roast, rotate and cool down; lock closes the app", async ({ page, context }) => {
  const email = await createReadyUser(page);
  await context.clearCookies();
  await logIn(page, email);
  await page.waitForURL(/\/gate/);

  const heading = page.locator("form h2");
  await expect(heading).toBeVisible();
  const first = await heading.textContent();

  await page.getByLabel("Your answer").fill("definitely wrong");
  await page.getByRole("button", { name: /Open the door/ }).click();
  await expect(page.getByText("Nope. Nice try, detective.")).toBeVisible();
  await expect(heading).not.toHaveText(first!);

  await page.getByLabel("Your answer").fill("wrong again");
  await page.getByRole("button", { name: /Open the door/ }).click();
  await expect(page.getByText(/Still wrong/)).toBeVisible();

  await page.getByLabel("Your answer").fill("still wrong");
  await page.getByRole("button", { name: /Open the door/ }).click();
  await expect(page.getByText(/Use your brain/)).toBeVisible();

  await page.getByLabel("Your answer").fill("nope");
  await page.getByRole("button", { name: /Open the door/ }).click();
  await expect(page.getByText(/The door reopens in/)).toBeVisible();
  await expect(page.getByLabel("Your answer")).toBeHidden();

  // The door reopens on its own once the 30 seconds are up.
  await expect(page.getByLabel("Your answer")).toBeVisible({ timeout: 40_000 });
  await answerGate(page);
  await page.waitForURL(/\/home/);

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Lock now" }).click();
  await page.waitForURL(/\/gate/);
  await page.goto("/finance");
  await expect(page).toHaveURL(/\/gate/);
});

test("freeze screen covers the app and keys work", async ({ page }) => {
  await createReadyUser(page);
  await page.keyboard.press("f");
  await expect(page.getByRole("button", { name: "Close the glass" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Close the glass" })).toBeHidden();
  await page.keyboard.press("Control+k");
  await page.getByPlaceholder("Search pages and actions").fill("budgets");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/finance\/budgets/);
});
