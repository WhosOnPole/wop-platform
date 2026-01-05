import { Page, BrowserContext, Browser, expect } from '@playwright/test'
import { generateTestCredentials, type TestCredentials } from './test-data'

export interface AuthenticatedContextResult {
  context: BrowserContext
  page: Page
  creds: TestCredentials
}

async function clearClientState(page: Page) {
  await page.context().clearCookies()
  // Best-effort clear of storage; ignore navigation failures if server not up yet
  await page.goto('/', { waitUntil: 'load' }).catch(() => {})
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  }).catch(() => {})
}

export async function createTestAccount(page: Page, creds = generateTestCredentials()) {
  await clearClientState(page)
  await page.goto('/signup', { waitUntil: 'load' })

  await page.getByRole('textbox', { name: /email/i }).fill(creds.email)
  await page.getByLabel(/password/i).fill(creds.password)
  await page.getByRole('button', { name: 'Sign up', exact: true }).click()

  // Wait for redirect to home (or profile) as a signal of success
  await page.waitForURL(/\/(auth\/callback|\/|feed)/, { timeout: 30_000 })
  return creds
}

export async function loginAsUser(page: Page, creds: TestCredentials) {
  await clearClientState(page)
  await page.goto('/login', { waitUntil: 'load' })
  await page.getByRole('textbox', { name: /email/i }).fill(creds.email)
  await page.getByLabel(/password/i).fill(creds.password)
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL(/\/(auth\/callback|\/|feed|dashboard|profile)/, { timeout: 30_000 })
  return creds
}

export async function authenticatedContext(
  browser: Browser,
  baseURL: string,
  existingCreds?: TestCredentials
): Promise<AuthenticatedContextResult> {
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()
  const creds = existingCreds ?? generateTestCredentials()
  await createTestAccount(page, creds)
  return { context, page, creds }
}

export async function logout(page: Page) {
  // If there is a logout endpoint or link, hit it; otherwise clear cookies as a fallback
  const logoutLink = page.getByRole('link', { name: /logout/i })
  if (await logoutLink.isVisible().catch(() => false)) {
    await logoutLink.click()
    await page.waitForLoadState('networkidle')
    return
  }
  await page.context().clearCookies()
  await page.goto('/')
  await expect(page).toHaveURL(/\/|\/login|\/signup/)
}

