import type { FC } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { Language } from '../../types/language';

interface DashboardTopbarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onToggleSidebar: () => void;
  userName: string;
  onLogout: () => void;
}

const DashboardTopbar: FC<DashboardTopbarProps> = ({
  searchTerm,
  onSearchTermChange,
  onToggleSidebar,
  userName,
  onLogout,
}) => {
  const { t, language, setLanguage } = useI18n();

  return (
    <header className="app-shell__topbar">
      <div>
        <p className="dashboard__tagline">{t('topbar.tagline')}</p>
        <h1 className="topbar__title">{t('topbar.title')}</h1>
        <p className="topbar__subtitle">{t('topbar.subtitle')}</p>
      </div>
      <div className="topbar__actions">
        <button
          type="button"
          className="sidebar-toggle"
          aria-label={t('topbar.openMenu')}
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <div className="topbar__search">
          <label htmlFor="global-search" className="sr-only">{t('topbar.searchPlaceholder')}</label>
          <input
            id="global-search"
            type="search"
            value={searchTerm}
            onChange={(event) => onSearchTermChange(event.target.value)}
            placeholder={t('topbar.searchPlaceholder')}
          />
        </div>
        <button type="button" className="topbar__pill">
          {t('topbar.alerts')}
          <span className="topbar__badge">3</span>
        </button>
        <label htmlFor="language-select" className="sr-only">{t('topbar.languageLabel')}</label>
        <select
          id="language-select"
          className="language-select"
          value={language}
          onChange={(event) => setLanguage(event.target.value as Language)}
        >
          <option value="pt">{t('auth.language.pt')}</option>
          <option value="en">{t('auth.language.en')}</option>
        </select>
        <div className="topbar__user">
          <div>
            <p className="dashboard__welcome">{t('topbar.greeting')},</p>
            <strong>{userName}</strong>
          </div>
          <button type="button" className="button button--ghost" onClick={onLogout}>
            {t('topbar.logout')}
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardTopbar;
