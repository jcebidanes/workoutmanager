import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import type { ClientMessage } from '../types/dashboard';
import { fetchClientMessages, createClientMessage } from '../api/dashboard';

interface ClientMessagesProps {
  clientId: number;
}

const ClientMessages: React.FC<ClientMessagesProps> = ({ clientId }) => {
  const { token } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const {
    data: messages = [],
    isPending,
  } = useQuery<ClientMessage[]>({
    queryKey: ['clientMessages', clientId],
    queryFn: () => fetchClientMessages(token ?? null, clientId),
    enabled: Boolean(token && clientId),
  });

  const mutation = useMutation({
    mutationFn: (message: string) => createClientMessage(token ?? null, clientId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientMessages', clientId] });
      setContent('');
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!content.trim()) {
      return;
    }
    mutation.mutate(content.trim());
  };

  return (
    <div className="client-messages" role="region" aria-live="polite">
      {isPending ? (
        <p>{t('client.messages.loading')}</p>
      ) : messages.length === 0 ? (
        <div className="client-placeholder">
          <p>{t('client.messages.emptyLine1')}</p>
          <p>{t('client.messages.emptyLine2')}</p>
        </div>
      ) : (
        <ul className="client-messages__list">
          {messages.map((message) => (
            <li key={message.id} className="client-messages__item">
              <p>{message.content}</p>
              <small>{new Date(message.createdAt).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
      <form className="form client-messages__form" onSubmit={handleSubmit}>
        <label htmlFor={`message-content-${clientId}`}>{t('client.messages.inputLabel')}</label>
        <textarea
          id={`message-content-${clientId}`}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t('client.messages.placeholder')}
          rows={3}
        />
        <div className="form__actions">
          <button type="submit" className="button button--primary" disabled={mutation.isPending}>
            {t('client.messages.submit')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientMessages;
