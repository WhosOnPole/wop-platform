
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.mock';
import { Button } from '@ui';
import styles from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Reports', href: '/reports' },
  { name: 'Highlights', href: '/highlights' },
  { name: 'Discussions', href: '/discussions' },
  { name: 'Spotlight', href: '/spotlight' },
  { name: 'Polls', href: '/polls' },
  { name: 'Entities', href: '/entities' },
  { name: 'Users', href: '/users' },
  { name: 'Races', href: '/races' },
  { name: 'Settings', href: '/settings' },
  { name: 'Audit Log', href: '/audit-log' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>WOP Admin</h2>
        </div>
        <nav className={styles.nav}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`${styles.navLink} ${
                location.pathname === item.href ? styles.navLinkActive : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
      
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <h1>Admin Dashboard</h1>
            <div className={styles.userInfo}>
              <span>Welcome, {user?.email}</span>
              <Button variant="outline" size="small" onClick={() => signOut()}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>
        
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
