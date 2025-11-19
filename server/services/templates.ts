import type { Knex } from 'knex';
import knex from './db.ts';

interface WorkoutTemplateRow {
  id: number;
  user_id: number;
  name: string;
  description: string;
  created_at: string;
}

interface TemplateExerciseRow {
  id: number;
  template_id: number;
  name: string;
  muscle_group: string;
  difficulty_level: string;
  position: number;
}

interface TemplateSetRow {
  id: number;
  exercise_id: number;
  set_number: number;
  weight: number;
  reps: number;
}

interface WorkoutSetResponse {
  id: number;
  setNumber: number;
  weight: number;
  reps: number;
}

interface ExerciseResponse {
  id: number;
  name: string;
  muscleGroup: string;
  difficultyLevel: string;
  position: number;
  sets: WorkoutSetResponse[];
}

export interface WorkoutTemplateResponse {
  id: number;
  userId: number;
  name: string;
  description: string;
  createdAt: string;
  exercises: ExerciseResponse[];
}

const mapTemplate = (
  template: WorkoutTemplateRow,
  exercises: TemplateExerciseRow[],
  sets: TemplateSetRow[],
): WorkoutTemplateResponse => ({
  id: template.id,
  userId: template.user_id,
  name: template.name,
  description: template.description,
  createdAt: template.created_at,
  exercises: exercises
    .filter((exercise) => exercise.template_id === template.id)
    .sort((a, b) => a.position - b.position)
    .map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscle_group,
      difficultyLevel: exercise.difficulty_level,
      position: exercise.position,
      sets: sets
        .filter((set) => set.exercise_id === exercise.id)
        .sort((a, b) => a.set_number - b.set_number)
        .map((set) => ({
          id: set.id,
          setNumber: set.set_number,
          weight: set.weight,
          reps: set.reps,
        })),
    })),
});

export const fetchTemplateWithDetails = async (
  templateId: number,
  db: Knex | Knex.Transaction = knex,
): Promise<WorkoutTemplateResponse | null> => {
  const template = await db<WorkoutTemplateRow>('workout_templates').where({ id: templateId }).first();
  if (!template) {
    return null;
  }

  const exercises = await db<TemplateExerciseRow>('template_exercises')
    .where({ template_id: template.id });
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets = exerciseIds.length
    ? await db<TemplateSetRow>('template_sets').whereIn('exercise_id', exerciseIds)
    : [];

  return mapTemplate(template, exercises, sets);
};

export const fetchTemplatesForUser = async (userId: number): Promise<WorkoutTemplateResponse[]> => {
  const templates = await knex<WorkoutTemplateRow>('workout_templates')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  if (templates.length === 0) {
    return [];
  }

  const templateIds = templates.map((template) => template.id);

  const exercises = await knex<TemplateExerciseRow>('template_exercises')
    .whereIn('template_id', templateIds);

  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets = exerciseIds.length
    ? await knex<TemplateSetRow>('template_sets').whereIn('exercise_id', exerciseIds)
    : [];

  return templates.map((template) => mapTemplate(template, exercises, sets));
};
