import type { Knex } from 'knex';
import knex from './db.ts';

interface ClientRow {
  id: number;
  user_id: number;
  name: string;
  email: string | null;
  created_at: string;
}

interface ClientWorkoutRow {
  id: number;
  client_id: number;
  template_id: number | null;
  name: string;
  description: string;
  created_at: string;
}

interface ClientExerciseRow {
  id: number;
  client_workout_id: number;
  template_exercise_id: number | null;
  name: string;
  muscle_group: string;
  difficulty_level: string;
  position: number;
}

interface ClientSetRow {
  id: number;
  client_exercise_id: number;
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

export interface ClientWorkoutResponse {
  id: number;
  clientId: number;
  templateId: number | null;
  name: string;
  description: string;
  createdAt: string;
  exercises: ExerciseResponse[];
}

export interface ClientResponse {
  id: number;
  userId: number;
  name: string;
  email: string | null;
  createdAt: string;
  workouts: ClientWorkoutResponse[];
}

const mapWorkout = (
  workout: ClientWorkoutRow,
  exercises: ClientExerciseRow[],
  sets: ClientSetRow[],
): ClientWorkoutResponse => ({
  id: workout.id,
  clientId: workout.client_id,
  templateId: workout.template_id,
  name: workout.name,
  description: workout.description,
  createdAt: workout.created_at,
  exercises: exercises
    .filter((exercise) => exercise.client_workout_id === workout.id)
    .sort((a, b) => a.position - b.position)
    .map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscle_group,
      difficultyLevel: exercise.difficulty_level,
      position: exercise.position,
      sets: sets
        .filter((set) => set.client_exercise_id === exercise.id)
        .sort((a, b) => a.set_number - b.set_number)
        .map((set) => ({
          id: set.id,
          setNumber: set.set_number,
          weight: set.weight,
          reps: set.reps,
        })),
    })),
});

const mapClient = (
  client: ClientRow,
  workouts: ClientWorkoutRow[],
  exercises: ClientExerciseRow[],
  sets: ClientSetRow[],
): ClientResponse => ({
  id: client.id,
  userId: client.user_id,
  name: client.name,
  email: client.email,
  createdAt: client.created_at,
  workouts: workouts
    .filter((workout) => workout.client_id === client.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((workout) => mapWorkout(workout, exercises, sets)),
});

export const fetchClientsForUser = async (userId: number): Promise<ClientResponse[]> => {
  const clients = await knex<ClientRow>('clients')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  if (clients.length === 0) {
    return [];
  }

  const clientIds = clients.map((client) => client.id);
  const workouts = await knex<ClientWorkoutRow>('client_workouts')
    .whereIn('client_id', clientIds);
  const workoutIds = workouts.map((workout) => workout.id);
  const exercises = workoutIds.length
    ? await knex<ClientExerciseRow>('client_exercises').whereIn('client_workout_id', workoutIds)
    : [];
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets = exerciseIds.length
    ? await knex<ClientSetRow>('client_sets').whereIn('client_exercise_id', exerciseIds)
    : [];

  return clients.map((client) => mapClient(client, workouts, exercises, sets));
};

export const fetchClientWithWorkouts = async (
  clientId: number,
  db: Knex | Knex.Transaction = knex,
): Promise<ClientResponse | null> => {
  const client = await db<ClientRow>('clients').where({ id: clientId }).first();
  if (!client) {
    return null;
  }

  const workouts = await db<ClientWorkoutRow>('client_workouts').where({ client_id: client.id });
  const workoutIds = workouts.map((workout) => workout.id);
  const exercises = workoutIds.length
    ? await db<ClientExerciseRow>('client_exercises').whereIn('client_workout_id', workoutIds)
    : [];
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets = exerciseIds.length
    ? await db<ClientSetRow>('client_sets').whereIn('client_exercise_id', exerciseIds)
    : [];

  return mapClient(client, workouts, exercises, sets);
};

export const verifyClientOwnership = async (clientId: number, userId: number): Promise<boolean> => {
  const client = await knex<ClientRow>('clients')
    .where({ id: clientId, user_id: userId })
    .first();
  return Boolean(client);
};
