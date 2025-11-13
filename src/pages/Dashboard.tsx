import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = 'http://localhost:3001';

interface WorkoutSet {
  id?: number;
  setNumber: number;
  weight: number;
  reps: number;
}

interface Exercise {
  id?: number;
  name: string;
  muscleGroup: string;
  difficultyLevel: string;
  position?: number;
  sets: WorkoutSet[];
}

interface WorkoutTemplate {
  id: number;
  name: string;
  description: string;
  exercises: Exercise[];
}

interface ClientWorkout {
  id: number;
  clientId: number;
  templateId: number | null;
  name: string;
  description: string;
  exercises: Exercise[];
}

interface ClientRecord {
  id: number;
  name: string;
  email?: string;
  workouts: ClientWorkout[];
}

const buildEmptySet = (setNumber: number = 1): WorkoutSet => ({
  setNumber,
  weight: 0,
  reps: 0,
});

const buildEmptyExercise = (): Exercise => ({
  name: '',
  muscleGroup: '',
  difficultyLevel: 'Beginner',
  sets: [buildEmptySet(1)],
});

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    exercises: [buildEmptyExercise()],
  });
  const [clientForm, setClientForm] = useState({ name: '', email: '' });
  const [assignmentForm, setAssignmentForm] = useState({ clientId: '', templateId: '' });
  const [loading, setLoading] = useState(false);

  const authHeaders: HeadersInit = useMemo(() => (user ? {
    'Content-Type': 'application/json',
    'x-user-id': String(user.id),
  } : { 'Content-Type': 'application/json' }), [user]);

  const loadTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error('Unable to load templates');
      }
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error(error);
    }
  }, [authHeaders, user]);

  const loadClients = useCallback(async () => {
    if (!user) return;
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        headers: authHeaders,
      });
      if (!response.ok) {
        throw new Error('Unable to load clients');
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error(error);
    }
  }, [authHeaders, user]);

  useEffect(() => {
    if (!user) {
      return;
    }
    const fetchData = async () => {
      await Promise.all([loadTemplates(), loadClients()]);
    };
    fetchData();
  }, [loadClients, loadTemplates, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTemplateFieldChange = (field: string, value: string) => {
    setTemplateForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateExercise = (index: number, updatedExercise: Exercise) => {
    setTemplateForm((prev) => {
      const exercises = prev.exercises.map((exercise, idx) => (
        idx === index ? updatedExercise : exercise
      ));
      return { ...prev, exercises };
    });
  };

  const handleExerciseFieldChange = (
    exerciseIndex: number,
    field: keyof Exercise,
    value: string,
  ) => {
    const exercise = templateForm.exercises[exerciseIndex];
    updateExercise(exerciseIndex, { ...exercise, [field]: value });
  };

  const handleSetFieldChange = (
    exerciseIndex: number,
    setIndex: number,
    field: 'setNumber' | 'weight' | 'reps',
    value: string,
  ) => {
    const exercise = templateForm.exercises[exerciseIndex];
    const numericValue = Number(value);
    const sets = exercise.sets.map((set, idx) => (
      idx === setIndex ? { ...set, [field]: numericValue } : set
    ));
    updateExercise(exerciseIndex, { ...exercise, sets });
  };

  const addExercise = () => {
    setTemplateForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, buildEmptyExercise()],
    }));
  };

  const removeExercise = (index: number) => {
    setTemplateForm((prev) => {
      const exercises = prev.exercises.filter((_, idx) => idx !== index);
      return {
        ...prev,
        exercises: exercises.length ? exercises : [buildEmptyExercise()],
      };
    });
  };

  const addSet = (exerciseIndex: number) => {
    const exercise = templateForm.exercises[exerciseIndex];
    updateExercise(exerciseIndex, {
      ...exercise,
      sets: [...exercise.sets, buildEmptySet(exercise.sets.length + 1)],
    });
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const exercise = templateForm.exercises[exerciseIndex];
    const sets = exercise.sets.filter((_, idx) => idx !== setIndex);
    updateExercise(exerciseIndex, {
      ...exercise,
      sets: sets.length ? sets : [buildEmptySet(1)],
    });
  };

  const handleTemplateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(templateForm),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? 'Failed to create template');
      }
      setTemplateForm({
        name: '',
        description: '',
        exercises: [buildEmptyExercise()],
      });
      await loadTemplates();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleClientSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !clientForm.name) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/clients`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(clientForm),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? 'Failed to create client');
      }
      setClientForm({ name: '', email: '' });
      await loadClients();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !assignmentForm.clientId || !assignmentForm.templateId) {
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/clients/${assignmentForm.clientId}/assign-template`,
        {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ templateId: Number(assignmentForm.templateId) }),
        },
      );
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? 'Failed to assign template');
      }
      setAssignmentForm({ clientId: '', templateId: '' });
      await loadClients();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateClientWorkout = (
    clientId: number,
    workoutId: number,
    updater: (workout: ClientWorkout) => ClientWorkout,
  ) => {
    setClients((prev) => prev.map((client) => {
      if (client.id !== clientId) {
        return client;
      }
      return {
        ...client,
        workouts: client.workouts.map((workout) => (
          workout.id === workoutId ? updater(workout) : workout
        )),
      };
    }));
  };

  const handleClientWorkoutSetChange = (
    clientId: number,
    workoutId: number,
    exerciseIndex: number,
    setIndex: number,
    field: 'setNumber' | 'weight' | 'reps',
    value: string,
  ) => {
    updateClientWorkout(clientId, workoutId, (workout) => {
      const exercises = workout.exercises.map((exercise, idx) => {
        if (idx !== exerciseIndex) {
          return exercise;
        }
        const sets = exercise.sets.map((set, sIdx) => (
          sIdx === setIndex ? { ...set, [field]: Number(value) } : set
        ));
        return { ...exercise, sets };
      });
      return { ...workout, exercises };
    });
  };

  const handleClientWorkoutExerciseChange = (
    clientId: number,
    workoutId: number,
    exerciseIndex: number,
    field: keyof Exercise,
    value: string,
  ) => {
    updateClientWorkout(clientId, workoutId, (workout) => {
      const exercises = workout.exercises.map((exercise, idx) => (
        idx === exerciseIndex ? { ...exercise, [field]: value } : exercise
      ));
      return { ...workout, exercises };
    });
  };

  const handleClientWorkoutFieldChange = (
    clientId: number,
    workoutId: number,
    field: 'name' | 'description',
    value: string,
  ) => {
    updateClientWorkout(clientId, workoutId, (workout) => ({
      ...workout,
      [field]: value,
    }));
  };

  const addClientExercise = (clientId: number, workoutId: number) => {
    updateClientWorkout(clientId, workoutId, (workout) => ({
      ...workout,
      exercises: [...workout.exercises, buildEmptyExercise()],
    }));
  };

  const addClientExerciseSet = (clientId: number, workoutId: number, exerciseIndex: number) => {
    updateClientWorkout(clientId, workoutId, (workout) => {
      const exercises = workout.exercises.map((exercise, idx) => {
        if (idx !== exerciseIndex) {
          return exercise;
        }
        return {
          ...exercise,
          sets: [...exercise.sets, buildEmptySet(exercise.sets.length + 1)],
        };
      });
      return { ...workout, exercises };
    });
  };

  const handleSaveClientWorkout = async (clientId: number, workout: ClientWorkout) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/client-workouts/${workout.id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: workout.name,
          description: workout.description,
          exercises: workout.exercises,
        }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? 'Failed to update workout');
      }
      await loadClients();
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div>
        <h2>Dashboard</h2>
        <p>You are not logged in.</p>
        <button type="button" onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div>
      <header>
        <h2>Trainer Dashboard</h2>
        <p>Welcome, {user.username}</p>
        <button type="button" onClick={handleLogout}>Logout</button>
      </header>

      <section>
        <h3>Create Workout Template</h3>
        <form onSubmit={handleTemplateSubmit}>
          <div>
            <label htmlFor="templateName">Template Name</label>
            <input
              id="templateName"
              type="text"
              value={templateForm.name}
              onChange={(event) => handleTemplateFieldChange('name', event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="templateDescription">Description</label>
            <textarea
              id="templateDescription"
              value={templateForm.description}
              onChange={(event) => handleTemplateFieldChange('description', event.target.value)}
            />
          </div>
          {templateForm.exercises.map((exercise, exerciseIndex) => (
            <div key={`exercise-${exerciseIndex}`} style={{ border: '1px solid #ccc', marginBottom: '1rem', padding: '1rem' }}>
              <h4>
                Exercise
                {' '}
                {exerciseIndex + 1}
              </h4>
              <div>
                <label htmlFor={`exercise-name-${exerciseIndex}`}>Name</label>
                <input
                  id={`exercise-name-${exerciseIndex}`}
                  type="text"
                  value={exercise.name}
                  onChange={(event) => handleExerciseFieldChange(exerciseIndex, 'name', event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor={`exercise-muscle-${exerciseIndex}`}>Muscle Group</label>
                <input
                  id={`exercise-muscle-${exerciseIndex}`}
                  type="text"
                  value={exercise.muscleGroup}
                  onChange={(event) => handleExerciseFieldChange(exerciseIndex, 'muscleGroup', event.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor={`exercise-level-${exerciseIndex}`}>Difficulty</label>
                <select
                  id={`exercise-level-${exerciseIndex}`}
                  value={exercise.difficultyLevel}
                  onChange={(event) => handleExerciseFieldChange(exerciseIndex, 'difficultyLevel', event.target.value)}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <h5>Sets</h5>
                {exercise.sets.map((set, setIndex) => (
                  <div key={`exercise-${exerciseIndex}-set-${setIndex}`} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <label htmlFor={`set-number-${exerciseIndex}-${setIndex}`}>
                      Set #
                      <input
                        id={`set-number-${exerciseIndex}-${setIndex}`}
                        type="number"
                        min={1}
                        value={set.setNumber}
                        onChange={(event) => handleSetFieldChange(exerciseIndex, setIndex, 'setNumber', event.target.value)}
                      />
                    </label>
                    <label htmlFor={`set-weight-${exerciseIndex}-${setIndex}`}>
                      Weight
                      <input
                        id={`set-weight-${exerciseIndex}-${setIndex}`}
                        type="number"
                        min={0}
                        value={set.weight}
                        onChange={(event) => handleSetFieldChange(exerciseIndex, setIndex, 'weight', event.target.value)}
                      />
                    </label>
                    <label htmlFor={`set-reps-${exerciseIndex}-${setIndex}`}>
                      Reps
                      <input
                        id={`set-reps-${exerciseIndex}-${setIndex}`}
                        type="number"
                        min={0}
                        value={set.reps}
                        onChange={(event) => handleSetFieldChange(exerciseIndex, setIndex, 'reps', event.target.value)}
                      />
                    </label>
                    <button type="button" onClick={() => removeSet(exerciseIndex, setIndex)}>Remove Set</button>
                  </div>
                ))}
                <button type="button" onClick={() => addSet(exerciseIndex)}>Add Set</button>
              </div>
              <button type="button" onClick={() => removeExercise(exerciseIndex)}>Remove Exercise</button>
            </div>
          ))}
          <button type="button" onClick={addExercise}>Add Exercise</button>
          <button type="submit" disabled={loading}>Save Template</button>
        </form>
      </section>

      <section>
        <h3>Existing Templates</h3>
        {templates.length === 0 && <p>No templates created yet.</p>}
        {templates.map((template) => (
          <div key={template.id} style={{ borderBottom: '1px solid #ddd', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h4>{template.name}</h4>
            <p>{template.description}</p>
            {template.exercises.map((exercise) => (
              <div key={exercise.id ?? exercise.name}>
                <strong>{exercise.name}</strong>
                {' '}
                (
                {exercise.muscleGroup}
                ,
                {' '}
                {exercise.difficultyLevel}
                )
                <ul>
                  {exercise.sets.map((set) => (
                    <li key={set.id ?? `${exercise.name}-set-${set.setNumber}`}>
                      Set
                      {' '}
                      {set.setNumber}
                      :
                      {' '}
                      {set.weight}
                      {' '}
                      lbs x
                      {' '}
                      {set.reps}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </section>

      <section>
        <h3>Create Client</h3>
        <form onSubmit={handleClientSubmit}>
          <div>
            <label htmlFor="clientName">Client Name</label>
            <input
              id="clientName"
              type="text"
              value={clientForm.name}
              onChange={(event) => setClientForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </div>
          <div>
            <label htmlFor="clientEmail">Email (optional)</label>
            <input
              id="clientEmail"
              type="email"
              value={clientForm.email}
              onChange={(event) => setClientForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
          <button type="submit" disabled={loading}>Save Client</button>
        </form>
      </section>

      <section>
        <h3>Assign Template to Client</h3>
        <form onSubmit={handleAssignmentSubmit}>
          <div>
            <label htmlFor="assignmentClient">Client</label>
            <select
              id="assignmentClient"
              value={assignmentForm.clientId}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, clientId: event.target.value }))}
              required
            >
              <option value="">Select client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="assignmentTemplate">Template</label>
            <select
              id="assignmentTemplate"
              value={assignmentForm.templateId}
              onChange={(event) => setAssignmentForm((prev) => ({ ...prev, templateId: event.target.value }))}
              required
            >
              <option value="">Select template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={loading || templates.length === 0 || clients.length === 0}>
            Assign Template
          </button>
        </form>
      </section>

      <section>
        <h3>Clients & Customized Workouts</h3>
        {clients.length === 0 && <p>No clients yet.</p>}
        {clients.map((client) => (
          <div key={client.id} style={{ border: '1px solid #eee', padding: '1rem', marginBottom: '1.5rem' }}>
            <h4>{client.name}</h4>
            <p>{client.email || 'No email on file'}</p>
            {client.workouts.length === 0 && <p>No workouts assigned.</p>}
            {client.workouts.map((workout) => (
              <div key={workout.id} style={{ borderTop: '1px solid #ddd', marginTop: '1rem', paddingTop: '1rem' }}>
                <label htmlFor={`workout-name-${workout.id}`}>Workout Name</label>
                <input
                  id={`workout-name-${workout.id}`}
                  type="text"
                  value={workout.name}
                  onChange={(event) => handleClientWorkoutFieldChange(client.id, workout.id, 'name', event.target.value)}
                />
                <label htmlFor={`workout-description-${workout.id}`}>Description</label>
                <textarea
                  id={`workout-description-${workout.id}`}
                  value={workout.description}
                  onChange={(event) => handleClientWorkoutFieldChange(client.id, workout.id, 'description', event.target.value)}
                />
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <div key={`${workout.id}-exercise-${exerciseIndex}`} style={{ border: '1px solid #ccc', margin: '1rem 0', padding: '0.5rem' }}>
                    <h5>
                      Exercise
                      {' '}
                      {exerciseIndex + 1}
                    </h5>
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(event) => handleClientWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'name', event.target.value)}
                      placeholder="Exercise name"
                    />
                    <input
                      type="text"
                      value={exercise.muscleGroup}
                      onChange={(event) => handleClientWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'muscleGroup', event.target.value)}
                      placeholder="Muscle group"
                    />
                    <select
                      value={exercise.difficultyLevel}
                      onChange={(event) => handleClientWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'difficultyLevel', event.target.value)}
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                    <div>
                      {exercise.sets.map((set, setIndex) => (
                        <div key={`${workout.id}-exercise-${exerciseIndex}-set-${setIndex}`} style={{ display: 'flex', gap: '0.5rem', margin: '0.5rem 0' }}>
                          <label htmlFor={`client-set-number-${workout.id}-${exerciseIndex}-${setIndex}`}>
                            Set #
                            <input
                              id={`client-set-number-${workout.id}-${exerciseIndex}-${setIndex}`}
                              type="number"
                              min={1}
                              value={set.setNumber}
                              onChange={(event) => handleClientWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'setNumber', event.target.value)}
                            />
                          </label>
                          <label htmlFor={`client-set-weight-${workout.id}-${exerciseIndex}-${setIndex}`}>
                            Weight
                            <input
                              id={`client-set-weight-${workout.id}-${exerciseIndex}-${setIndex}`}
                              type="number"
                              min={0}
                              value={set.weight}
                              onChange={(event) => handleClientWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'weight', event.target.value)}
                            />
                          </label>
                          <label htmlFor={`client-set-reps-${workout.id}-${exerciseIndex}-${setIndex}`}>
                            Reps
                            <input
                              id={`client-set-reps-${workout.id}-${exerciseIndex}-${setIndex}`}
                              type="number"
                              min={0}
                              value={set.reps}
                              onChange={(event) => handleClientWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'reps', event.target.value)}
                            />
                          </label>
                        </div>
                      ))}
                      <button type="button" onClick={() => addClientExerciseSet(client.id, workout.id, exerciseIndex)}>
                        Add Set
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addClientExercise(client.id, workout.id)}>
                  Add Exercise
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveClientWorkout(client.id, workout)}
                  disabled={loading}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Save Workout
                </button>
              </div>
            ))}
          </div>
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
