import { test } from '@playwright/test'
import { createMultipleAccounts } from './utils/multi-account'

// Scaffolded multi-user flows; fill in once stable selectors for feed/discussion/likes exist.
test.describe.skip('Multi-user interactions', () => {
  test('User A creates content, User B likes it', async ({ browser, baseURL }) => {
    const [userA, userB] = await createMultipleAccounts(browser, baseURL, 2)
    await userA.page.goto('/feed')
    // TODO: create content and capture identifier

    await userB.page.goto('/feed')
    // TODO: like User A content and verify count increments
  })

  test('User A unlikes and count decrements', async ({ browser, baseURL }) => {
    const [userA, userB] = await createMultipleAccounts(browser, baseURL, 2)
    await userA.page.goto('/feed')
    // TODO: both like; then A unlikes and assert count
  })
})

