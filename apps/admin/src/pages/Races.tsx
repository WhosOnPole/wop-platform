
import { Card, LayoutStack, Button } from '@ui/index';
import styles from './AdminPage.module.css';

export function Races() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <div className={styles.header}>
          <h1>Race Management</h1>
          <Button>Create Race Room</Button>
        </div>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Race Administration</h2>
            <p>Manage race events and live discussions.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Create race room for live discussions</li>
              <li>Race event scheduling</li>
              <li>Live race updates and notifications</li>
              <li>Race-specific polls and highlights</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
