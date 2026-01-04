import { test, expect } from '@playwright/test'
import { createTestAccount, loginAsUser, logout } from './fixtures/auth'
import { generateTestCredentials } from './fixtures/test-data'

test.describe('Authentication', () => {
  test('can sign up a new user via UI', async ({ page }) => {
    const creds = generateTestCredentials('signup')
    await createTestAccount(page, creds)
    await expect(page).toHaveURL(/\/(auth\/callback|\/|feed)/)
  })

  test('can login an existing user via UI', async ({ page }) => {
    const creds = generateTestCredentials('login')

    // Create account, then log out and log back in within the same context
    await createTestAccount(page, creds)
    await logout(page)
    await loginAsUser(page, creds)
    await expect(page).toHaveURL(/\/(auth\/callback|\/|feed|dashboard|profile)/)
  })
})

