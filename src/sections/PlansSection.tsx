import type { WorkoutTemplate } from '../types/dashboard';
import { useI18n } from '../hooks/useI18n';

interface PlansSectionProps {
  templates: WorkoutTemplate[];
  isLoading: boolean;
}

const PlansSection: React.FC<PlansSectionProps> = ({ templates, isLoading }) => {
  const { t } = useI18n();

  if (isLoading) {
    return <p>{t('plans.page.loading')}</p>;
  }

  if (templates.length === 0) {
    return (
      <div className="section-panel">
        <h2>{t('plans.page.title')}</h2>
        <p className="panel__hint">{t('plans.page.subtitle')}</p>
        <div className="empty-state">
          <p>{t('plans.page.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-panel">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('plans.page.eyebrow')}</p>
          <h2>{t('plans.page.title')}</h2>
        </div>
        <p className="panel__hint">{t('plans.page.subtitle')}</p>
      </div>
      <div className="plans-grid">
        {templates.map((template) => {
          const totalSets = template.exercises.reduce((count, exercise) => count + exercise.sets.length, 0);
          return (
            <article key={template.id} className="plan-card">
              <header>
                <p className="panel__eyebrow">{t('plans.page.planLabel')}</p>
                <h3>{template.name}</h3>
                {template.description && <p>{template.description}</p>}
              </header>
              <ul>
                <li>
                  <strong>{template.exercises.length}</strong>
                  <span>{t('plans.page.exerciseCount')}</span>
                </li>
                <li>
                  <strong>{totalSets}</strong>
                  <span>{t('plans.page.setCount')}</span>
                </li>
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default PlansSection;
