
import { Card, LayoutStack, Button } from '@ui/index';
import styles from './AdminPage.module.css';

export function Spotlight() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <div className={styles.header}>
          <h1>Spotlight Management</h1>
          <Button>Create Spotlight</Button>
        </div>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Featured Content</h2>
            <p>Create and manage spotlight entries to highlight special content.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Create spotlight entries with title/body/date range</li>
              <li>Schedule spotlight content</li>
              <li>Manage active spotlights</li>
              <li>Spotlight analytics</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
