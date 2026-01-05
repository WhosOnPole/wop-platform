export interface TestCredentials {
  email: string
  password: string
}

export function generateTestCredentials(prefix = 'wop-e2e'): TestCredentials {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  return {
    email: `${prefix}-${suffix}@example.com`,
    password: `P@ssw0rd-${suffix}`,
  }
}

