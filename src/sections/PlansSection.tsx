import { useMemo, useState } from 'react';
import type { WorkoutTemplate } from '../types/dashboard';
import { useI18n } from '../hooks/useI18n';

interface PlansSectionProps {
  templates: WorkoutTemplate[];
  isLoading: boolean;
}

const PlansSection: React.FC<PlansSectionProps> = ({ templates, isLoading }) => {
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const totalExercises = templates.reduce((count, template) => count + template.exercises.length, 0);
    const totalSets = templates.reduce(
      (count, template) => count + template.exercises.reduce(
        (exerciseCount, exercise) => exerciseCount + exercise.sets.length,
        0,
      ),
      0,
    );
    return {
      totalTemplates: templates.length,
      totalExercises,
      totalSets,
    };
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((template) => {
      if (template.name.toLowerCase().includes(term)) return true;
      if (template.description?.toLowerCase().includes(term)) return true;
      return template.exercises.some((exercise) => exercise.name.toLowerCase().includes(term));
    });
  }, [templates, search]);

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

  const emptyFilteredState = filteredTemplates.length === 0;

  return (
    <div className="section-panel">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('plans.page.eyebrow')}</p>
          <h2>{t('plans.page.title')}</h2>
        </div>
        <p className="panel__hint">{t('plans.page.subtitle')}</p>
      </div>

      <div className="summary-grid">
        <article className="summary-card">
          <p>{t('plans.page.totalTemplates')}</p>
          <strong>{stats.totalTemplates}</strong>
        </article>
        <article className="summary-card">
          <p>{t('plans.page.totalExercises')}</p>
          <strong>{stats.totalExercises}</strong>
        </article>
        <article className="summary-card">
          <p>{t('plans.page.totalSets')}</p>
          <strong>{stats.totalSets}</strong>
        </article>
      </div>

      <div className="form-field">
        <label htmlFor="plans-search">{t('plans.page.searchLabel')}</label>
        <input
          id="plans-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('plans.page.searchPlaceholder')}
        />
      </div>

      {emptyFilteredState ? (
        <div className="empty-state">
          <p>{t('plans.page.filteredEmpty')}</p>
        </div>
      ) : (
        <div className="plans-grid">
          {filteredTemplates.map((template) => {
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
      )}
    </div>
  );
};

export default PlansSection;
