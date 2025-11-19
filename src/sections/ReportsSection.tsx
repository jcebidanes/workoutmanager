import { useEffect, useMemo, useState } from 'react';
import type { ClientRecord } from '../types/dashboard';
import { useI18n } from '../hooks/useI18n';
import ClientMetrics from '../components/ClientMetrics';

interface ReportsSectionProps {
  clients: ClientRecord[];
}

const ReportsSection: React.FC<ReportsSectionProps> = ({ clients }) => {
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

  const totalWorkouts = useMemo(
    () => clients.reduce((count, client) => count + client.workouts.length, 0),
    [clients],
  );

  if (clients.length === 0) {
    return (
      <div className="section-panel">
        <h2>{t('reports.page.title')}</h2>
        <p className="panel__hint">{t('reports.page.subtitle')}</p>
        <div className="empty-state">
          <p>{t('reports.page.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-panel">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('reports.page.eyebrow')}</p>
          <h2>{t('reports.page.title')}</h2>
        </div>
        <p className="panel__hint">{t('reports.page.subtitle')}</p>
      </div>
      <div className="reports-grid">
        <article>
          <p>{t('reports.page.clientCount')}</p>
          <strong>{clients.length}</strong>
        </article>
        <article>
          <p>{t('reports.page.workoutCount')}</p>
          <strong>{totalWorkouts}</strong>
        </article>
      </div>
      <div className="form-field">
        <label htmlFor="reports-client-select">{t('reports.page.clientLabel')}</label>
        <select
          id="reports-client-select"
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
      {selectedClientId && <ClientMetrics clientId={selectedClientId} />}
    </div>
  );
};

export default ReportsSection;
