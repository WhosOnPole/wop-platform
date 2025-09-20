
import { useParams } from 'react-router-dom';
import { Card, LayoutStack } from '@ui';
import styles from './EntityDetail.module.css';

export function DriverDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Driver Details</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Driver ID: {id}</h2>
            <p>This page will show detailed information about the selected driver.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Driver biography and statistics</li>
              <li>Recent comments and discussions</li>
              <li>Fan highlights featuring this driver</li>
              <li>Related polls and predictions</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
