
import { Card, LayoutStack } from '@ui';
import styles from './Feed.module.css';

export function Feed() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Feed</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Welcome to your feed!</h2>
            <p>This is where you'll see the latest discussions, highlights, and updates from the F1 community.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Real-time comments and discussions</li>
              <li>Fan highlights and spotlights</li>
              <li>Personalized content based on your interests</li>
              <li>Live race updates and reactions</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
