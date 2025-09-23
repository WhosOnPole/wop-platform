import { useState } from 'react';
import { Button, TextField, Card, LayoutStack } from '@ui';
import styles from './ComingSoon.module.css';

export function ComingSoon() {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Store email locally for now
    localStorage.setItem('coming_soon_email', email);
    alert('Thanks for your interest! We\'ll notify you when we launch.');
    setEmail('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Coming Soon</h1>
        <p className={styles.subtitle}>
          The ultimate platform for Formula 1 fans. Connect, discuss, and share your passion.
        </p>
        
        {/* <Card className={styles.card}>
          <LayoutStack spacing="medium" align="center">
            <h2>Get Notified</h2>
            <p>Be the first to know when we launch!</p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <LayoutStack direction="horizontal" spacing="small" align="center">
                <TextField
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit">Notify Me</Button>
              </LayoutStack>
            </form>
          </LayoutStack>
        </Card> */}

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
