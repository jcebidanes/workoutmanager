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
import { WEEK_DAY_IDS, UNSCHEDULED_VALUE, type WeekDayId } from '../types/dashboard';
import { useI18n } from '../hooks/useI18n';
import type { TranslationKey } from '../context/I18nContext';
import DashboardSidebar from '../components/dashboard/DashboardSidebar';
import DashboardTopbar from '../components/dashboard/DashboardTopbar';
import TemplateBuilder from '../components/dashboard/TemplateBuilder';
import ClientManagementPanel from '../components/dashboard/ClientManagementPanel';
import ClientListSection, { type WeekDayOption } from '../components/dashboard/ClientListSection';
import CalendarSection, { type CalendarColumn } from '../components/dashboard/CalendarSection';
import QuickActionsMenu from '../components/dashboard/QuickActionsMenu';
import PlansSection from '../sections/PlansSection';
import LibrarySection from '../sections/LibrarySection';
import MessagesSection from '../sections/MessagesSection';
import ReportsSection from '../sections/ReportsSection';
import '../styles/ux.css';

const SIDE_NAV_LINKS: Array<{ id: string; path: string; labelKey: TranslationKey; descriptionKey: TranslationKey }> = [
  { id: 'dashboard', path: '/dashboard', labelKey: 'nav.dashboard', descriptionKey: 'nav.dashboardDescription' },
  { id: 'builder', path: '/builder', labelKey: 'nav.builder', descriptionKey: 'nav.builderDescription' },
  { id: 'clients', path: '/clients', labelKey: 'nav.clients', descriptionKey: 'nav.clientsDescription' },
  { id: 'plans', path: '/plans', labelKey: 'nav.plans', descriptionKey: 'nav.plansDescription' },
  { id: 'library', path: '/library', labelKey: 'nav.library', descriptionKey: 'nav.libraryDescription' },
  { id: 'messages', path: '/messages', labelKey: 'nav.messages', descriptionKey: 'nav.messagesDescription' },
  { id: 'reports', path: '/reports', labelKey: 'nav.reports', descriptionKey: 'nav.reportsDescription' },
] as const;

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
  const { t } = useI18n();
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

  const handleClientFormChange = (field: keyof ClientFormState, value: string) => {
    setClientForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAssignmentFormChange = (field: keyof AssignmentFormState, value: string) => {
    setAssignmentForm((prev) => ({ ...prev, [field]: value }));
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

  const queryClient = useQueryClient();

  const navLinks = useMemo(() => SIDE_NAV_LINKS.map((link) => ({
    id: link.id,
    path: link.path,
    label: t(link.labelKey),
    description: t(link.descriptionKey),
    active: currentSection === link.id,
  })), [currentSection, t]);

  const weekDayOptions: WeekDayOption[] = useMemo(() => WEEK_DAY_IDS.map((dayId) => ({
    value: dayId,
    label: t(`calendar.days.${dayId}` as TranslationKey),
  })), [t]);

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

  const handleSidebarNavigate = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleTemplateFieldChange = (field: 'name' | 'description', value: string) => {
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

  const calendarData: CalendarColumn[] = useMemo(() => (
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

  const handleClientTabChange = (clientId: number, tabId: string) => {
    setClientTabs((prev) => ({ ...prev, [clientId]: tabId }));
  };

  const handleWorkoutScheduleChange = (
    workoutId: number,
    day: WeekDayId | typeof UNSCHEDULED_VALUE,
  ) => {
    setWorkoutSchedule((prev) => ({ ...prev, [workoutId]: day }));
  };

  const handleQuickActionsToggle = () => {
    setQuickActionsOpen((prev) => !prev);
  };

  const handleQuickActionsNewTemplate = () => {
    setQuickActionsOpen(false);
    dispatch({ type: 'RESET_TEMPLATE_FORM' });
  };

  const handleQuickActionsNewClient = () => {
    setQuickActionsOpen(false);
    dispatch({ type: 'RESET_CLIENT_FORM' });
  };

  const handleQuickActionsLogProgress = () => {
    setQuickActionsOpen(false);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const renderMainContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return (
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
          </>
        );
      case 'builder':
        return (
          <TemplateBuilder
            form={templateForm}
            onSubmit={handleTemplateSubmit}
            onFieldChange={handleTemplateFieldChange}
            onExerciseFieldChange={handleExerciseFieldChange}
            onSetFieldChange={handleSetFieldChange}
            onAddExercise={addExercise}
            onRemoveExercise={removeExercise}
            onAddSet={addSet}
            onRemoveSet={removeSet}
            isSaving={isSaving}
          />
        );
      case 'clients':
        return (
          <>
            <div ref={clientsSectionRef}>
              <ClientListSection
                filteredClients={filteredClients}
                hasClients={hasClients}
                clientTabs={clientTabs}
                workoutSchedule={workoutSchedule}
                weekDayOptions={weekDayOptions}
                isSaving={isSaving}
                onTabChange={handleClientTabChange}
                onWorkoutFieldChange={handleClientWorkoutFieldChange}
                onWorkoutExerciseChange={handleClientWorkoutExerciseChange}
                onWorkoutSetChange={handleClientWorkoutSetChange}
                onAddExercise={addClientExercise}
                onAddExerciseSet={addClientExerciseSet}
                onScheduleChange={handleWorkoutScheduleChange}
                onSaveWorkout={handleSaveClientWorkout}
              />
            </div>
            
            <ClientManagementPanel
              clientForm={clientForm}
              assignmentForm={assignmentForm}
              clients={clients}
              templates={templates}
              isSaving={isSaving}
              hasClients={hasClients}
              hasTemplates={hasTemplates}
              onClientFormChange={handleClientFormChange}
              onAssignmentFormChange={handleAssignmentFormChange}
              onClientSubmit={handleClientSubmit}
              onAssignmentSubmit={handleAssignmentSubmit}
            />

            <CalendarSection data={calendarData} />
          </>
        );
      case 'plans':
        return <PlansSection templates={templates} isLoading={templatesPending} />;
      case 'library':
        return <LibrarySection templates={templates} clients={clients} />;
      case 'messages':
        return <MessagesSection clients={clients} />;
      case 'reports':
        return <ReportsSection clients={clients} />;
      default:
        return null;
    }
  };

  const shouldShowQuickActions = currentSection === 'builder' || currentSection === 'clients';

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

  return (
    <div className="app-shell">
      <DashboardSidebar
        brand="CoachFlow"
        links={navLinks}
        quickAgendaTitle={t('sidebar.quickAgendaTitle')}
        quickAgendaBody={t('sidebar.quickAgendaBody')}
        closeLabel={t('sidebar.closeMenu')}
        ariaLabel={t('sidebar.ariaLabel')}
        isOpen={sidebarOpen}
        onNavigate={handleSidebarNavigate}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-shell__main">
        <DashboardTopbar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          userName={user.username}
          onLogout={handleLogout}
        />

        <main className="dashboard">
          {statusMessageKey && (
            <div className="dashboard__status" role="status" aria-live="polite">
              <span className="dashboard__spinner" aria-hidden="true" />
              <span>{t(statusMessageKey)}</span>
            </div>
          )}

          {renderMainContent()}

          {shouldShowQuickActions && (
            <QuickActionsMenu
              isOpen={quickActionsOpen}
              onToggle={handleQuickActionsToggle}
              onNewTemplate={handleQuickActionsNewTemplate}
              onNewClient={handleQuickActionsNewClient}
              onLogProgress={handleQuickActionsLogProgress}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
