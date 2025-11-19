import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchClientMetrics, createClientMetric } from '../api/dashboard';
import type { ClientMetric } from '../types/dashboard';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';

interface ClientMetricsProps {
  clientId: number;
}

const ClientMetrics: React.FC<ClientMetricsProps> = ({ clientId }) => {
  const { token } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    value: '',
    unit: '',
    recordedAt: '',
  });

  const {
    data: metrics = [],
    isPending,
  } = useQuery<ClientMetric[]>({
    queryKey: ['clientMetrics', clientId],
    queryFn: () => fetchClientMetrics(token ?? null, clientId),
    enabled: Boolean(token && clientId),
  });

  const mutation = useMutation({
    mutationFn: () => createClientMetric(token ?? null, clientId, {
      name: form.name,
      value: Number(form.value),
      unit: form.unit || undefined,
      recordedAt: form.recordedAt || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientMetrics', clientId] });
      setForm({
        name: '',
        value: '',
        unit: '',
        recordedAt: '',
      });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.value.trim()) {
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="client-metrics" role="region" aria-live="polite">
      {isPending ? (
        <p>{t('client.metrics.loading')}</p>
      ) : metrics.length === 0 ? (
        <div className="client-placeholder">
          <p>{t('client.metrics.emptyLine1')}</p>
          <p>{t('client.metrics.emptyLine2')}</p>
        </div>
      ) : (
        <ul className="client-metrics__list">
          {metrics.map((metric) => (
            <li key={metric.id} className="client-metrics__item">
              <div>
                <strong>{metric.name}</strong>
                <p>
                  {metric.value}
                  {metric.unit ? ` ${metric.unit}` : ''}
                </p>
              </div>
              <small>{new Date(metric.recordedAt).toLocaleDateString()}</small>
            </li>
          ))}
        </ul>
      )}
      <form className="form client-metrics__form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor={`metric-name-${clientId}`}>{t('client.metrics.nameLabel')}</label>
          <input
            id={`metric-name-${clientId}`}
            type="text"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder={t('client.metrics.namePlaceholder')}
          />
        </div>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor={`metric-value-${clientId}`}>{t('client.metrics.valueLabel')}</label>
            <input
              id={`metric-value-${clientId}`}
              type="number"
              value={form.value}
              onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="form-field">
            <label htmlFor={`metric-unit-${clientId}`}>{t('client.metrics.unitLabel')}</label>
            <input
              id={`metric-unit-${clientId}`}
              type="text"
              value={form.unit}
              onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
              placeholder={t('client.metrics.unitPlaceholder')}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`metric-date-${clientId}`}>{t('client.metrics.recordedAtLabel')}</label>
            <input
              id={`metric-date-${clientId}`}
              type="date"
              value={form.recordedAt}
              onChange={(event) => setForm((prev) => ({ ...prev, recordedAt: event.target.value }))}
            />
          </div>
        </div>
        <div className="form__actions">
          <button type="submit" className="button button--primary" disabled={mutation.isPending}>
            {t('client.metrics.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientMetrics;
