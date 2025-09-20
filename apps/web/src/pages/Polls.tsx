
import { Card, LayoutStack } from '@ui';
import styles from './Polls.module.css';

export function Polls() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Polls</h1>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Community Polls</h2>
            <p>Participate in polls and see what the community thinks about F1 topics.</p>
            <p>Features coming soon:</p>
            <ul>
              <li>Create and vote on polls</li>
              <li>Real-time poll results</li>
              <li>Poll categories (drivers, teams, races, etc.)</li>
              <li>Historical poll data and trends</li>
            </ul>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
