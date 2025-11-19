import type { FC } from 'react';
import { useI18n } from '../../hooks/useI18n';
import type { TranslationKey } from '../../context/I18nContext';
import type {
  ClientRecord,
  ClientWorkout,
  Exercise,
  WeekDayId,
} from '../../types/dashboard';
import { UNSCHEDULED_VALUE } from '../../types/dashboard';
import ClientMessages from '../ClientMessages';
import ClientMetrics from '../ClientMetrics';

export interface WeekDayOption {
  value: WeekDayId | typeof UNSCHEDULED_VALUE;
  label: string;
}

interface ClientListSectionProps {
  filteredClients: ClientRecord[];
  hasClients: boolean;
  clientTabs: Record<number, string>;
  workoutSchedule: Record<number, WeekDayOption['value']>;
  weekDayOptions: WeekDayOption[];
  isSaving: boolean;
  onTabChange: (clientId: number, tabId: string) => void;
  onWorkoutFieldChange: (clientId: number, workoutId: number, field: 'name' | 'description', value: string) => void;
  onWorkoutExerciseChange: (clientId: number, workoutId: number, exerciseIndex: number, field: keyof Exercise, value: string) => void;
  onWorkoutSetChange: (
    clientId: number,
    workoutId: number,
    exerciseIndex: number,
    setIndex: number,
    field: 'setNumber' | 'weight' | 'reps',
    value: string,
  ) => void;
  onAddExercise: (clientId: number, workoutId: number) => void;
  onAddExerciseSet: (clientId: number, workoutId: number, exerciseIndex: number) => void;
  onScheduleChange: (workoutId: number, value: WeekDayOption['value']) => void;
  onSaveWorkout: (workout: ClientWorkout) => void;
}

const ClientListSection: FC<ClientListSectionProps> = ({
  filteredClients,
  hasClients,
  clientTabs,
  workoutSchedule,
  weekDayOptions,
  isSaving,
  onTabChange,
  onWorkoutFieldChange,
  onWorkoutExerciseChange,
  onWorkoutSetChange,
  onAddExercise,
  onAddExerciseSet,
  onScheduleChange,
  onSaveWorkout,
}) => {
  const { t } = useI18n();

  return (
    <section className="panel panel--list">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('coaching.eyebrow')}</p>
          <h2>{t('coaching.title')}</h2>
        </div>
        <p className="panel__hint">{t('coaching.hint')}</p>
      </div>
      {!hasClients && (
        <div className="empty-state">
          <p>{t('coaching.noClients')}</p>
          <p>{t('coaching.addClientPrompt')}</p>
        </div>
      )}
      {filteredClients.map((client) => {
        const activeTab = clientTabs[client.id] ?? 'overview';
        return (
          <article key={client.id} className="client-card">
            <header className="client-card__header">
              <div>
                <h3>{client.name}</h3>
                <p className="client-card__meta">{client.email || t('client.noEmail')}</p>
              </div>
              <span className="client-card__badge">
                {client.workouts.length}
                {' '}
                {t('client.overview.activeWorkouts')}
              </span>
            </header>
            <div className="client-tabs" role="tablist" aria-label={t('client.tabs.ariaLabel')}>
              {['overview', 'workouts', 'messages', 'metrics'].map((tabId) => {
                const labelKey = `client.tabs.${tabId}` as TranslationKey;
                return (
                  <button
                    key={tabId}
                    type="button"
                    className={`client-tabs__tab ${activeTab === tabId ? 'client-tabs__tab--active' : ''}`}
                    onClick={() => onTabChange(client.id, tabId)}
                  >
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
            {activeTab === 'overview' && (
              <div className="client-placeholder">
                <p>
                  {t('client.overview.lastWorkout')}
                  :
                  {' '}
                  {client.workouts[0]?.name ?? t('coaching.noWorkouts')}
                </p>
                <p>{t('client.overview.nextStepHint')}</p>
              </div>
            )}
            {activeTab === 'workouts' && (
              client.workouts.length === 0 ? (
                <p>{t('coaching.noWorkouts')}</p>
              ) : (
                client.workouts.map((workout) => (
                  <div className="workout-card" key={workout.id}>
                    <div className="form-field">
                      <label htmlFor={`${workout.id}-name`}>{t('workout.nameLabel')}</label>
                      <input
                        id={`${workout.id}-name`}
                        type="text"
                        value={workout.name}
                        onChange={(event) => onWorkoutFieldChange(client.id, workout.id, 'name', event.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor={`${workout.id}-description`}>{t('workout.descriptionLabel')}</label>
                      <textarea
                        id={`${workout.id}-description`}
                        value={workout.description}
                        onChange={(event) => onWorkoutFieldChange(client.id, workout.id, 'description', event.target.value)}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor={`${workout.id}-schedule`}>{t('workout.scheduleLabel')}</label>
                      <select
                        id={`${workout.id}-schedule`}
                        value={workoutSchedule[workout.id] ?? UNSCHEDULED_VALUE}
                        onChange={(event) => onScheduleChange(workout.id, event.target.value as WeekDayOption['value'])}
                      >
                        <option value={UNSCHEDULED_VALUE}>{t('workout.schedulePlaceholder')}</option>
                        {weekDayOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    {workout.exercises.map((exercise, exerciseIndex) => (
                      <div key={`${workout.id}-exercise-${exerciseIndex}`} className="exercise-card exercise-card--nested">
                        <div className="form-grid">
                          <div className="form-field">
                            <label htmlFor={`${workout.id}-exercise-name-${exerciseIndex}`}>{t('templates.nameLabel')}</label>
                            <input
                              id={`${workout.id}-exercise-name-${exerciseIndex}`}
                              type="text"
                              value={exercise.name}
                              onChange={(event) => onWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'name', event.target.value)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`${workout.id}-exercise-muscle-${exerciseIndex}`}>{t('templates.muscleGroupLabel')}</label>
                            <input
                              id={`${workout.id}-exercise-muscle-${exerciseIndex}`}
                              type="text"
                              value={exercise.muscleGroup}
                              onChange={(event) => onWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'muscleGroup', event.target.value)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`${workout.id}-exercise-level-${exerciseIndex}`}>{t('templates.difficultyLabel')}</label>
                            <select
                              id={`${workout.id}-exercise-level-${exerciseIndex}`}
                              value={exercise.difficultyLevel}
                              onChange={(event) => onWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'difficultyLevel', event.target.value)}
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
                            <div key={`${workout.id}-set-${exerciseIndex}-${setIndex}`} className="set-row">
                              <div className="form-field">
                                <label htmlFor={`client-set-number-${workout.id}-${exerciseIndex}-${setIndex}`}>{t('templates.setNumber')}</label>
                                <input
                                  id={`client-set-number-${workout.id}-${exerciseIndex}-${setIndex}`}
                                  type="number"
                                  value={set.setNumber}
                                  onChange={(event) => onWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'setNumber', event.target.value)}
                                />
                              </div>
                              <div className="form-field">
                                <label htmlFor={`client-set-weight-${workout.id}-${exerciseIndex}-${setIndex}`}>{t('templates.weight')}</label>
                                <input
                                  id={`client-set-weight-${workout.id}-${exerciseIndex}-${setIndex}`}
                                  type="number"
                                  value={set.weight}
                                  onChange={(event) => onWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'weight', event.target.value)}
                                />
                              </div>
                              <div className="form-field">
                                <label htmlFor={`client-set-reps-${workout.id}-${exerciseIndex}-${setIndex}`}>{t('templates.reps')}</label>
                                <input
                                  id={`client-set-reps-${workout.id}-${exerciseIndex}-${setIndex}`}
                                  type="number"
                                  value={set.reps}
                                  onChange={(event) => onWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'reps', event.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="button button--subtle"
                            onClick={() => onAddExerciseSet(client.id, workout.id, exerciseIndex)}
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
                        onClick={() => onAddExercise(client.id, workout.id)}
                      >
                        {t('workout.addExercise')}
                      </button>
                      <button
                        type="button"
                        className="button button--primary"
                        onClick={() => onSaveWorkout(workout)}
                        disabled={isSaving}
                      >
                        {t('workout.save')}
                      </button>
                    </div>
                  </div>
                ))
              )
            )}
            {activeTab === 'messages' && <ClientMessages clientId={client.id} />}
            {activeTab === 'metrics' && <ClientMetrics clientId={client.id} />}
          </article>
        );
      })}
    </section>
  );
};

export default ClientListSection;
