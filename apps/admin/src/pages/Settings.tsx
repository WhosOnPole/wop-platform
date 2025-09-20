
import { Card, LayoutStack } from '@ui';
import styles from './AdminPage.module.css';

export function Settings() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Platform Settings</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Content Management</h2>
            <p>Manage platform-wide content and policies.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Terms of Service editor</li>
              <li>Privacy Policy editor</li>
              <li>Platform announcements</li>
              <li>Content moderation rules</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
