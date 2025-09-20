import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, TextField, Card, LayoutStack } from '@ui';
import { useAuth } from '../hooks/useAuth.mock';
import styles from './Auth.module.css';

export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for password reset instructions');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <LayoutStack spacing="large" align="center">
          <h1>Reset Password</h1>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <LayoutStack spacing="medium">
              <TextField
                type="email"
                label="Email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}
              {message && (
                <div className={styles.success}>
                  {message}
                </div>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </LayoutStack>
          </form>

          <div className={styles.links}>
            <Link to="/login">Back to Sign In</Link>
          </div>
        </LayoutStack>
      </Card>
    </div>
  );
}
