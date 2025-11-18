import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/ux.css';
import './Auth.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
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
      await register(username, password);
      navigate('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <section className="auth__hero">
        <p className="auth__eyebrow">Personal trainer OS</p>
        <h1>Create your coaching hub</h1>
        <p>Set up your account to craft templates, organize clients, and deliver personalized training programs with confidence.</p>
      </section>

      <section className="auth__card">
        <div className="auth__card-header">
          <h2>Register</h2>
          <p>Start building smarter training plans today.</p>
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
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="form__actions">
            <button type="submit" className="button button--primary" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </form>
        <p className="auth__switch">
          Already have an account?
          {' '}
          <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
