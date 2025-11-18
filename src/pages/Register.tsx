import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import type { Language } from '../types/language';
import '../styles/ux.css';
import './Auth.css';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useI18n();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError(t('auth.errors.missingFields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(username, password, language);
      navigate('/login');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('auth.errors.generic');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <section className="auth__hero">
        <p className="auth__eyebrow">{t('auth.hero.tagline')}</p>
        <h1>{t('auth.hero.registerTitle')}</h1>
        <p>{t('auth.hero.registerBody')}</p>
      </section>

      <section className="auth__card">
        <div className="auth__card-header">
          <h2>{t('auth.register.title')}</h2>
          <p>{t('auth.register.subtitle')}</p>
        </div>
        <div className="auth__language">
          <label htmlFor="auth-language" className="sr-only">{t('auth.languageLabel')}</label>
          <select
            id="auth-language"
            className="language-select"
            value={language}
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            <option value="pt">{t('auth.language.pt')}</option>
            <option value="en">{t('auth.language.en')}</option>
          </select>
        </div>
        {error && <p className="auth__error">{error}</p>}
        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="username">{t('auth.fields.username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="password">{t('auth.fields.password')}</label>
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
              {loading ? t('auth.register.loading') : t('auth.register.submit')}
            </button>
          </div>
        </form>
        <p className="auth__switch">
          {t('auth.register.switchPrefix')}
          {' '}
          <Link to="/login">{t('auth.register.switchLink')}</Link>
        </p>
      </section>
    </main>
  );
};

export default Register;
