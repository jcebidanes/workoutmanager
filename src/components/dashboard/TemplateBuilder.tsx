import type { FC } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { Exercise, TemplateFormState } from '../../types/dashboard';

interface TemplateBuilderProps {
  form: TemplateFormState;
  onSubmit: (event: React.FormEvent) => void;
  onFieldChange: (field: 'name' | 'description', value: string) => void;
  onExerciseFieldChange: (exerciseIndex: number, field: keyof Exercise, value: string) => void;
  onSetFieldChange: (
    exerciseIndex: number,
    setIndex: number,
    field: 'setNumber' | 'weight' | 'reps',
    value: string,
  ) => void;
  onAddExercise: () => void;
  onRemoveExercise: (index: number) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  isSaving: boolean;
}

const TemplateBuilder: FC<TemplateBuilderProps> = ({
  form,
  onSubmit,
  onFieldChange,
  onExerciseFieldChange,
  onSetFieldChange,
  onAddExercise,
  onRemoveExercise,
  onAddSet,
  onRemoveSet,
  isSaving,
}) => {
  const { t } = useI18n();

  return (
    <section className="panel panel--primary">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('templates.eyebrow')}</p>
          <h2>{t('templates.title')}</h2>
        </div>
        <p className="panel__hint">{t('templates.hint')}</p>
      </div>
      <form className="form" onSubmit={onSubmit}>
        <div className="form-field">
          <label htmlFor="templateName">{t('templates.nameLabel')}</label>
          <input
            id="templateName"
            type="text"
            value={form.name}
            onChange={(event) => onFieldChange('name', event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="templateDescription">{t('templates.descriptionLabel')}</label>
          <textarea
            id="templateDescription"
            value={form.description}
            placeholder={t('templates.descriptionPlaceholder')}
            onChange={(event) => onFieldChange('description', event.target.value)}
          />
        </div>
        {form.exercises.map((exercise, exerciseIndex) => (
          <div className="exercise-card" key={`exercise-${exerciseIndex}`}>
            <div className="exercise-card__header">
              <h3>
                {t('templates.exerciseHeading')}
                {' '}
                {exerciseIndex + 1}
              </h3>
              <button
                type="button"
                className="button button--text"
                onClick={() => onRemoveExercise(exerciseIndex)}
              >
                {t('templates.removeExercise')}
              </button>
            </div>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor={`exercise-name-${exerciseIndex}`}>{t('templates.nameLabel')}</label>
                <input
                  id={`exercise-name-${exerciseIndex}`}
                  type="text"
                  value={exercise.name}
                  onChange={(event) => onExerciseFieldChange(exerciseIndex, 'name', event.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor={`exercise-muscle-${exerciseIndex}`}>{t('templates.muscleGroupLabel')}</label>
                <input
                  id={`exercise-muscle-${exerciseIndex}`}
                  type="text"
                  value={exercise.muscleGroup}
                  onChange={(event) => onExerciseFieldChange(exerciseIndex, 'muscleGroup', event.target.value)}
                />
              </div>
              <div className="form-field">
                <label htmlFor={`exercise-level-${exerciseIndex}`}>{t('templates.difficultyLabel')}</label>
                <select
                  id={`exercise-level-${exerciseIndex}`}
                  value={exercise.difficultyLevel}
                  onChange={(event) => onExerciseFieldChange(exerciseIndex, 'difficultyLevel', event.target.value)}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
            <div className="form-field">
              <h4>{t('templates.setsTitle')}</h4>
              {exercise.sets.map((set, setIndex) => (
                <div key={`set-${exerciseIndex}-${setIndex}`} className="set-row">
                  <div className="form-field">
                    <label htmlFor={`set-number-${exerciseIndex}-${setIndex}`}>{t('templates.setNumber')}</label>
                    <input
                      id={`set-number-${exerciseIndex}-${setIndex}`}
                      type="number"
                      value={set.setNumber}
                      onChange={(event) => onSetFieldChange(exerciseIndex, setIndex, 'setNumber', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`set-weight-${exerciseIndex}-${setIndex}`}>{t('templates.weight')}</label>
                    <input
                      id={`set-weight-${exerciseIndex}-${setIndex}`}
                      type="number"
                      value={set.weight}
                      onChange={(event) => onSetFieldChange(exerciseIndex, setIndex, 'weight', event.target.value)}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`set-reps-${exerciseIndex}-${setIndex}`}>{t('templates.reps')}</label>
                    <input
                      id={`set-reps-${exerciseIndex}-${setIndex}`}
                      type="number"
                      value={set.reps}
                      onChange={(event) => onSetFieldChange(exerciseIndex, setIndex, 'reps', event.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="button button--text"
                    onClick={() => onRemoveSet(exerciseIndex, setIndex)}
                  >
                    {t('templates.removeSet')}
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="button button--subtle"
                onClick={() => onAddSet(exerciseIndex)}
              >
                {t('templates.addSet')}
              </button>
            </div>
          </div>
        ))}
        <div className="form__actions">
          <button
            type="button"
            className="button button--subtle"
            onClick={onAddExercise}
          >
            {t('templates.addExercise')}
          </button>
          <button type="submit" className="button button--primary" disabled={isSaving}>
            {t('templates.save')}
          </button>
        </div>
      </form>
    </section>
  );
};

export default TemplateBuilder;
