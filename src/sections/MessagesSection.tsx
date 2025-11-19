import { useEffect, useState } from 'react';
import type { ClientRecord } from '../types/dashboard';
import { useI18n } from '../hooks/useI18n';
import ClientMessages from '../components/ClientMessages';

interface MessagesSectionProps {
  clients: ClientRecord[];
}

const MessagesSection: React.FC<MessagesSectionProps> = ({ clients }) => {
  const { t } = useI18n();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  useEffect(() => {
    if (clients.length > 0) {
      setSelectedClientId((prev) => {
        if (prev && clients.some((client) => client.id === prev)) {
          return prev;
        }
        return clients[0].id;
      });
    } else {
      setSelectedClientId(null);
    }
  }, [clients]);

  if (clients.length === 0) {
    return (
      <div className="section-panel">
        <h2>{t('messages.page.title')}</h2>
        <p className="panel__hint">{t('messages.page.subtitle')}</p>
        <div className="empty-state">
          <p>{t('messages.page.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-panel">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('messages.page.eyebrow')}</p>
          <h2>{t('messages.page.title')}</h2>
        </div>
        <p className="panel__hint">{t('messages.page.subtitle')}</p>
      </div>
      <div className="form-field">
        <label htmlFor="messages-client-select">{t('messages.page.clientLabel')}</label>
        <select
          id="messages-client-select"
          value={selectedClientId ?? ''}
          onChange={(event) => setSelectedClientId(Number(event.target.value))}
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>
      {selectedClientId && <ClientMessages clientId={selectedClientId} />}
    </div>
  );
};

export default MessagesSection;
