
import { useParams } from 'react-router-dom';
import { Card, LayoutStack } from '@ui';
import styles from './EntityDetail.module.css';

export function TeamDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Team Details</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Team ID: {id}</h2>
            <p>This page will show detailed information about the selected team.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Team history and achievements</li>
              <li>Current drivers and team principal</li>
              <li>Recent comments and discussions</li>
              <li>Fan highlights featuring this team</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
