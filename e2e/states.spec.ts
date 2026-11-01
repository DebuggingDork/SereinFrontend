import { expect, test, type Page } from "@playwright/test";
import { createReadyUser } from "./helpers";

async function chase(page: Page) {
  const button = page.getByRole("link", { name: "Take me home" });
  const box = (await button.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 3 });
  await page.waitForTimeout(350);
}

test("an unknown address teases the visitor, and the button runs away three times", async ({ page }) => {
  await page.goto("/wp-admin/secrets");
  await expect(page.getByRole("heading", { name: "Aha, buddy." })).toBeVisible();
  await expect(page.getByText("hacker from emudhra")).toBeVisible();
  await page.mouse.move(5, 5);

  await chase(page);
  await expect(page.getByRole("heading", { name: "Oh, leaving already?" })).toBeVisible();
  await chase(page);
  await expect(page.getByRole("heading", { name: "Too slow, detective." })).toBeVisible();
  await chase(page);
  await expect(page.getByRole("heading", { name: "Fine. I'm bored of you." })).toBeVisible();

  await page.getByRole("link", { name: "Take me home" }).click();
  await page.waitForURL((url) => url.pathname === "/");
});

test("a keyboard user is never trapped by the runaway button", async ({ page }) => {
  await page.goto("/nope");
  await page.getByRole("link", { name: "Take me home" }).focus();
  await page.keyboard.press("Enter");
  await page.waitForURL((url) => url.pathname === "/");
});

test("features scroll into view without touching the address", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Features" }).click();
  await expect(page.getByRole("heading", { name: /All your money/ })).toBeInViewport();
  expect(new URL(page.url()).hash).toBe("");

  // From another document, because going from "/" would only change the hash without a load.
  await page.goto("/login");
  await page.goto("/#modules");
  await expect.poll(() => new URL(page.url()).hash).toBe("");
});

test("a sign in code on the bare address still reaches the callback", async ({ page }) => {
  await page.goto("/?code=not-a-real-code");
  await page.waitForURL(/login\?error=link/);
});

test("every status screen has a preview", async ({ page }) => {
  for (const [state, heading] of [
    ["offline", /offline/],
    ["slow", /a while/],
    ["waking", /waking up/],
    ["down", /down/],
    ["busy", /slow down/],
    ["crash", /broke/],
  ] as const) {
    await page.goto(`/status/${state}`);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("the app covers itself while offline, keeps the page, and recovers", async ({ page, context }) => {
  await createReadyUser(page);
  await page.goto("/finance");
  const quick = page.getByLabel("Quick add an expense");
  await quick.fill("150 chai");

  await context.setOffline(true);
  await expect(page.getByRole("heading", { name: /offline/ })).toBeVisible();

  await context.setOffline(false);
  await expect(page.getByRole("heading", { name: /offline/ })).toHaveCount(0);
  await expect(quick).toHaveValue("150 chai");
});

test("a server outage shows the waking screen, then recovers by itself", async ({ page }) => {
  await createReadyUser(page);
  await page.route("**/api/backend/**", (route) => route.fulfill({ status: 503, body: "{}" }));
  // Recovery asks the backend for its state as soon as it opens.
  await page.goto("/gate/recovery");
  await expect(page.getByRole("heading", { name: /waking up/ })).toBeVisible({ timeout: 30_000 });

  await page.unroute("**/api/backend/**");
  await page.getByRole("button", { name: "Check now" }).click();
  await expect(page.getByRole("heading", { name: /waking up/ })).toHaveCount(0, { timeout: 30_000 });
});

test("too many requests shows a countdown, but the question's own cooldown does not", async ({ page }) => {
  await createReadyUser(page);
  await page.route("**/api/backend/recovery/**", (route) =>
    route.fulfill({ status: 429, headers: { "retry-after": "3" }, contentType: "application/json", body: '{"error":"Too many requests. Give it a minute."}' }),
  );
  await page.goto("/gate/recovery");
  await expect(page.getByRole("heading", { name: /slow down/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /slow down/ })).toHaveCount(0, { timeout: 10_000 });
});

test("a password can be shown and hidden", async ({ page }) => {
  for (const path of ["/login", "/signup"]) {
    await page.goto(path);
    const field = page.getByLabel("Password", { exact: true });
    await field.fill("correct-horse-battery");
    await expect(field).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(field).toHaveAttribute("type", "text");
    await expect(field).toHaveValue("correct-horse-battery");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(field).toHaveAttribute("type", "password");
  }
});

test("signup skips the inbox when the account is signed in straight away", async ({ page }) => {
  await page.route("**/auth/v1/signup**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "header.e30.signature",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "refresh",
        user: { id: "00000000-0000-0000-0000-000000000000", aud: "authenticated", email: "a@serein.test", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
      }),
    }),
  );
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Mani");
  await page.getByLabel("Email").fill("a@serein.test");
  await page.getByLabel("Password", { exact: true }).fill("correct-horse-battery");
  await page.getByRole("button", { name: "Create account" }).click();
  // The made up session has no real signature, so the proxy sends it on to login, asking for the gate.
  await page.waitForURL(/gate/);
  expect(page.url()).not.toContain("verify-email");
});
