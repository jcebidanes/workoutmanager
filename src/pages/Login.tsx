import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/ux.css';
import './Auth.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid username or password.');
      }
    } catch {
      setError('Unable to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <section className="auth__hero">
        <p className="auth__eyebrow">Personal trainer OS</p>
        <h1>Welcome back, coach</h1>
        <p>Log in to plan workouts, assign templates, and keep every client progressing from one dashboard.</p>
      </section>

      <section className="auth__card">
        <div className="auth__card-header">
          <h2>Sign in</h2>
          <p>Use your trainer account to continue.</p>
        </div>
        {error && <p className="auth__error">{error}</p>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form__actions">
            <button type="submit" className="button button--primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </div>
        </form>
        <p className="auth__switch">
          New here?
          {' '}
          <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;
