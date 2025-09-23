import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@ui';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, signOut } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.container}>
          <Link to="/" className={styles.logo}>
            WOP Platform
          </Link>
          <nav className={styles.nav}>
            <Link to="/feed">Feed</Link>
            <Link to="/polls">Polls</Link>
            {user ? (
              <div className={styles.userMenu}>
                <span>Welcome, {user.email}</span>
                <Button variant="outline" size="small" onClick={() => signOut()}>
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className={styles.authMenu}>
                <Link to="/login">
                  <Button variant="outline" size="small">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="small">Sign Up</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        {children}
      </main>
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>&copy; 2024 WOP Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
