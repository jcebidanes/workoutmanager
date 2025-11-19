import type { FC } from 'react';
import { useI18n } from '../../hooks/useI18n';

interface QuickActionsMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewTemplate: () => void;
  onNewClient: () => void;
  onLogProgress: () => void;
}

const QuickActionsMenu: FC<QuickActionsMenuProps> = ({
  isOpen,
  onToggle,
  onNewTemplate,
  onNewClient,
  onLogProgress,
}) => {
  const { t } = useI18n();

  return (
    <>
      <button
        type="button"
        className="fab"
        aria-label={t('fab.ariaLabel')}
        onClick={onToggle}
      >
        +
      </button>
      {isOpen && (
        <div className="fab-menu" role="menu" aria-label={t('fab.menuLabel')}>
          <button
            type="button"
            role="menuitem"
            onClick={onNewTemplate}
          >
            {t('fab.newTemplate')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onNewClient}
          >
            {t('fab.newClient')}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onLogProgress}
          >
            {t('fab.logProgress')}
          </button>
        </div>
      )}
    </>
  );
};

export default QuickActionsMenu;
