
import { Card, LayoutStack, Button } from '@ui/index';
import styles from './AdminPage.module.css';

export function Polls() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <div className={styles.header}>
          <h1>Polls Management</h1>
          <Button>Create Poll</Button>
        </div>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Community Polls</h2>
            <p>Create and manage polls for the community.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Create poll with multiple options</li>
              <li>Close poll and see results</li>
              <li>Poll analytics and insights</li>
              <li>Poll categories and tags</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
