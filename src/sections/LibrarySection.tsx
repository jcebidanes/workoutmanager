import type { ClientRecord, WorkoutTemplate } from '../types/dashboard';
import { useI18n } from '../hooks/useI18n';

interface LibrarySectionProps {
  templates: WorkoutTemplate[];
  clients: ClientRecord[];
}

type LibraryExercise = {
  name: string;
  muscleGroup: string;
  difficultyLevel: string;
  usageCount: number;
};

const LibrarySection: React.FC<LibrarySectionProps> = ({ templates, clients }) => {
  const { t } = useI18n();
  const exerciseMap = new Map<string, LibraryExercise>();

  templates.forEach((template) => {
    template.exercises.forEach((exercise) => {
      const current = exerciseMap.get(exercise.name);
      exerciseMap.set(exercise.name, {
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        difficultyLevel: exercise.difficultyLevel,
        usageCount: (current?.usageCount ?? 0) + 1,
      });
    });
  });

  clients.forEach((client) => {
    client.workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        const current = exerciseMap.get(exercise.name);
        exerciseMap.set(exercise.name, {
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          difficultyLevel: exercise.difficultyLevel,
          usageCount: (current?.usageCount ?? 0) + 1,
        });
      });
    });
  });

  const exercises = Array.from(exerciseMap.values()).sort((a, b) => b.usageCount - a.usageCount);

  if (exercises.length === 0) {
    return (
      <div className="section-panel">
        <h2>{t('library.page.title')}</h2>
        <p className="panel__hint">{t('library.page.subtitle')}</p>
        <div className="empty-state">
          <p>{t('library.page.empty')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-panel">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('library.page.eyebrow')}</p>
          <h2>{t('library.page.title')}</h2>
        </div>
        <p className="panel__hint">{t('library.page.subtitle')}</p>
      </div>
      <table className="library-table">
        <thead>
          <tr>
            <th>{t('library.page.exerciseColumn')}</th>
            <th>{t('library.page.groupColumn')}</th>
            <th>{t('library.page.levelColumn')}</th>
            <th>{t('library.page.usageColumn')}</th>
          </tr>
        </thead>
        <tbody>
          {exercises.map((exercise) => (
            <tr key={exercise.name}>
              <td>{exercise.name}</td>
              <td>{exercise.muscleGroup || '—'}</td>
              <td>{exercise.difficultyLevel || '—'}</td>
              <td>{exercise.usageCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LibrarySection;
