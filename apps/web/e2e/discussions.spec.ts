import { test } from '@playwright/test'
import { createMultipleAccounts } from './utils/multi-account'

// Scaffolded tests; enable after stable selectors/content for discussions.
test.describe.skip('Discussions', () => {
  test('users can create a post and reply', async ({ browser, baseURL }) => {
    const [userA, userB] = await createMultipleAccounts(browser, baseURL, 2)
    await userA.page.goto('/feed')
    // TODO: User A creates a post, User B replies, verify thread renders
  })

  test('nested replies and like counts update', async ({ browser, baseURL }) => {
    const [userA, userB, userC] = await createMultipleAccounts(browser, baseURL, 3)
    await userA.page.goto('/feed')
    // TODO: create post -> comment -> reply -> like counts check
  })
})

