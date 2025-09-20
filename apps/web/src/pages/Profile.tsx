
import { useParams } from 'react-router-dom';
import { Card, LayoutStack } from '@ui';
import styles from './Profile.module.css';

export function Profile() {
  const { handle } = useParams<{ handle: string }>();

  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>User Profile</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>@{handle}</h2>
            <p>This page will show the user's profile and activity.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>User bio and preferences</li>
              <li>Recent comments and posts</li>
              <li>Fan highlights and achievements</li>
              <li>Following/followers list</li>
              <li>Personal grid rankings</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
