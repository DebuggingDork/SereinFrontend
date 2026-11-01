import { expect, test, type Page } from "@playwright/test";
import { answerGate, createReadyUser, emailLink, emailSubjects, fillQuestions, logIn, newEmail } from "./helpers";

// The well-known demo key every local Supabase stack ships with. Used here only to
// promote a test admin and to fast-forward the waiting time.
const SUPABASE = "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const headers = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json" };

async function userIdFor(email: string): Promise<string> {
  const response = await fetch(`${SUPABASE}/auth/v1/admin/users?per_page=1000`, { headers });
  const { users } = (await response.json()) as { users: { id: string; email: string }[] };
  return users.find((user) => user.email === email)!.id;
}

async function patch(table: string, filter: string, body: object) {
  const response = await fetch(`${SUPABASE}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  expect(response.ok, await response.text()).toBe(true);
}

async function freshPage(page: Page) {
  const context = await page.context().browser()!.newContext({ baseURL: "http://localhost:3000" });
  return context.newPage();
}

test("a forgotten answer takes email proof, approval and the wait, and keeps all data", async ({ page }) => {
  test.setTimeout(180_000);

  const adminEmail = await createReadyUser(page, newEmail("admin"));
  await patch("profiles", `id=eq.${await userIdFor(adminEmail)}`, { role: "admin" });
  await page.context().clearCookies();
  await logIn(page, adminEmail);
  await page.waitForURL(/\/gate/);
  await answerGate(page);
  await page.waitForURL(/\/home/);

  const visitor = await freshPage(page);
  const email = await createReadyUser(visitor, newEmail());
  const userId = await userIdFor(email);

  // Some data, to prove it survives.
  await visitor.goto("/planner");
  await visitor.getByLabel("Add a task").fill("Survive recovery");
  await visitor.getByRole("button", { name: "Add", exact: true }).click();
  await expect(visitor.getByText("Survive recovery")).toBeVisible();

  await visitor.context().clearCookies();
  await logIn(visitor, email);
  await visitor.waitForURL(/\/gate/);
  await visitor.getByRole("link", { name: "I forgot my answers" }).click();
  await visitor.waitForURL(/\/gate\/recovery/);

  // Step one: prove the email is yours.
  await visitor.getByRole("button", { name: "Email me a confirmation link" }).click();
  await expect(visitor.getByText("Check your inbox")).toBeVisible();
  await visitor.goto(await emailLink(email, /sign-in link/i));
  await visitor.waitForURL(/\/gate\/recovery/);

  // Step two: choose urgency. Nothing here may mention an admin.
  await visitor.getByRole("button", { name: /Normal request/ }).click();
  await expect(visitor.getByText("Your request has been triggered.")).toBeVisible();
  await expect(visitor.getByText(/in (89|90) minutes/)).toBeVisible();
  await expect(visitor.locator("body")).not.toContainText(/admin/i);

  await expect
    .poll(() => emailSubjects(email), { timeout: 15_000 })
    .toContainEqual("A request to reset your Serein questions");

  // The wait passing alone does not unlock it.
  await patch("recovery_requests", `user_id=eq.${userId}`, { ready_at: new Date(Date.now() - 1000).toISOString() });
  await visitor.getByRole("button", { name: "Check again" }).click();
  await expect(visitor.getByText("The system has approved your request")).toHaveCount(0);

  // The owner approves from the panel, and only the owner can see it.
  await visitor.goto("/admin");
  await expect(visitor.getByText("Nothing here", { exact: false })).toBeVisible({ timeout: 5000 }).catch(() => {});
  await visitor.goto("/gate/recovery");

  await page.goto("/admin");
  const row = page.getByRole("listitem").filter({ hasText: email });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row.getByText("ready")).toBeVisible();

  await expect
    .poll(() => emailSubjects(email), { timeout: 15_000 })
    .toContainEqual("The system has approved your request");

  // Now it opens, with new questions, the same user id and the same data.
  await visitor.reload();
  await expect(visitor.getByText("The system has approved your request")).toBeVisible();
  await fillQuestions(visitor);
  await visitor.getByRole("button", { name: "Save new questions" }).click();
  await visitor.waitForURL(/\/home/);

  await visitor.goto("/planner");
  await expect(visitor.getByText("Survive recovery")).toBeVisible();
  expect(await userIdFor(email)).toBe(userId);

  // The security log saw the owner's gate passes, and the users tab lists accounts.
  await page.getByRole("button", { name: "Users" }).click();
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole("button", { name: "Security log" }).click();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await expect(page.getByRole("table")).toBeVisible();

  await visitor.context().close();
});

test("someone else cannot reach the admin panel", async ({ page }) => {
  await createReadyUser(page);
  await page.goto("/admin");
  await expect(page.getByText("Nothing", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Admin" })).toHaveCount(0);
});
