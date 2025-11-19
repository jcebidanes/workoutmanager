import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useI18n } from '../hooks/useI18n';
import type { TranslationKey } from '../context/I18nContext';
import type { Language } from '../types/language';
import '../styles/ux.css';

const API_BASE_URL = 'http://localhost:3001';

const SIDE_NAV_LINKS: Array<{ id: string; labelKey: TranslationKey; descriptionKey: TranslationKey }> = [
  { id: 'dashboard', labelKey: 'nav.dashboard', descriptionKey: 'nav.dashboardDescription' },
  { id: 'clients', labelKey: 'nav.clients', descriptionKey: 'nav.clientsDescription' },
  { id: 'plans', labelKey: 'nav.plans', descriptionKey: 'nav.plansDescription' },
  { id: 'library', labelKey: 'nav.library', descriptionKey: 'nav.libraryDescription' },
  { id: 'messages', labelKey: 'nav.messages', descriptionKey: 'nav.messagesDescription' },
  { id: 'reports', labelKey: 'nav.reports', descriptionKey: 'nav.reportsDescription' },
] as const;

const CLIENT_TABS: Array<{ id: string; labelKey: TranslationKey }> = [
  { id: 'overview', labelKey: 'client.tabs.overview' },
  { id: 'workouts', labelKey: 'client.tabs.workouts' },
  { id: 'messages', labelKey: 'client.tabs.messages' },
  { id: 'metrics', labelKey: 'client.tabs.metrics' },
] as const;

const WEEK_DAY_IDS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type WeekDayId = typeof WEEK_DAY_IDS[number];
const UNSCHEDULED_VALUE = 'unscheduled';

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
  const { user, token, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
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
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientTabs, setClientTabs] = useState<Record<number, string>>({});
  const [workoutSchedule, setWorkoutSchedule] = useState<Record<number, WeekDayId | typeof UNSCHEDULED_VALUE>>({});

  const [searchTerm, setSearchTerm] = useState('');
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
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, [token]);

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

  useEffect(() => {
    setClientTabs((prev) => {
      const next = { ...prev };
      let changed = false;
      clients.forEach((client) => {
        if (!next[client.id]) {
          next[client.id] = 'overview';
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [clients]);

  useEffect(() => {
    setWorkoutSchedule((prev) => {
      const next: Record<number, WeekDayId | typeof UNSCHEDULED_VALUE> = { ...prev };
      let changed = false;
      clients.forEach((client) => {
        client.workouts.forEach((workout) => {
          if (!next[workout.id]) {
            next[workout.id] = UNSCHEDULED_VALUE;
            changed = true;
          }
        });
      });
      return changed ? next : prev;
    });
  }, [clients]);

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

  const calendarData = useMemo(() => (
    WEEK_DAY_IDS.map((dayId) => {
      const dayKey = `calendar.days.${dayId}` as TranslationKey;
      const items = clients.flatMap((client) => client.workouts
        .filter((workout) => workoutSchedule[workout.id] === dayId)
        .map((workout) => ({
          client: client.name,
          workout,
        })));
      return {
        dayId,
        dayLabel: t(dayKey),
        items,
      };
    })
  ), [clients, workoutSchedule, t]);

  if (!user) {
    return (
      <div>
        <h2>{t('auth.notLoggedTitle')}</h2>
        <p>{t('auth.notLoggedMessage')}</p>
        <button type="button" onClick={() => navigate('/login')}>
          {t('auth.goToLogin')}
        </button>
      </div>
    );
  }

  const handleClientTabChange = (clientId: number, tabId: string) => {
    setClientTabs((prev) => ({ ...prev, [clientId]: tabId }));
  };

  const handleWorkoutScheduleChange = (
    workoutId: number,
    day: WeekDayId | typeof UNSCHEDULED_VALUE,
  ) => {
    setWorkoutSchedule((prev) => ({ ...prev, [workoutId]: day }));
  };

  return (
    <div className="app-shell">
      <aside className={`app-shell__sidebar ${sidebarOpen ? 'app-shell__sidebar--open' : ''}`}>
        <div className="sidebar__brand">CoachFlow</div>
        <nav className="sidebar__nav" aria-label={t('sidebar.ariaLabel')}>
          {SIDE_NAV_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`sidebar__link ${item.id === 'dashboard' ? 'sidebar__link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{t(item.labelKey)}</span>
              <span className="sidebar__hint">{t(item.descriptionKey)}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <strong>{t('sidebar.quickAgendaTitle')}</strong>
          <p>{t('sidebar.quickAgendaBody')}</p>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label={t('sidebar.closeMenu')}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="app-shell__main">
        <header className="app-shell__topbar">
          <div>
            <p className="dashboard__tagline">{t('topbar.tagline')}</p>
            <h1 className="topbar__title">{t('topbar.title')}</h1>
            <p className="topbar__subtitle">{t('topbar.subtitle')}</p>
          </div>
          <div className="topbar__actions">
            <button
              type="button"
              className="sidebar-toggle"
              aria-label={t('topbar.openMenu')}
              onClick={() => setSidebarOpen((prev) => !prev)}
            >
              ☰
            </button>
            <div className="topbar__search">
              <label htmlFor="global-search" className="sr-only">{t('topbar.searchPlaceholder')}</label>
              <input
                id="global-search"
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t('topbar.searchPlaceholder')}
              />
            </div>
            <button type="button" className="topbar__pill">
              {t('topbar.alerts')}
              <span className="topbar__badge">3</span>
            </button>
            <label htmlFor="language-select" className="sr-only">{t('topbar.languageLabel')}</label>
            <select
              id="language-select"
              className="language-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value as Language)}
            >
              <option value="pt">{t('auth.language.pt')}</option>
              <option value="en">{t('auth.language.en')}</option>
            </select>
            <div className="topbar__user">
              <div>
                <p className="dashboard__welcome">{t('topbar.greeting')},</p>
                <strong>{user.username}</strong>
              </div>
              <button type="button" className="button button--ghost" onClick={handleLogout}>
                {t('topbar.logout')}
              </button>
            </div>
          </div>
        </header>

        <main className="dashboard">
          {loading && (
            <div className="dashboard__status" role="status" aria-live="polite">
              <span className="dashboard__spinner" aria-hidden="true" />
              <span>{t('status.saving')}</span>
            </div>
          )}

          <section className="dashboard__hero">
            <div>
              <h2>{t('dashboard.heroTitle')}</h2>
              <p className="dashboard__welcome">{t('dashboard.heroSubtitle')}</p>
            </div>
            <p className="panel__hint">{t('dashboard.heroHint')}</p>
          </section>

          <section className="dashboard__stats" aria-label="Workspace summary">
            <article className="stat-card">
              <p>{t('stats.templates')}</p>
              <strong>{stats.templates}</strong>
            </article>
            <article className="stat-card">
              <p>{t('stats.clients')}</p>
              <strong>{stats.clients}</strong>
            </article>
            <article className="stat-card">
              <p>{t('stats.workouts')}</p>
              <strong>{stats.workouts}</strong>
            </article>
            <article className="stat-card">
              <p>{t('stats.exercises')}</p>
              <strong>{stats.exercises}</strong>
            </article>
          </section>

          <div className="dashboard__grid">
            <section className="panel panel--primary">
              <div className="panel__header">
                <div>
                  <p className="panel__eyebrow">{t('templates.eyebrow')}</p>
                  <h2>{t('templates.title')}</h2>
                </div>
                <p className="panel__hint">{t('templates.hint')}</p>
              </div>
              <form className="form" onSubmit={handleTemplateSubmit}>
                <div className="form-field">
                  <label htmlFor="templateName">{t('templates.nameLabel')}</label>
                  <input
                    id="templateName"
                    type="text"
                    value={templateForm.name}
                    onChange={(event) => handleTemplateFieldChange('name', event.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="templateDescription">{t('templates.descriptionLabel')}</label>
                  <textarea
                    id="templateDescription"
                    value={templateForm.description}
                    placeholder={t('templates.descriptionPlaceholder')}
                    onChange={(event) => handleTemplateFieldChange('description', event.target.value)}
                  />
                </div>
                {templateForm.exercises.map((exercise, exerciseIndex) => (
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
                        onClick={() => removeExercise(exerciseIndex)}
                        disabled={templateForm.exercises.length === 1}
                      >
                        {t('templates.removeExercise')}
                      </button>
                    </div>
                    <div className="form-grid">
                      <div className="form-field">
                        <label htmlFor={`exercise-name-${exerciseIndex}`}>{t('workout.nameLabel')}</label>
                        <input
                          id={`exercise-name-${exerciseIndex}`}
                          type="text"
                          value={exercise.name}
                          onChange={(event) => handleExerciseFieldChange(exerciseIndex, 'name', event.target.value)}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`exercise-muscle-${exerciseIndex}`}>{t('templates.muscleGroupLabel')}</label>
                        <input
                          id={`exercise-muscle-${exerciseIndex}`}
                          type="text"
                          value={exercise.muscleGroup}
                          onChange={(event) => handleExerciseFieldChange(exerciseIndex, 'muscleGroup', event.target.value)}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor={`exercise-level-${exerciseIndex}`}>{t('templates.difficultyLabel')}</label>
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
                        <h4>{t('templates.setsTitle')}</h4>
                        <button
                          type="button"
                          className="button button--text"
                          onClick={() => addSet(exerciseIndex)}
                        >
                          {t('templates.addSet')}
                        </button>
                      </div>
                      {exercise.sets.map((set, setIndex) => (
                        <div className="set-row" key={`exercise-${exerciseIndex}-set-${setIndex}`}>
                          <div className="form-field">
                            <label htmlFor={`set-number-${exerciseIndex}-${setIndex}`}>{t('templates.setNumber')}</label>
                            <input
                              id={`set-number-${exerciseIndex}-${setIndex}`}
                              type="number"
                              min={1}
                              value={set.setNumber}
                              onChange={(event) => handleSetFieldChange(exerciseIndex, setIndex, 'setNumber', event.target.value)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`set-weight-${exerciseIndex}-${setIndex}`}>{t('templates.weight')}</label>
                            <input
                              id={`set-weight-${exerciseIndex}-${setIndex}`}
                              type="number"
                              min={0}
                              value={set.weight}
                              onChange={(event) => handleSetFieldChange(exerciseIndex, setIndex, 'weight', event.target.value)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`set-reps-${exerciseIndex}-${setIndex}`}>{t('templates.reps')}</label>
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
                            {t('templates.removeSet')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="form__actions">
                  <button type="button" className="button button--subtle" onClick={addExercise}>
                    {t('templates.addExercise')}
                  </button>
                  <button type="submit" className="button button--primary" disabled={loading}>
                    {t('templates.save')}
                  </button>
                </div>
              </form>
            </section>

            <section className="panel panel--secondary">
              <div className="stack-card">
                <div className="panel__header">
                  <div>
                    <p className="panel__eyebrow">{t('clients.eyebrow')}</p>
                    <h2>{t('clients.title')}</h2>
                  </div>
                  <p className="panel__hint">{t('clients.hint')}</p>
                </div>
                <form className="form" onSubmit={handleClientSubmit}>
                  <div className="form-field">
                    <label htmlFor="clientName">{t('clients.nameLabel')}</label>
                    <input
                      id="clientName"
                      type="text"
                      value={clientForm.name}
                      onChange={(event) => setClientForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="clientEmail">{t('clients.emailLabel')}</label>
                    <input
                      id="clientEmail"
                      type="email"
                      value={clientForm.email}
                      onChange={(event) => setClientForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                  </div>
                  <div className="form__actions">
                    <button type="submit" className="button button--primary" disabled={loading}>
                      {t('clients.add')}
                    </button>
                  </div>
                </form>
              </div>

              <div className="stack-card">
                <div className="panel__header">
                  <div>
                    <p className="panel__eyebrow">{t('assignment.eyebrow')}</p>
                    <h2>{t('assignment.title')}</h2>
                  </div>
                  <p className="panel__hint">{t('assignment.hint')}</p>
                </div>
                <form className="form" onSubmit={handleAssignmentSubmit}>
                  <div className="form-field">
                    <label htmlFor="assignmentClient">{t('assignment.clientLabel')}</label>
                    <select
                      id="assignmentClient"
                      value={assignmentForm.clientId}
                      onChange={(event) => setAssignmentForm((prev) => ({ ...prev, clientId: event.target.value }))}
                      required
                    >
                      <option value="">{t('assignment.clientPlaceholder')}</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="assignmentTemplate">{t('assignment.templateLabel')}</label>
                    <select
                      id="assignmentTemplate"
                      value={assignmentForm.templateId}
                      onChange={(event) => setAssignmentForm((prev) => ({ ...prev, templateId: event.target.value }))}
                      required
                    >
                      <option value="">{t('assignment.templatePlaceholder')}</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                  {!hasClients && (
                    <p className="empty-hint">{t('assignment.needClient')}</p>
                  )}
                  {!hasTemplates && (
                    <p className="empty-hint">{t('assignment.needTemplate')}</p>
                  )}
                  <div className="form__actions">
                    <button
                      type="submit"
                      className="button button--primary"
                      disabled={loading || !hasClients || !hasTemplates}
                    >
                      {t('assignment.submit')}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>

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
            {clients.map((client) => {
              const activeTab = clientTabs[client.id] ?? 'overview';
              return (
                <article className="client-card" key={client.id}>
                  <div className="client-card__header">
                  <div>
                    <h3>{client.name}</h3>
                    <p className="client-card__meta">{client.email || t('client.noEmail')}</p>
                  </div>
                  <span className="client-card__badge">
                    {client.workouts.length}
                    {' '}
                    {t('client.tabs.workouts')}
                  </span>
                  </div>
                  <div className="client-tabs" role="tablist" aria-label={t('client.tabs.ariaLabel')}>
                    {CLIENT_TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={`client-tabs__tab ${activeTab === tab.id ? 'client-tabs__tab--active' : ''}`}
                        onClick={() => handleClientTabChange(client.id, tab.id)}
                      >
                        {t(tab.labelKey)}
                      </button>
                    ))}
                  </div>
                  {activeTab === 'overview' && (
                    <div className="client-overview" role="tabpanel">
                      <div className="client-overview__card">
                        <p>{t('client.overview.activeWorkouts')}</p>
                        <strong>{client.workouts.length}</strong>
                      </div>
                      <div className="client-overview__card">
                        <p>{t('client.overview.lastWorkout')}</p>
                        <strong>{client.workouts[client.workouts.length - 1]?.name ?? 'N/A'}</strong>
                      </div>
                      <div className="client-overview__card">
                        <p>{t('client.overview.nextStep')}</p>
                        <span>{t('client.overview.nextStepHint')}</span>
                      </div>
                    </div>
                  )}
                  {activeTab === 'workouts' && (
                    <>
                      {client.workouts.length === 0 && (
                        <p className="empty-hint">{t('coaching.noWorkouts')}</p>
                      )}
                      {client.workouts.map((workout) => (
                        <div className="workout-card" key={workout.id}>
                          <div className="form-field">
                            <label htmlFor={`workout-name-${workout.id}`}>{t('workout.nameLabel')}</label>
                            <input
                              id={`workout-name-${workout.id}`}
                              type="text"
                              value={workout.name}
                              onChange={(event) => handleClientWorkoutFieldChange(client.id, workout.id, 'name', event.target.value)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`workout-description-${workout.id}`}>{t('workout.descriptionLabel')}</label>
                            <textarea
                              id={`workout-description-${workout.id}`}
                              value={workout.description}
                              onChange={(event) => handleClientWorkoutFieldChange(client.id, workout.id, 'description', event.target.value)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`workout-schedule-${workout.id}`}>{t('workout.scheduleLabel')}</label>
                            <select
                              id={`workout-schedule-${workout.id}`}
                              value={workoutSchedule[workout.id] ?? UNSCHEDULED_VALUE}
                              onChange={(event) => handleWorkoutScheduleChange(
                                workout.id,
                                event.target.value as WeekDayId | typeof UNSCHEDULED_VALUE,
                              )}
                            >
                              <option value={UNSCHEDULED_VALUE}>{t('workout.schedulePlaceholder')}</option>
                              {WEEK_DAY_IDS.map((dayId) => {
                                const key = `calendar.days.${dayId}` as TranslationKey;
                                return (
                                  <option key={`${workout.id}-${dayId}`} value={dayId}>
                                    {t(key)}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
                          {workout.exercises.map((exercise, exerciseIndex) => (
                            <div className="exercise-card exercise-card--nested" key={`${workout.id}-exercise-${exerciseIndex}`}>
                              <div className="exercise-card__header">
                                <h4>
                                  {t('templates.exerciseHeading')}
                                  {' '}
                                  {exerciseIndex + 1}
                                </h4>
                              </div>
                              <div className="form-grid">
                                <div className="form-field">
                                  <label htmlFor={`${workout.id}-exercise-name-${exerciseIndex}`}>{t('workout.nameLabel')}</label>
                                  <input
                                    id={`${workout.id}-exercise-name-${exerciseIndex}`}
                                    type="text"
                                    value={exercise.name}
                                    onChange={(event) => handleClientWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'name', event.target.value)}
                                  />
                                </div>
                                <div className="form-field">
                                  <label htmlFor={`${workout.id}-exercise-muscle-${exerciseIndex}`}>{t('templates.muscleGroupLabel')}</label>
                                  <input
                                    id={`${workout.id}-exercise-muscle-${exerciseIndex}`}
                                    type="text"
                                    value={exercise.muscleGroup}
                                    onChange={(event) => handleClientWorkoutExerciseChange(client.id, workout.id, exerciseIndex, 'muscleGroup', event.target.value)}
                                  />
                                </div>
                                <div className="form-field">
                                  <label htmlFor={`${workout.id}-exercise-level-${exerciseIndex}`}>{t('templates.difficultyLabel')}</label>
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
                                      <label htmlFor={`client-set-number-${workout.id}-${exerciseIndex}-${setIndex}`}>{t('templates.setNumber')}</label>
                                      <input
                                        id={`client-set-number-${workout.id}-${exerciseIndex}-${setIndex}`}
                                        type="number"
                                        min={1}
                                        value={set.setNumber}
                                        onChange={(event) => handleClientWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'setNumber', event.target.value)}
                                      />
                                    </div>
                                    <div className="form-field">
                                      <label htmlFor={`client-set-weight-${workout.id}-${exerciseIndex}-${setIndex}`}>{t('templates.weight')}</label>
                                      <input
                                        id={`client-set-weight-${workout.id}-${exerciseIndex}-${setIndex}`}
                                        type="number"
                                        min={0}
                                        value={set.weight}
                                        onChange={(event) => handleClientWorkoutSetChange(client.id, workout.id, exerciseIndex, setIndex, 'weight', event.target.value)}
                                      />
                                    </div>
                                    <div className="form-field">
                                      <label htmlFor={`client-set-reps-${workout.id}-${exerciseIndex}-${setIndex}`}>{t('templates.reps')}</label>
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
                                  {t('templates.addSet')}
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
                              {t('workout.addExercise')}
                            </button>
                            <button
                              type="button"
                              className="button button--primary"
                              onClick={() => handleSaveClientWorkout(workout)}
                              disabled={loading}
                            >
                              {t('workout.save')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {activeTab === 'messages' && (
                    <div className="client-placeholder" role="tabpanel">
                      <p>{t('client.messages.emptyLine1')}</p>
                      <p>{t('client.messages.emptyLine2')}</p>
                    </div>
                  )}
                  {activeTab === 'metrics' && (
                    <div className="client-placeholder" role="tabpanel">
                      <p>{t('client.metrics.emptyLine1')}</p>
                      <p>{t('client.metrics.emptyLine2')}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
          <section className="panel panel--calendar">
            <div className="panel__header">
              <div>
                <p className="panel__eyebrow">{t('calendar.eyebrow')}</p>
                <h2>{t('calendar.title')}</h2>
              </div>
              <p className="panel__hint">{t('calendar.hint')}</p>
            </div>
            <div className="calendar-grid">
              {calendarData.map((column) => (
                <div className="calendar-day" key={column.dayId}>
                  <h4>{column.dayLabel}</h4>
                  {column.items.length === 0 && <p className="calendar-empty">{t('calendar.empty')}</p>}
                  {column.items.map(({ client, workout }) => (
                    <div className="calendar-chip" key={`${workout.id}-${column.dayId}`}>
                      <strong>{workout.name}</strong>
                      <span>{client}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
          <button
            type="button"
            className="fab"
            aria-label={t('fab.ariaLabel')}
            onClick={() => setQuickActionsOpen((prev) => !prev)}
          >
            +
          </button>
          {quickActionsOpen && (
            <div className="fab-menu" role="menu" aria-label={t('fab.menuLabel')}>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setQuickActionsOpen(false);
                  setTemplateForm({ name: '', description: '', exercises: [buildEmptyExercise()] });
                }}
              >
                {t('fab.newTemplate')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setQuickActionsOpen(false);
                  setClientForm({ name: '', email: '' });
                }}
              >
                {t('fab.newClient')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setQuickActionsOpen(false);
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }}
              >
                {t('fab.logProgress')}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
