
import { Card, LayoutStack, Button } from '@ui/index';
import styles from './AdminPage.module.css';

export function Reports() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <div className={styles.header}>
          <h1>Reports Queue</h1>
          <Button>Export Reports</Button>
        </div>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Pending Reports</h2>
            <p>Review and manage user reports of inappropriate content or behavior.</p>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>ID</div>
                <div>Type</div>
                <div>Reason</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              <div className={styles.tableRow}>
                <div>#001</div>
                <div>Comment</div>
                <div>Inappropriate language</div>
                <div>Open</div>
                <div>
                  <Button size="small" variant="outline">Review</Button>
                </div>
              </div>
            </div>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
