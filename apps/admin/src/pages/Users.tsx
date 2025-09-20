
import { Card, LayoutStack, Button } from '@ui/index';
import styles from './AdminPage.module.css';

export function Users() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <div className={styles.header}>
          <h1>User Management</h1>
          <Button>Search Users</Button>
        </div>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>User Administration</h2>
            <p>Manage user accounts and permissions.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Search and filter users</li>
              <li>View user profiles and activity</li>
              <li>Warn users and add notes</li>
              <li>Soft delete and restore accounts</li>
              <li>Role and permission management</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
