/**
 * Minimal layout for auth routes (login, signup).
 * No TopNav, Footer, or other heavy layout - LayoutSwitch renders AuthLayoutShell for these paths.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
