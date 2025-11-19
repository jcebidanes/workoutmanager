import { useMemo, useState } from 'react';
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
  const [muscleFilter, setMuscleFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');

  const exercises = useMemo(() => {
    const exerciseMap = new Map<string, LibraryExercise>();

    const upsert = (name: string, muscleGroup: string, difficultyLevel: string) => {
      const current = exerciseMap.get(name);
      exerciseMap.set(name, {
        name,
        muscleGroup,
        difficultyLevel,
        usageCount: (current?.usageCount ?? 0) + 1,
      });
    };

    templates.forEach((template) => {
      template.exercises.forEach((exercise) => {
        upsert(exercise.name, exercise.muscleGroup, exercise.difficultyLevel);
      });
    });

    clients.forEach((client) => {
      client.workouts.forEach((workout) => {
        workout.exercises.forEach((exercise) => {
          upsert(exercise.name, exercise.muscleGroup, exercise.difficultyLevel);
        });
      });
    });

    return Array.from(exerciseMap.values()).sort((a, b) => b.usageCount - a.usageCount);
  }, [clients, templates]);

  const muscleGroups = useMemo(
    () => Array.from(new Set(exercises.map((exercise) => exercise.muscleGroup))).sort(),
    [exercises],
  );

  const difficultyLevels = useMemo(
    () => Array.from(new Set(exercises.map((exercise) => exercise.difficultyLevel))).sort(),
    [exercises],
  );

  const filteredExercises = exercises.filter((exercise) => {
    const matchMuscle = muscleFilter === 'all' || exercise.muscleGroup === muscleFilter;
    const matchLevel = levelFilter === 'all' || exercise.difficultyLevel === levelFilter;
    return matchMuscle && matchLevel;
  });

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

  const filteredEmpty = filteredExercises.length === 0;

  return (
    <div className="section-panel">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">{t('library.page.eyebrow')}</p>
          <h2>{t('library.page.title')}</h2>
        </div>
        <p className="panel__hint">{t('library.page.subtitle')}</p>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="library-muscle-filter">{t('library.page.groupFilter')}</label>
          <select
            id="library-muscle-filter"
            value={muscleFilter}
            onChange={(event) => setMuscleFilter(event.target.value)}
          >
            <option value="all">{t('library.page.allOption')}</option>
            {muscleGroups.map((group) => (
              <option key={group} value={group}>{group || t('library.page.unknownValue')}</option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="library-level-filter">{t('library.page.levelFilter')}</label>
          <select
            id="library-level-filter"
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="all">{t('library.page.allOption')}</option>
            {difficultyLevels.map((level) => (
              <option key={level} value={level}>{level || t('library.page.unknownValue')}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredEmpty ? (
        <div className="empty-state">
          <p>{t('library.page.filteredEmpty')}</p>
        </div>
      ) : (
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
            {filteredExercises.map((exercise) => (
              <tr key={`${exercise.name}-${exercise.muscleGroup}`}>
                <td>{exercise.name}</td>
                <td>{exercise.muscleGroup || t('library.page.unknownValue')}</td>
                <td>{exercise.difficultyLevel || t('library.page.unknownValue')}</td>
                <td>{exercise.usageCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LibrarySection;
