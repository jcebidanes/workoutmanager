import type { FC } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type {
  AssignmentFormState,
  ClientFormState,
  ClientRecord,
  WorkoutTemplate,
} from '../../types/dashboard';

interface ClientManagementPanelProps {
  clientForm: ClientFormState;
  assignmentForm: AssignmentFormState;
  clients: ClientRecord[];
  templates: WorkoutTemplate[];
  isSaving: boolean;
  hasClients: boolean;
  hasTemplates: boolean;
  onClientFormChange: (field: keyof ClientFormState, value: string) => void;
  onAssignmentFormChange: (field: keyof AssignmentFormState, value: string) => void;
  onClientSubmit: (event: React.FormEvent) => void;
  onAssignmentSubmit: (event: React.FormEvent) => void;
}

const ClientManagementPanel: FC<ClientManagementPanelProps> = ({
  clientForm,
  assignmentForm,
  clients,
  templates,
  isSaving,
  hasClients,
  hasTemplates,
  onClientFormChange,
  onAssignmentFormChange,
  onClientSubmit,
  onAssignmentSubmit,
}) => {
  const { t } = useI18n();

  return (
    <section className="panel panel--stack">
      <div className="stack-card">
        <div className="panel__header">
          <div>
            <p className="panel__eyebrow">{t('clients.eyebrow')}</p>
            <h2>{t('clients.title')}</h2>
          </div>
          <p className="panel__hint">{t('clients.hint')}</p>
        </div>
        <form className="form" onSubmit={onClientSubmit}>
          <div className="form-field">
            <label htmlFor="clientName">{t('clients.nameLabel')}</label>
            <input
              id="clientName"
              type="text"
              value={clientForm.name}
              onChange={(event) => onClientFormChange('name', event.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="clientEmail">{t('clients.emailLabel')}</label>
            <input
              id="clientEmail"
              type="email"
              value={clientForm.email}
              onChange={(event) => onClientFormChange('email', event.target.value)}
            />
          </div>
          <div className="form__actions">
            <button type="submit" className="button button--primary" disabled={isSaving}>
              {t('clients.add')}
            </button>
          </div>
        </form>
      </div>

      <div className="stack-card">
        <div className="panel__header">
          <div>
            <p className="panel__eyebrow">{t('assignment.eyebrow')}</p>
            <h2>{t('assignment.title')}</h2>
          </div>
          <p className="panel__hint">{t('assignment.hint')}</p>
        </div>
        <form className="form" onSubmit={onAssignmentSubmit}>
          <div className="form-field">
            <label htmlFor="assignmentClient">{t('assignment.clientLabel')}</label>
            <select
              id="assignmentClient"
              value={assignmentForm.clientId}
              onChange={(event) => onAssignmentFormChange('clientId', event.target.value)}
              required
            >
              <option value="">{t('assignment.clientPlaceholder')}</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="assignmentTemplate">{t('assignment.templateLabel')}</label>
            <select
              id="assignmentTemplate"
              value={assignmentForm.templateId}
              onChange={(event) => onAssignmentFormChange('templateId', event.target.value)}
              required
            >
              <option value="">{t('assignment.templatePlaceholder')}</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
          {!hasClients && (
            <p className="empty-hint">{t('assignment.needClient')}</p>
          )}
          {!hasTemplates && (
            <p className="empty-hint">{t('assignment.needTemplate')}</p>
          )}
          <div className="form__actions">
            <button
              type="submit"
              className="button button--primary"
              disabled={isSaving || !hasClients || !hasTemplates}
            >
              {t('assignment.submit')}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ClientManagementPanel;
