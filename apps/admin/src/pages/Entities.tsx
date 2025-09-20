
import { Card, LayoutStack, Button } from '@ui/index';
import styles from './AdminPage.module.css';

export function Entities() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <div className={styles.header}>
          <h1>Entities Management</h1>
          <Button>Add Entity</Button>
        </div>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Drivers, Teams & Tracks</h2>
            <p>Manage the core entities in the platform.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>CRUD operations for drivers, teams, and tracks</li>
              <li>Entity metadata and facts management</li>
              <li>Entity relationships and associations</li>
              <li>Bulk import/export functionality</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
