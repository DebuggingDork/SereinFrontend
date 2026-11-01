import { expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";

const MAILPIT = "http://127.0.0.1:54324";

export const PASSWORD = "correct-horse-battery";
export const ANSWERS: Record<string, string> = {
  "What was the first street you lived on?": "Serein Street",
  "What was your first pet called?": "Biscuit",
  "Which teacher do you still think about?": "Mrs Rao",
};

export const newEmail = (prefix = "person") => `${prefix}-${randomUUID().slice(0, 8)}@serein.test`;

// Polls the local mail catcher for the newest message to an address and returns its link.
export async function emailLink(email: string, match: RegExp, attempts = 40): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages = [] } = (await search.json()) as { messages?: { ID: string; Subject: string }[] };
    for (const message of messages) {
      if (!match.test(message.Subject)) continue;
      const body = (await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json()) as { Text: string; HTML: string };
      const link = `${body.HTML} ${body.Text}`.match(/https?:\/\/[^\s"<>]+verify[^\s"<>]+/)?.[0];
      if (link) return link.replace(/&amp;/g, "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No "${match}" email reached ${email}`);
}

export async function emailSubjects(email: string): Promise<string[]> {
  const search = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
  const { messages = [] } = (await search.json()) as { messages?: { Subject: string }[] };
  return messages.map((message) => message.Subject);
}

export async function signUp(page: Page, email: string, name = "Mani") {
  await page.goto("/signup");
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: /Check your inbox/ })).toBeVisible();
}

export async function logIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
}

export async function fillQuestions(page: Page) {
  const questions = Object.values(ANSWERS);
  for (let i = 0; i < questions.length; i++) {
    await page.getByLabel(`Answer`).nth(i).fill(questions[i]!);
  }
}

export async function answerGate(page: Page) {
  const heading = page.locator("form h2");
  await expect(heading).toBeVisible();
  const question = (await heading.textContent())!.trim();
  await page.getByLabel("Your answer").fill(ANSWERS[question]!);
  await page.getByRole("button", { name: "Continue" }).click();
}

// Signup through to the home page, for tests that are about something else.
export async function createReadyUser(page: Page, email = newEmail()) {
  await signUp(page, email);
  await page.goto(await emailLink(email, /confirm/i));
  await page.waitForURL(/\/gate/);
  await page.waitForURL(/\/gate\/setup/);
  await fillQuestions(page);
  await page.getByRole("button", { name: "Save and go in" }).click();
  await page.waitForURL(/\/onboarding/);
  await page.getByRole("button", { name: /Skip for now/ }).click();
  await page.getByRole("button", { name: /Skip for now/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Finish" }).click();
  await page.waitForURL(/\/home/);
  return email;
}

export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !/Failed to load resource|WebSocket/.test(message.text())) {
      errors.push(`console: ${message.text()}`);
    }
  });
  return errors;
}
