
import { Card, LayoutStack, Button } from '@ui/index';
import styles from './AdminPage.module.css';

export function Highlights() {
  return (
    <div className={styles.container}>
      <LayoutStack spacing="large">
        <div className={styles.header}>
          <h1>Highlights Management</h1>
          <Button>Create Highlight</Button>
        </div>
        
        <Card>
          <LayoutStack spacing="medium">
            <h2>Pending Approval</h2>
            <p>Review and approve user-submitted highlights.</p>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>ID</div>
                <div>Caption</div>
                <div>Author</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              <div className={styles.tableRow}>
                <div>#001</div>
                <div>Amazing overtake in turn 3</div>
                <div>user@example.com</div>
                <div>Pending</div>
                <div>
                  <Button size="small">Approve</Button>
                  <Button size="small" variant="outline">Reject</Button>
                </div>
              </div>
            </div>
          </LayoutStack>
        </Card>
      </LayoutStack>
    </div>
  );
}
