import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, TextField, Card, LayoutStack } from '@ui';
import { useAuth } from '../hooks/useAuth.mock';
import styles from './Auth.module.css';

export function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate('/feed');
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
          <h1>Sign Up</h1>
          
          <form onSubmit={handleSubmit} className={styles.form}>
            <LayoutStack spacing="medium">
              <TextField
                type="email"
                label="Email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
              />
              <TextField
                type="password"
                label="Password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
              />
              <TextField
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
              />
              {error && (
                <div className={styles.error}>
                  {error}
                </div>
              )}
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>
            </LayoutStack>
          </form>

          <div className={styles.links}>
            <p>
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </LayoutStack>
      </Card>
    </div>
  );
}
