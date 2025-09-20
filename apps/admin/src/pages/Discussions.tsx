
import { Card, LayoutStack } from '@ui/index';
import styles from './AdminPage.module.css';

export function Discussions() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Discussions Management</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Comment Moderation</h2>
            <p>Monitor and moderate community discussions across all entities.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>View all comments by entity</li>
              <li>Hide/restore comments</li>
              <li>Bulk moderation actions</li>
              <li>Comment analytics</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
