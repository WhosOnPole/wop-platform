
import { useParams } from 'react-router-dom';
import { Card, LayoutStack } from '@ui';
import styles from './EntityDetail.module.css';

export function TrackDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Track Details</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Track ID: {id}</h2>
            <p>This page will show detailed information about the selected track.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Track layout and characteristics</li>
              <li>Race history and memorable moments</li>
              <li>Recent comments and discussions</li>
              <li>Fan highlights from this track</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
