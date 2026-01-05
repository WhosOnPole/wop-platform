import { Browser, BrowserContext, Page } from '@playwright/test'
import { authenticatedContext } from '../fixtures/auth'
import { generateTestCredentials, type TestCredentials } from '../fixtures/test-data'

export interface TestUserSession {
  context: BrowserContext
  page: Page
  creds: TestCredentials
}

export async function createMultipleAccounts(browser: Browser, baseURL: string, count: number) {
  const users: TestUserSession[] = []
  for (let i = 0; i < count; i += 1) {
    const creds = generateTestCredentials(`wop-multi-${i}`)
    const { context, page } = await authenticatedContext(browser, baseURL, creds)
    users.push({ context, page, creds })
  }
  return users
}

export async function switchUser(current: TestUserSession, next: TestUserSession) {
  await current.page.context().close()
  return next
}

