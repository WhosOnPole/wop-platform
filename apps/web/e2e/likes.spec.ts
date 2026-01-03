import { test } from '@playwright/test'
import { createMultipleAccounts } from './utils/multi-account'

// These tests are scaffolded and marked skipped until stable seed data and selectors are finalized.
test.describe.skip('Like system', () => {
  test('user can like and unlike a post', async ({ browser, baseURL }) => {
    const [userA] = await createMultipleAccounts(browser, baseURL, 1)
    const page = userA.page

    await page.goto('/feed')
    // TODO: Click first like button and assert count increments
  })

  test('multi-user like count increments across users', async ({ browser, baseURL }) => {
    const [userA, userB] = await createMultipleAccounts(browser, baseURL, 2)

    await userA.page.goto('/feed')
    // TODO: User A likes first post

    await userB.page.goto('/feed')
    // TODO: Verify like count reflects User A's like, then like again and assert count
  })
})

