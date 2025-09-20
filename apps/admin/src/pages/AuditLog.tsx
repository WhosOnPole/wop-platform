
import { Card, LayoutStack } from '@ui/index';
import styles from './AdminPage.module.css';

export function AuditLog() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Audit Log</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>System Activity</h2>
            <p>Track all administrative actions and system changes.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>View all admin actions with timestamps</li>
              <li>Filter by user, action type, or date range</li>
              <li>Export audit logs for compliance</li>
              <li>Real-time activity monitoring</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
