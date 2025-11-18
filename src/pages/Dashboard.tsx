import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/ux.css';

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

  const stats = useMemo(() => {
    const totalWorkouts = clients.reduce((count, client) => count + client.workouts.length, 0);
    const totalExercises = clients.reduce(
      (exerciseCount, client) => exerciseCount + client.workouts.reduce(
        (workoutCount, workout) => workoutCount + workout.exercises.length,
        0,
      ),
      0,
    );
    return {
      templates: templates.length,
      clients: clients.length,
      workouts: totalWorkouts,
      exercises: totalExercises,
    };
  }, [clients, templates]);

  const hasTemplates = templates.length > 0;
  const hasClients = clients.length > 0;

  const authHeaders = useMemo<HeadersInit>(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (user) {
      headers['x-user-id'] = String(user.id);
    }
    return headers;
  }, [user]);

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

  const handleSaveClientWorkout = async (workout: ClientWorkout) => {
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
    <main className="dashboard">
      {loading && (
        <div className="dashboard__status" role="status" aria-live="polite">
          <span className="dashboard__spinner" aria-hidden="true" />
          <span>Saving changes…</span>
        </div>
      )}

      <header className="dashboard__hero">
        <div>
          <p className="dashboard__tagline">Trainer workspace</p>
          <h1>Trainer Dashboard</h1>
          <p className="dashboard__welcome">
            Welcome back,
            {' '}
            <strong>{user.username}</strong>
          </p>
        </div>
        <button type="button" className="button button--ghost" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <section className="dashboard__stats" aria-label="Workspace summary">
        <article className="stat-card">
          <p>Templates</p>
          <strong>{stats.templates}</strong>
        </article>
        <article className="stat-card">
          <p>Clients</p>
          <strong>{stats.clients}</strong>
        </article>
        <article className="stat-card">
          <p>Assigned Workouts</p>
          <strong>{stats.workouts}</strong>
        </article>
        <article className="stat-card">
          <p>Tracked Exercises</p>
          <strong>{stats.exercises}</strong>
        </article>
      </section>

      <div className="dashboard__grid">
        <section className="panel panel--primary">
          <div className="panel__header">
            <div>
              <p className="panel__eyebrow">Template builder</p>
              <h2>Create workout template</h2>
            </div>
            <p className="panel__hint">Craft reusable building blocks for client programs.</p>
          </div>
          <form className="form" onSubmit={handleTemplateSubmit}>
            <div className="form-field">
              <label htmlFor="templateName">Template name</label>
              <input
                id="templateName"
                type="text"
                value={templateForm.name}
                onChange={(event) => handleTemplateFieldChange('name', event.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="templateDescription">Description</label>
              <textarea
                id="templateDescription"
                value={templateForm.description}
                placeholder="Optional summary clients will see"
                onChange={(event) => handleTemplateFieldChange('description', event.target.value)}
              />
            </div>
            {templateForm.exercises.map((exercise, exerciseIndex) => (
              <div className="exercise-card" key={`exercise-${exerciseIndex}`}>
                <div className="exercise-card__header">
                  <h3>
                    Exercise
                    {' '}
                    {exerciseIndex + 1}
                  </h3>
                  <button
                    type="button"
                    className="button button--text"
                    onClick={() => removeExercise(exerciseIndex)}
                    disabled={templateForm.exercises.length === 1}
                  >
                    Remove
                  </button>
                </div>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor={`exercise-name-${exerciseIndex}`}>Name</label>
                    <input
                      id={`exercise-name-${exerciseIndex}`}
                      type="text"
                      value={exercise.name}
                      onChange={(event) => handleExerciseFieldChange(exerciseIndex, 'name', event.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`exercise-muscle-${exerciseIndex}`}>Muscle group</label>
                    <input
                      id={`exercise-muscle-${exerciseIndex}`}
                      type="text"
                      value={exercise.muscleGroup}
                      onChange={(event) => handleExerciseFieldChange(exerciseIndex, 'muscleGroup', event.target.value)}
                      required
                    />
                  </div>
                  <div className="form-field">
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
                </div>
                <div className="sets">
                  <div className="sets__header">
                    <h4>Sets</h4>
                    <button
                      type="button"
                      className="button button--text"
                      onClick={() => addSet(exerciseIndex)}
                    >
                      + Add set
                    </button>
                  </div>
                  {exercise.sets.map((set, setIndex) => (
                    <div className="set-row" key={`exercise-${exerciseIndex}-set-${setIndex}`}>
                      <div className="form-field">
                        <label htmlFor={`set-number-${exerciseIndex}-${setIndex}`}>Set #</label>
                        <input
                          id={`set-number-${exerciseIndex}-${setIndex}`}
                          type="number"
                          min={1}
                          value={set.setNumber}
                          onChange={(event) => handleSetFieldChange(exerciseIndex, setIndex, 'setNumber', event.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`set-weight-${exerciseIndex}-${setIndex}`}>Weight</label>
                        <input
                          id={`set-weight-${exerciseIndex}-${setIndex}`}
                          type="number"
                          min={0}
                          value={set.weight}
                          onChange={(event) => handleSetFieldChange(exerciseIndex, setIndex, 'weight', event.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`set-reps-${exerciseIndex}-${setIndex}`}>Reps</label>
                        <input
                          id={`set-reps-${exerciseIndex}-${setIndex}`}
                          type="number"
                          min={0}
                          value={set.reps}
                          onChange={(event) => handleSetFieldChange(exerciseIndex, setIndex, 'reps', event.target.value)}
                        />
                      </div>
                      <button
                        type="button"
                        className="button button--text"
                        onClick={() => removeSet(exerciseIndex, setIndex)}
                        disabled={exercise.sets.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="form__actions">
              <button type="button" className="button button--subtle" onClick={addExercise}>
                + Add exercise
              </button>
              <button type="submit" className="button button--primary" disabled={loading}>
                Save template
              </button>
            </div>
          </form>
        </section>

        <section className="panel panel--secondary">
          <div className="stack-card">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Client onboarding</p>
                <h2>Add client</h2>
              </div>
              <p className="panel__hint">Capture their details to keep their programs synced.</p>
            </div>
            <form className="form" onSubmit={handleClientSubmit}>
              <div className="form-field">
                <label htmlFor="clientName">Client name</label>
                <input
                  id="clientName"
                  type="text"
                  value={clientForm.name}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="clientEmail">Client email (optional)</label>
                <input
                  id="clientEmail"
                  type="email"
                  value={clientForm.email}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </div>
              <div className="form__actions">
                <button type="submit" className="button button--primary" disabled={loading}>
                  Add client
                </button>
              </div>
            </form>
          </div>

          <div className="stack-card">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">Assignment</p>
                <h2>Assign template</h2>
              </div>
              <p className="panel__hint">Pair a template with an existing client.</p>
            </div>
            <form className="form" onSubmit={handleAssignmentSubmit}>
              <div className="form-field">
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
              <div className="form-field">
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
              {!hasClients && (
                <p className="empty-hint">Add a client to enable assignments.</p>
              )}
              {!hasTemplates && (
                <p className="empty-hint">At least one template is required.</p>
              )}
              <div className="form__actions">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={loading || !hasClients || !hasTemplates}
                >
                  Assign template
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>

      <section className="panel panel--list">
        <div className="panel__header">
          <div>
            <p className="panel__eyebrow">Coaching</p>
            <h2>Clients & customized workouts</h2>
          </div>
          <p className="panel__hint">Adjust workouts inline and keep progress up to date.</p>
        </div>
        {!hasClients && (
          <div className="empty-state">
            <p>No clients yet.</p>
            <p>Add a client to start planning workouts.</p>
          </div>
        )}
        {clients.map((client) => (
          <article className="client-card" key={client.id}>
            <div className="client-card__header">
              <div>
                <h3>{client.name}</h3>
                <p className="client-card__meta">{client.email || 'No email on file'}</p>
              </div>
              <span className="client-card__badge">
                {client.workouts.length}
                {' '}
                {client.workouts.length === 1 ? 'workout' : 'workouts'}
              </span>
            </div>
            {client.workouts.length === 0 && (
              <p className="empty-hint">No workouts assigned yet.</p>
            )}
            {client.workouts.map((workout) => (
              <div className="workout-card" key={workout.id}>
                <div className="form-field">
                  <label htmlFor={`workout-name-${workout.id}`}>Workout name</label>
                  <input
                    id={`workout-name-${workout.id}`}
                    type="text"
                    value={workout.name}
                    onChange={(event) => handleClientWorkoutFieldChange(client.id, workout.id, 'name', event.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor={`workout-description-${workout.id}`}>Description</label>
                  <textarea
                    id={`workout-description-${workout.id}`}
                    value={workout.description}
                    onChange={(event) => handleClientWorkoutFieldChange(client.id, workout.id, 'description', event.target.value)}
                  />
                </div>
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <div className="exercise-card exercise-card--nested" key={`${workout.id}-exercise-${exerciseIndex}`}>
                    <div className="exercise-card__header">
                      <h4>
                        Exercise
                        {' '}
                        {exerciseIndex + 1}
                      </h4>
                    </div>
                    <div className="form-grid">
                      <div className="form-field">
                        <label htmlFor={`${workout.id}-exercise-name-${exerciseIndex}`}>Name</label>
                        <input
                          id={`${workout.id}-exercise-name-${exerciseIndex}`}
                          type="text"
                          value={exercise.name}
                          onChange={(event) => handleClientWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'name', event.target.value)}
                          placeholder="Exercise name"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`${workout.id}-exercise-muscle-${exerciseIndex}`}>Muscle group</label>
                        <input
                          id={`${workout.id}-exercise-muscle-${exerciseIndex}`}
                          type="text"
                          value={exercise.muscleGroup}
                          onChange={(event) => handleClientWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'muscleGroup', event.target.value)}
                          placeholder="Muscle group"
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`${workout.id}-exercise-level-${exerciseIndex}`}>Difficulty</label>
                        <select
                          id={`${workout.id}-exercise-level-${exerciseIndex}`}
                          value={exercise.difficultyLevel}
                          onChange={(event) => handleClientWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'difficultyLevel', event.target.value)}
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                    <div className="sets sets--compact">
                      {exercise.sets.map((set, setIndex) => (
                        <div className="set-row" key={`${workout.id}-exercise-${exerciseIndex}-set-${setIndex}`}>
                          <div className="form-field">
                            <label htmlFor={`client-set-number-${workout.id}-${exerciseIndex}-${setIndex}`}>Set #</label>
                            <input
                              id={`client-set-number-${workout.id}-${exerciseIndex}-${setIndex}`}
                              type="number"
                              min={1}
                              value={set.setNumber}
                              onChange={(event) => handleClientWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'setNumber', event.target.value)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`client-set-weight-${workout.id}-${exerciseIndex}-${setIndex}`}>Weight</label>
                            <input
                              id={`client-set-weight-${workout.id}-${exerciseIndex}-${setIndex}`}
                              type="number"
                              min={0}
                              value={set.weight}
                              onChange={(event) => handleClientWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'weight', event.target.value)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`client-set-reps-${workout.id}-${exerciseIndex}-${setIndex}`}>Reps</label>
                            <input
                              id={`client-set-reps-${workout.id}-${exerciseIndex}-${setIndex}`}
                              type="number"
                              min={0}
                              value={set.reps}
                              onChange={(event) => handleClientWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'reps', event.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="button button--subtle"
                        onClick={() => addClientExerciseSet(client.id, workout.id, exerciseIndex)}
                      >
                        + Add set
                      </button>
                    </div>
                  </div>
                ))}
                <div className="form__actions">
                  <button
                    type="button"
                    className="button button--subtle"
                    onClick={() => addClientExercise(client.id, workout.id)}
                  >
                    + Add exercise
                  </button>
                  <button
                    type="button"
                    className="button button--primary"
                    onClick={() => handleSaveClientWorkout(workout)}
                    disabled={loading}
                  >
                    Save workout
                  </button>
                </div>
              </div>
            ))}
          </article>
        ))}
      </section>
    </main>

  );
};

export default Dashboard;
