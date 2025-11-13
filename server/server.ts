import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import type { Knex } from 'knex';
import knex from '../db/db.ts';
import { hashPassword, comparePassword } from '../src/utils/hashPassword.ts';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: number;
  }
}

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

type Queryable = Knex | Knex.Transaction;

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

interface WorkoutTemplateResponse {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  userId: number;
  exercises: ExerciseResponse[];
}

interface ClientWorkoutResponse {
  id: number;
  clientId: number;
  templateId: number | null;
  name: string;
  description: string;
  createdAt: string;
  exercises: ExerciseResponse[];
}

interface ClientResponse {
  id: number;
  userId: number;
  name: string;
  email: string | null;
  createdAt: string;
  workouts: ClientWorkoutResponse[];
}

const requireUser = (req: Request, res: Response, next: NextFunction) => {
  const userIdHeader = req.header('x-user-id');
  const parsedId = userIdHeader ? Number(userIdHeader) : NaN;
  if (!userIdHeader || Number.isNaN(parsedId)) {
    return res.status(401).json({ error: 'x-user-id header is required' });
  }
  req.userId = parsedId;
  return next();
};

const mapTemplateResponse = (
  template: WorkoutTemplateRow,
  exercises: TemplateExerciseRow[],
  sets: TemplateSetRow[],
): WorkoutTemplateResponse => ({
  id: template.id,
  name: template.name,
  description: template.description,
  createdAt: template.created_at,
  userId: template.user_id,
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

const mapClientWorkoutResponse = (
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

const fetchTemplateWithDetails = async (
  templateId: number,
  db: Queryable = knex,
): Promise<WorkoutTemplateResponse | null> => {
  const template = await db<WorkoutTemplateRow>('workout_templates').where({ id: templateId }).first();
  if (!template) {
    return null;
  }

  const exercises = await db<TemplateExerciseRow>('template_exercises')
    .where({ template_id: templateId })
    .orderBy('position', 'asc');
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets = exerciseIds.length
    ? await db<TemplateSetRow>('template_sets')
      .whereIn('exercise_id', exerciseIds)
      .orderBy(['exercise_id', 'set_number'])
    : [];

  return mapTemplateResponse(template, exercises, sets);
};

const fetchTemplatesForUser = async (userId: number): Promise<WorkoutTemplateResponse[]> => {
  const templates = await knex<WorkoutTemplateRow>('workout_templates')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  const results = await Promise.all(templates.map((template) => fetchTemplateWithDetails(template.id)));
  return results.filter((template): template is WorkoutTemplateResponse => Boolean(template));
};

const fetchClientWorkout = async (
  workoutId: number,
  db: Queryable = knex,
): Promise<ClientWorkoutResponse | null> => {
  const workout = await db<ClientWorkoutRow>('client_workouts').where({ id: workoutId }).first();
  if (!workout) {
    return null;
  }

  const exercises = await db<ClientExerciseRow>('client_exercises')
    .where({ client_workout_id: workoutId })
    .orderBy('position', 'asc');
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets = exerciseIds.length
    ? await db<ClientSetRow>('client_sets')
      .whereIn('client_exercise_id', exerciseIds)
      .orderBy(['client_exercise_id', 'set_number'])
    : [];

  return mapClientWorkoutResponse(workout, exercises, sets);
};

const fetchClientWithWorkouts = async (
  clientId: number,
  db: Queryable = knex,
): Promise<ClientResponse | null> => {
  const client = await db<ClientRow>('clients').where({ id: clientId }).first();
  if (!client) {
    return null;
  }

  const workouts = await db<ClientWorkoutRow>('client_workouts')
    .where({ client_id: clientId })
    .orderBy('created_at', 'desc');
  const workoutIds = workouts.map((workout) => workout.id);
  const exercises = workoutIds.length
    ? await db<ClientExerciseRow>('client_exercises')
      .whereIn('client_workout_id', workoutIds)
      .orderBy(['client_workout_id', 'position'])
    : [];
  const exerciseIds = exercises.map((exercise) => exercise.id);
  const sets = exerciseIds.length
    ? await db<ClientSetRow>('client_sets')
      .whereIn('client_exercise_id', exerciseIds)
      .orderBy(['client_exercise_id', 'set_number'])
    : [];

  return {
    id: client.id,
    userId: client.user_id,
    name: client.name,
    email: client.email,
    createdAt: client.created_at,
    workouts: workouts.map((workout) => mapClientWorkoutResponse(workout, exercises, sets)),
  };
};

const fetchClientsForUser = async (userId: number): Promise<ClientResponse[]> => {
  const clients = await knex<ClientRow>('clients')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc');

  const results = await Promise.all(clients.map((client) => fetchClientWithWorkouts(client.id)));
  return results.filter((client): client is ClientResponse => Boolean(client));
};

const verifyClientOwnership = async (
  clientId: number,
  userId: number,
): Promise<ClientRow | undefined> => {
  return knex<ClientRow>('clients')
    .where({ id: clientId, user_id: userId })
    .first();
};

const verifyClientWorkoutOwnership = async (
  clientWorkoutId: number,
  userId: number,
): Promise<ClientWorkoutRow | undefined> => {
  return knex<ClientWorkoutRow>('client_workouts')
    .join('clients', 'client_workouts.client_id', 'clients.id')
    .where('client_workouts.id', clientWorkoutId)
    .where('clients.user_id', userId)
    .select('client_workouts.*')
    .first();
};

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const existingUser = await knex('users').where({ username }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    const hashedPassword = await hashPassword(password);
    const [userId] = await knex('users').insert({ username, password: hashedPassword });
    return res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, username },
    });
  } catch (error) {
    console.error('Registration failed', error);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await knex('users').where({ username }).first();
    if (user && await comparePassword(password, user.password)) {
      return res.json({
        message: 'Login successful',
        user: { id: user.id, username: user.username },
      });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login failed', error);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/templates', requireUser, async (req, res) => {
  try {
    const templates = await fetchTemplatesForUser(req.userId as number);
    return res.json(templates);
  } catch (error) {
    console.error('Failed to load templates', error);
    return res.status(500).json({ error: 'Failed to load templates' });
  }
});

app.post('/templates', requireUser, async (req, res) => {
  const { name, description = '', exercises = [] } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Template name is required' });
  }

  try {
    const newTemplate = await knex.transaction(async (trx) => {
      const [templateId] = await trx('workout_templates').insert({
        user_id: req.userId,
        name,
        description,
      });

      for (let i = 0; i < exercises.length; i += 1) {
        const exercise = exercises[i];
        if (!exercise?.name || !exercise?.muscleGroup || !exercise?.difficultyLevel) {
          continue;
        }
        const [exerciseId] = await trx('template_exercises').insert({
          template_id: templateId,
          name: exercise.name,
          muscle_group: exercise.muscleGroup,
          difficulty_level: exercise.difficultyLevel,
          position: i,
        });

        const exerciseSets = Array.isArray(exercise.sets) ? exercise.sets : [];
        for (let j = 0; j < exerciseSets.length; j += 1) {
          const set = exerciseSets[j];
          await trx('template_sets').insert({
            exercise_id: exerciseId,
            set_number: set?.setNumber ?? j + 1,
            weight: set?.weight ?? 0,
            reps: set?.reps ?? 0,
          });
        }
      }

      return fetchTemplateWithDetails(templateId, trx);
    });

    return res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Failed to create template', error);
    return res.status(500).json({ error: 'Failed to create template' });
  }
});

app.post('/clients', requireUser, async (req, res) => {
  const { name, email } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Client name is required' });
  }

  try {
    const [clientId] = await knex('clients').insert({
      user_id: req.userId,
      name,
      email,
    });
    const client = await fetchClientWithWorkouts(clientId);
    return res.status(201).json(client);
  } catch (error) {
    console.error('Failed to create client', error);
    return res.status(500).json({ error: 'Failed to create client' });
  }
});

app.get('/clients', requireUser, async (req, res) => {
  try {
    const clients = await fetchClientsForUser(req.userId as number);
    return res.json(clients);
  } catch (error) {
    console.error('Failed to load clients', error);
    return res.status(500).json({ error: 'Failed to load clients' });
  }
});

app.post('/clients/:clientId/assign-template', requireUser, async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { templateId } = req.body;

  if (!clientId || !templateId) {
    return res.status(400).json({ error: 'Client and template are required' });
  }

  try {
    const client = await verifyClientOwnership(clientId, req.userId as number);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const template = await fetchTemplateWithDetails(templateId);
    if (!template || template.userId !== req.userId) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const clientWorkout = await knex.transaction(async (trx) => {
      const [clientWorkoutId] = await trx('client_workouts').insert({
        client_id: clientId,
        template_id: templateId,
        name: template.name,
        description: template.description,
      });

      for (let i = 0; i < template.exercises.length; i += 1) {
        const exercise = template.exercises[i];
        const [clientExerciseId] = await trx('client_exercises').insert({
          client_workout_id: clientWorkoutId,
          template_exercise_id: exercise.id,
          name: exercise.name,
          muscle_group: exercise.muscleGroup,
          difficulty_level: exercise.difficultyLevel,
          position: i,
        });

        for (let j = 0; j < exercise.sets.length; j += 1) {
          const set = exercise.sets[j];
          await trx('client_sets').insert({
            client_exercise_id: clientExerciseId,
            set_number: set.setNumber ?? j + 1,
            weight: set.weight ?? 0,
            reps: set.reps ?? 0,
          });
        }
      }

      return fetchClientWorkout(clientWorkoutId, trx);
    });

    return res.status(201).json(clientWorkout);
  } catch (error) {
    console.error('Failed to assign template to client', error);
    return res.status(500).json({ error: 'Failed to assign template to client' });
  }
});

app.put('/client-workouts/:clientWorkoutId', requireUser, async (req, res) => {
  const clientWorkoutId = Number(req.params.clientWorkoutId);
  const { name, description = '', exercises = [] } = req.body;

  if (!clientWorkoutId || !name) {
    return res.status(400).json({ error: 'Workout id and name are required' });
  }

  try {
    const workout = await verifyClientWorkoutOwnership(clientWorkoutId, req.userId as number);
    if (!workout) {
      return res.status(404).json({ error: 'Client workout not found' });
    }

    await knex.transaction(async (trx) => {
      await trx('client_workouts').where({ id: clientWorkoutId }).update({
        name,
        description,
      });

      await trx('client_exercises').where({ client_workout_id: clientWorkoutId }).delete();

      for (let i = 0; i < exercises.length; i += 1) {
        const exercise = exercises[i];
        if (!exercise?.name || !exercise?.muscleGroup || !exercise?.difficultyLevel) {
          continue;
        }

        const [clientExerciseId] = await trx('client_exercises').insert({
          client_workout_id: clientWorkoutId,
          name: exercise.name,
          muscle_group: exercise.muscleGroup,
          difficulty_level: exercise.difficultyLevel,
          position: i,
        });

        const exerciseSets = Array.isArray(exercise.sets) ? exercise.sets : [];
        for (let j = 0; j < exerciseSets.length; j += 1) {
          const set = exerciseSets[j];
          await trx('client_sets').insert({
            client_exercise_id: clientExerciseId,
            set_number: set?.setNumber ?? j + 1,
            weight: set?.weight ?? 0,
            reps: set?.reps ?? 0,
          });
        }
      }
    });

    const updatedWorkout = await fetchClientWorkout(clientWorkoutId);
    return res.json(updatedWorkout);
  } catch (error) {
    console.error('Failed to update client workout', error);
    return res.status(500).json({ error: 'Failed to update client workout' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
