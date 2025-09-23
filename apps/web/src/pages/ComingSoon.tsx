import styles from './ComingSoon.module.css';

export function ComingSoon() {

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Coming Soon</h1>
        <p className={styles.subtitle}>
          The ultimate platform for Formula 1 fans. Connect, discuss, and share your passion.
        </p>

        <div className={styles.features}>
          <h3>What to expect:</h3>
          <ul>
            <li>Real-time discussions about drivers, teams, and tracks</li>
            <li>Fan polls and predictions</li>
            <li>Personalized feed based on your interests</li>
            <li>Community highlights and spotlights</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
