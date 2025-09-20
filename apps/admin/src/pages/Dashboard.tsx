
import { Card, LayoutStack } from '@ui/index';
import styles from './Dashboard.module.css';

export function Dashboard() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <h1>Dashboard Overview</h1>
        
        <div className={styles.statsGrid}>
          <Card className={styles.statCard}>
            <LayoutStack spacing="small">
              <h3>Pending Reports</h3>
              <div className={styles.statNumber}>12</div>
              <p className={styles.statDescription}>Reports awaiting review</p>
            </LayoutStack>
          </Card>
          
          <Card className={styles.statCard}>
            <LayoutStack spacing="small">
              <h3>Unapproved Highlights</h3>
              <div className={styles.statNumber}>8</div>
              <p className={styles.statDescription}>Highlights pending approval</p>
            </LayoutStack>
          </Card>
          
          <Card className={styles.statCard}>
            <LayoutStack spacing="small">
              <h3>Active Polls</h3>
              <div className={styles.statNumber}>5</div>
              <p className={styles.statDescription}>Polls currently running</p>
            </LayoutStack>
          </Card>
          
          <Card className={styles.statCard}>
            <LayoutStack spacing="small">
              <h3>Total Users</h3>
              <div className={styles.statNumber}>1,234</div>
              <p className={styles.statDescription}>Registered users</p>
            </LayoutStack>
          </Card>
        </div>

        <div className={styles.contentGrid}>
          <Card>
            <LayoutStack spacing="medium">
              <h2>Recent Activity</h2>
              <p>Recent admin actions and system events will appear here.</p>
              <ul>
                <li>User registration: john.doe@example.com</li>
                <li>Report resolved: Inappropriate content</li>
                <li>Highlight approved: Race moment</li>
                <li>Poll created: Driver of the day</li>
              </ul>
            </LayoutStack>
          </Card>
          
          <Card>
            <LayoutStack spacing="medium">
              <h2>Quick Actions</h2>
              <p>Common administrative tasks:</p>
              <ul>
                <li>Review pending reports</li>
                <li>Approve highlights</li>
                <li>Create new poll</li>
                <li>Manage spotlight content</li>
                <li>View user activity</li>
              </ul>
            </LayoutStack>
          </Card>
        </div>
      </LayoutStack>
    </div>
  );
}
