import React, {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTemplates,
  fetchClients,
  createTemplate,
  createClient,
  assignTemplate,
  updateClientWorkout as updateClientWorkoutRequest,
} from '../api/dashboard';
import type {
  ClientRecord,
  WorkoutTemplate,
  ClientWorkout,
  Exercise,
  WorkoutSet,
  TemplateFormState,
  ClientFormState,
  AssignmentFormState,
} from '../types/dashboard';
import { useI18n } from '../hooks/useI18n';
import type { TranslationKey } from '../context/I18nContext';
import type { Language } from '../types/language';
import ClientMessages from '../components/ClientMessages';
import ClientMetrics from '../components/ClientMetrics';
import PlansSection from '../sections/PlansSection';
import LibrarySection from '../sections/LibrarySection';
import MessagesSection from '../sections/MessagesSection';
import ReportsSection from '../sections/ReportsSection';
import '../styles/ux.css';

const SIDE_NAV_LINKS: Array<{ id: string; path: string; labelKey: TranslationKey; descriptionKey: TranslationKey }> = [
  { id: 'dashboard', path: '/dashboard', labelKey: 'nav.dashboard', descriptionKey: 'nav.dashboardDescription' },
  { id: 'clients', path: '/clients', labelKey: 'nav.clients', descriptionKey: 'nav.clientsDescription' },
  { id: 'plans', path: '/plans', labelKey: 'nav.plans', descriptionKey: 'nav.plansDescription' },
  { id: 'library', path: '/library', labelKey: 'nav.library', descriptionKey: 'nav.libraryDescription' },
  { id: 'messages', path: '/messages', labelKey: 'nav.messages', descriptionKey: 'nav.messagesDescription' },
  { id: 'reports', path: '/reports', labelKey: 'nav.reports', descriptionKey: 'nav.reportsDescription' },
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

const cloneClients = (records: ClientRecord[]): ClientRecord[] => records.map((client) => ({
  ...client,
  workouts: client.workouts.map((workout) => ({
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set })),
    })),
  })),
}));

interface DashboardUIState {
  templateForm: TemplateFormState;
  clientForm: ClientFormState;
  assignmentForm: AssignmentFormState;
  quickActionsOpen: boolean;
  sidebarOpen: boolean;
  clientTabs: Record<number, string>;
  workoutSchedule: Record<number, WeekDayId | typeof UNSCHEDULED_VALUE>;
  searchTerm: string;
}

type DashboardAction =
  | { type: 'SET_TEMPLATE_FORM'; updater: (prev: TemplateFormState) => TemplateFormState }
  | { type: 'SET_CLIENT_FORM'; updater: (prev: ClientFormState) => ClientFormState }
  | { type: 'SET_ASSIGNMENT_FORM'; updater: (prev: AssignmentFormState) => AssignmentFormState }
  | { type: 'RESET_TEMPLATE_FORM' }
  | { type: 'RESET_CLIENT_FORM' }
  | { type: 'RESET_ASSIGNMENT_FORM' }
  | { type: 'SET_QUICK_ACTIONS'; value: boolean }
  | { type: 'SET_SIDEBAR'; value: boolean }
  | { type: 'SET_CLIENT_TABS'; value: Record<number, string> }
  | { type: 'SET_WORKOUT_SCHEDULE'; value: Record<number, WeekDayId | typeof UNSCHEDULED_VALUE> }
  | { type: 'SET_SEARCH_TERM'; value: string };

const initialTemplateForm = (): TemplateFormState => ({
  name: '',
  description: '',
  exercises: [buildEmptyExercise()],
});

const initialState: DashboardUIState = {
  templateForm: initialTemplateForm(),
  clientForm: { name: '', email: '' },
  assignmentForm: { clientId: '', templateId: '' },
  quickActionsOpen: false,
  sidebarOpen: false,
  clientTabs: {},
  workoutSchedule: {},
  searchTerm: '',
};

const dashboardReducer = (state: DashboardUIState, action: DashboardAction): DashboardUIState => {
  switch (action.type) {
    case 'SET_TEMPLATE_FORM':
      return { ...state, templateForm: action.updater(state.templateForm) };
    case 'SET_CLIENT_FORM':
      return { ...state, clientForm: action.updater(state.clientForm) };
    case 'SET_ASSIGNMENT_FORM':
      return { ...state, assignmentForm: action.updater(state.assignmentForm) };
    case 'RESET_TEMPLATE_FORM':
      return { ...state, templateForm: initialTemplateForm() };
    case 'RESET_CLIENT_FORM':
      return { ...state, clientForm: { name: '', email: '' } };
    case 'RESET_ASSIGNMENT_FORM':
      return { ...state, assignmentForm: { clientId: '', templateId: '' } };
    case 'SET_QUICK_ACTIONS':
      return { ...state, quickActionsOpen: action.value };
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.value };
    case 'SET_CLIENT_TABS':
      return { ...state, clientTabs: action.value };
    case 'SET_WORKOUT_SCHEDULE':
      return { ...state, workoutSchedule: action.value };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.value };
    default:
      return state;
  }
};

const Dashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { t, language, setLanguage } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const clientsSectionRef = useRef<HTMLDivElement | null>(null);
  const [uiState, dispatch] = useReducer(dashboardReducer, initialState);
  const {
    templateForm,
    clientForm,
    assignmentForm,
    quickActionsOpen,
    sidebarOpen,
    clientTabs,
    workoutSchedule,
    searchTerm,
  } = uiState;
  const setTemplateForm = (next: TemplateFormState | ((prev: TemplateFormState) => TemplateFormState)) => {
    const updater = typeof next === 'function'
      ? next as (prev: TemplateFormState) => TemplateFormState
      : () => next;
    dispatch({ type: 'SET_TEMPLATE_FORM', updater });
  };

  const setClientForm = (next: ClientFormState | ((prev: ClientFormState) => ClientFormState)) => {
    const updater = typeof next === 'function'
      ? next as (prev: ClientFormState) => ClientFormState
      : () => next;
    dispatch({ type: 'SET_CLIENT_FORM', updater });
  };

  const setAssignmentForm = (next: AssignmentFormState | ((prev: AssignmentFormState) => AssignmentFormState)) => {
    const updater = typeof next === 'function'
      ? next as (prev: AssignmentFormState) => AssignmentFormState
      : () => next;
    dispatch({ type: 'SET_ASSIGNMENT_FORM', updater });
  };

  const setQuickActionsOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === 'function'
      ? next(quickActionsOpen)
      : next;
    dispatch({ type: 'SET_QUICK_ACTIONS', value });
  };

  const setSidebarOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const value = typeof next === 'function'
      ? next(sidebarOpen)
      : next;
    dispatch({ type: 'SET_SIDEBAR', value });
  };

  const setClientTabs = (updater: (prev: Record<number, string>) => Record<number, string>) => {
    dispatch({ type: 'SET_CLIENT_TABS', value: updater(clientTabs) });
  };

  const setWorkoutSchedule = (
    updater: (prev: Record<number, WeekDayId | typeof UNSCHEDULED_VALUE>) => Record<number, WeekDayId | typeof UNSCHEDULED_VALUE>,
  ) => {
    dispatch({ type: 'SET_WORKOUT_SCHEDULE', value: updater(workoutSchedule) });
  };

  const setSearchTerm = (value: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', value });
  };

  const currentSection = useMemo(() => {
    const match = SIDE_NAV_LINKS.find((link) => link.path === location.pathname);
    return match?.id ?? 'dashboard';
  }, [location.pathname]);

  const isMainSection = currentSection === 'dashboard' || currentSection === 'clients';

  const queryClient = useQueryClient();

  const { data: templates = [], isPending: templatesPending } = useQuery<WorkoutTemplate[]>({
    queryKey: ['templates', user?.id],
    queryFn: () => fetchTemplates(token ?? null),
    enabled: Boolean(user && token),
  });

  const { data: clientsData = [], isPending: clientsPending } = useQuery<ClientRecord[]>({
    queryKey: ['clients', user?.id],
    queryFn: () => fetchClients(token ?? null),
    enabled: Boolean(user && token),
  });

  useEffect(() => {
    if (clientsData) {
      setClients(cloneClients(clientsData));
    }
  }, [clientsData]);

  useEffect(() => {
    const nextTabs: Record<number, string> = {};
    clients.forEach((client) => {
      nextTabs[client.id] = clientTabs[client.id] ?? 'overview';
    });
    dispatch({ type: 'SET_CLIENT_TABS', value: nextTabs });
  }, [clients]);

  useEffect(() => {
    const nextSchedule: Record<number, WeekDayId | typeof UNSCHEDULED_VALUE> = { ...workoutSchedule };
    clients.forEach((client) => {
      client.workouts.forEach((workout) => {
        if (!nextSchedule[workout.id]) {
          nextSchedule[workout.id] = UNSCHEDULED_VALUE;
        }
      });
    });
    dispatch({ type: 'SET_WORKOUT_SCHEDULE', value: nextSchedule });
  }, [clients]);

  useEffect(() => {
    if (currentSection === 'clients' && clientsSectionRef.current) {
      clientsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentSection]);

  const templateMutation = useMutation({
    mutationFn: (payload: TemplateFormState) => createTemplate(token ?? null, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates', user?.id] });
      dispatch({ type: 'RESET_TEMPLATE_FORM' });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const clientMutation = useMutation({
    mutationFn: (payload: ClientFormState) => createClient(token ?? null, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      dispatch({ type: 'RESET_CLIENT_FORM' });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const assignTemplateMutation = useMutation({
    mutationFn: (payload: { clientId: string; templateId: number }) => assignTemplate(token ?? null, payload.clientId, payload.templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
      dispatch({ type: 'RESET_ASSIGNMENT_FORM' });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const saveWorkoutMutation = useMutation({
    mutationFn: (workout: ClientWorkout) => updateClientWorkoutRequest(token ?? null, workout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients', user?.id] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const isSaving = templateMutation.isPending
    || clientMutation.isPending
    || assignTemplateMutation.isPending
    || saveWorkoutMutation.isPending;
  const isLoadingData = templatesPending || clientsPending;
  const statusMessageKey: TranslationKey | null = isSaving
    ? 'status.saving'
    : (isLoadingData ? 'status.loading' : null);

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

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return clients;
    }
    const term = searchTerm.toLowerCase();
    return clients.filter((client) => (
      client.name.toLowerCase().includes(term)
      || (client.email ?? '').toLowerCase().includes(term)
    ));
  }, [clients, searchTerm]);


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

  const handleTemplateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    templateMutation.mutate(templateForm);
  };

  const handleClientSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !clientForm.name) return;
    clientMutation.mutate(clientForm);
  };

  const handleAssignmentSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !assignmentForm.clientId || !assignmentForm.templateId) {
      return;
    }
    assignTemplateMutation.mutate({
      clientId: assignmentForm.clientId,
      templateId: Number(assignmentForm.templateId),
    });
  };

  const updateClientWorkoutDraft = (
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
    updateClientWorkoutDraft(clientId, workoutId, (workout) => {
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
    updateClientWorkoutDraft(clientId, workoutId, (workout) => {
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
    updateClientWorkoutDraft(clientId, workoutId, (workout) => ({
      ...workout,
      [field]: value,
    }));
  };

  const addClientExercise = (clientId: number, workoutId: number) => {
    updateClientWorkoutDraft(clientId, workoutId, (workout) => ({
      ...workout,
      exercises: [...workout.exercises, buildEmptyExercise()],
    }));
  };

  const addClientExerciseSet = (clientId: number, workoutId: number, exerciseIndex: number) => {
    updateClientWorkoutDraft(clientId, workoutId, (workout) => {
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

  const handleSaveClientWorkout = (workout: ClientWorkout) => {
    if (!user) return;
    saveWorkoutMutation.mutate(workout);
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
              className={`sidebar__link ${currentSection === item.id ? 'sidebar__link--active' : ''}`}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
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
          {statusMessageKey && (
            <div className="dashboard__status" role="status" aria-live="polite">
              <span className="dashboard__spinner" aria-hidden="true" />
              <span>{t(statusMessageKey)}</span>
            </div>
          )}

          {isMainSection ? (
            <>
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
                  <button type="submit" className="button button--primary" disabled={isSaving}>
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
                    <button type="submit" className="button button--primary" disabled={isSaving}>
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
                      disabled={isSaving || !hasClients || !hasTemplates}
                    >
                      {t('assignment.submit')}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>

              <section className="panel panel--list" ref={clientsSectionRef}>
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
                        disabled={isSaving}
                      >
                              {t('workout.save')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {activeTab === 'messages' && (
                    <ClientMessages clientId={client.id} />
                  )}
                  {activeTab === 'metrics' && (
                    <ClientMetrics clientId={client.id} />
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
                  dispatch({ type: 'RESET_TEMPLATE_FORM' });
                }}
              >
                {t('fab.newTemplate')}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setQuickActionsOpen(false);
                  dispatch({ type: 'RESET_CLIENT_FORM' });
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
            </>
          ) : currentSection === 'plans' ? (
            <PlansSection templates={templates} isLoading={templatesPending} />
          ) : currentSection === 'library' ? (
            <LibrarySection templates={templates} clients={clients} />
          ) : currentSection === 'messages' ? (
            <MessagesSection clients={clients} />
          ) : (
            <ReportsSection clients={clients} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
