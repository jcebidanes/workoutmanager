import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  browserLanguage,
  LANGUAGE_STORAGE_KEY,
  type Language,
  isLanguage,
} from '../types/language';

const translationPt = {
  'sidebar.quickAgendaTitle': 'Agenda rápida',
  'sidebar.quickAgendaBody': 'Planeje e acompanhe seus treinos do dia em um só lugar.',
  'sidebar.ariaLabel': 'Seções principais',
  'sidebar.closeMenu': 'Fechar menu',
  'nav.dashboard': 'Dashboard',
  'nav.dashboardDescription': 'Resumo e ações',
  'nav.clients': 'Clientes',
  'nav.clientsDescription': 'Pessoas que você acompanha',
  'nav.plans': 'Planos',
  'nav.plansDescription': 'Templates e treinos',
  'nav.library': 'Biblioteca',
  'nav.libraryDescription': 'Exercícios e mídias',
  'nav.messages': 'Mensagens',
  'nav.messagesDescription': 'Conversas e check-ins',
  'nav.reports': 'Relatórios',
  'nav.reportsDescription': 'Métricas e progresso',
  'topbar.tagline': 'Central do treinador',
  'topbar.title': 'Painel principal',
  'topbar.subtitle': 'Organize clientes, templates e entregas diárias em um só fluxo.',
  'topbar.searchPlaceholder': 'Buscar cliente, template ou exercício',
  'topbar.alerts': 'Alertas',
  'topbar.languageLabel': 'Idioma',
  'topbar.logout': 'Sair',
  'topbar.greeting': 'Olá',
  'topbar.openMenu': 'Abrir menu',
  'status.saving': 'Salvando alterações…',
  'dashboard.heroTitle': 'Resultados em destaque',
  'dashboard.heroSubtitle': 'Acompanhe seus clientes e personalize treinos diariamente.',
  'dashboard.heroHint': 'Use o menu lateral para navegar entre módulos.',
  'stats.templates': 'Templates',
  'stats.clients': 'Clientes',
  'stats.workouts': 'Treinos atribuídos',
  'stats.exercises': 'Exercícios acompanhados',
  'templates.eyebrow': 'Template builder',
  'templates.title': 'Criar template de treino',
  'templates.hint': 'Crie blocos reutilizáveis para os programas.',
  'templates.nameLabel': 'Nome do template',
  'templates.descriptionLabel': 'Descrição',
  'templates.descriptionPlaceholder': 'Resumo opcional visível aos clientes',
  'templates.muscleGroupLabel': 'Grupo muscular',
  'templates.difficultyLabel': 'Dificuldade',
  'templates.setsTitle': 'Séries',
  'templates.setNumber': 'Série #',
  'templates.weight': 'Peso',
  'templates.reps': 'Repetições',
  'templates.removeSet': 'Remover série',
  'templates.addSet': '+ Adicionar série',
  'templates.removeExercise': 'Remover exercício',
  'templates.addExercise': '+ Adicionar exercício',
  'templates.save': 'Salvar template',
  'templates.exerciseHeading': 'Exercício',
  'clients.eyebrow': 'Onboarding de cliente',
  'clients.title': 'Adicionar cliente',
  'clients.hint': 'Capture detalhes para manter os programas sincronizados.',
  'clients.nameLabel': 'Nome do cliente',
  'clients.emailLabel': 'E-mail do cliente (opcional)',
  'clients.add': 'Adicionar cliente',
  'assignment.eyebrow': 'Atribuição',
  'assignment.title': 'Atribuir template',
  'assignment.hint': 'Associe um template a um cliente.',
  'assignment.clientLabel': 'Cliente',
  'assignment.templateLabel': 'Template',
  'assignment.needClient': 'Adicione um cliente para habilitar as atribuições.',
  'assignment.needTemplate': 'Crie ao menos um template.',
  'assignment.clientPlaceholder': 'Selecione um cliente',
  'assignment.templatePlaceholder': 'Selecione um template',
  'assignment.submit': 'Atribuir template',
  'coaching.eyebrow': 'Coaching',
  'coaching.title': 'Clientes e treinos personalizados',
  'coaching.hint': 'Ajuste os treinos inline e mantenha o progresso atualizado.',
  'coaching.noClients': 'Nenhum cliente ainda.',
  'coaching.addClientPrompt': 'Adicione um cliente para começar a planejar.',
  'coaching.noWorkouts': 'Nenhum treino atribuído ainda.',
  'client.noEmail': 'Sem e-mail cadastrado',
  'client.tabs.overview': 'Resumo',
  'client.tabs.workouts': 'Workouts',
  'client.tabs.messages': 'Mensagens',
  'client.tabs.metrics': 'Métricas',
  'client.tabs.ariaLabel': 'Navegação do cliente',
  'client.overview.activeWorkouts': 'Workouts ativos',
  'client.overview.lastWorkout': 'Último treino',
  'client.overview.nextStep': 'Próximo passo',
  'client.overview.nextStepHint': 'Agende ajustes ou revise métricas.',
  'client.messages.emptyLine1': 'Nenhuma mensagem registrada ainda.',
  'client.messages.emptyLine2': 'Use este espaço para check-ins semanais e feedbacks.',
  'client.metrics.emptyLine1': 'Métricas personalizadas chegarão em breve.',
  'client.metrics.emptyLine2': 'Combine peso corporal, medições e progresso visual.',
  'workout.nameLabel': 'Nome do treino',
  'workout.descriptionLabel': 'Descrição',
  'workout.scheduleLabel': 'Agendar treino',
  'workout.schedulePlaceholder': 'Sem data definida',
  'workout.addExercise': '+ Adicionar exercício',
  'workout.save': 'Salvar treino',
  'calendar.eyebrow': 'Agenda',
  'calendar.title': 'Modo calendário semanal',
  'calendar.hint': 'Distribua treinos nos dias da semana para visualizar a carga.',
  'calendar.empty': 'Nenhum treino agendado.',
  'calendar.days.monday': 'Segunda',
  'calendar.days.tuesday': 'Terça',
  'calendar.days.wednesday': 'Quarta',
  'calendar.days.thursday': 'Quinta',
  'calendar.days.friday': 'Sexta',
  'calendar.days.saturday': 'Sábado',
  'calendar.days.sunday': 'Domingo',
  'calendar.unscheduled': 'Sem data',
  'fab.newTemplate': 'Novo template',
  'fab.newClient': 'Novo cliente',
  'fab.logProgress': 'Registrar progresso',
  'fab.ariaLabel': 'Ações rápidas',
  'fab.menuLabel': 'Atalhos rápidos',
  'auth.notLoggedTitle': 'Dashboard',
  'auth.notLoggedMessage': 'Você não está autenticado.',
  'auth.goToLogin': 'Ir para login',
  'auth.hero.tagline': 'Personal trainer OS',
  'auth.hero.loginTitle': 'Bem-vindo de volta, coach',
  'auth.hero.loginBody': 'Faça login para planejar treinos, atribuir templates e manter cada cliente evoluindo.',
  'auth.hero.registerTitle': 'Crie seu hub de coaching',
  'auth.hero.registerBody': 'Configure sua conta para criar templates, organizar clientes e entregar programas personalizados.',
  'auth.languageLabel': 'Idioma',
  'auth.language.pt': 'Português (BR)',
  'auth.language.en': 'Inglês (UK)',
  'auth.login.title': 'Entrar',
  'auth.login.subtitle': 'Use sua conta de treinador.',
  'auth.login.submit': 'Entrar',
  'auth.login.loading': 'Entrando…',
  'auth.login.switchPrefix': 'Novo por aqui?',
  'auth.login.switchLink': 'Criar conta',
  'auth.register.title': 'Registrar',
  'auth.register.subtitle': 'Comece a criar treinos inteligentes.',
  'auth.register.submit': 'Criar conta',
  'auth.register.loading': 'Criando conta…',
  'auth.register.switchPrefix': 'Já tem conta?',
  'auth.register.switchLink': 'Fazer login',
  'auth.fields.username': 'Usuário',
  'auth.fields.password': 'Senha',
  'auth.errors.missingFields': 'Informe usuário e senha.',
  'auth.errors.invalidCredentials': 'Usuário ou senha inválidos.',
  'auth.errors.generic': 'Não foi possível concluir. Tente novamente.',
} as const;

export type TranslationKey = keyof typeof translationPt;

const translationEn: Record<TranslationKey, string> = {
  'sidebar.quickAgendaTitle': 'Quick agenda',
  'sidebar.quickAgendaBody': 'Plan and track today’s workouts in one spot.',
  'sidebar.ariaLabel': 'Primary sections',
  'sidebar.closeMenu': 'Close menu',
  'nav.dashboard': 'Dashboard',
  'nav.dashboardDescription': 'Summary & actions',
  'nav.clients': 'Clients',
  'nav.clientsDescription': 'People you coach',
  'nav.plans': 'Plans',
  'nav.plansDescription': 'Templates & workouts',
  'nav.library': 'Library',
  'nav.libraryDescription': 'Exercises & media',
  'nav.messages': 'Messages',
  'nav.messagesDescription': 'Chats & check-ins',
  'nav.reports': 'Reports',
  'nav.reportsDescription': 'Metrics & progress',
  'topbar.tagline': 'Coach workspace',
  'topbar.title': 'Main dashboard',
  'topbar.subtitle': 'Organise clients, templates, and deliveries from one flow.',
  'topbar.searchPlaceholder': 'Search client, template, or exercise',
  'topbar.alerts': 'Alerts',
  'topbar.languageLabel': 'Language',
  'topbar.logout': 'Sign out',
  'topbar.greeting': 'Hello',
  'topbar.openMenu': 'Open menu',
  'status.saving': 'Saving changes…',
  'dashboard.heroTitle': 'Highlights',
  'dashboard.heroSubtitle': 'Keep clients progressing with daily personalised workouts.',
  'dashboard.heroHint': 'Use the side menu to move across modules.',
  'stats.templates': 'Templates',
  'stats.clients': 'Clients',
  'stats.workouts': 'Assigned workouts',
  'stats.exercises': 'Tracked exercises',
  'templates.eyebrow': 'Template builder',
  'templates.title': 'Create workout template',
  'templates.hint': 'Craft reusable building blocks for programmes.',
  'templates.nameLabel': 'Template name',
  'templates.descriptionLabel': 'Description',
  'templates.descriptionPlaceholder': 'Optional summary shown to clients',
  'templates.muscleGroupLabel': 'Muscle group',
  'templates.difficultyLabel': 'Difficulty',
  'templates.setsTitle': 'Sets',
  'templates.setNumber': 'Set #',
  'templates.weight': 'Weight',
  'templates.reps': 'Reps',
  'templates.removeSet': 'Remove set',
  'templates.addSet': '+ Add set',
  'templates.removeExercise': 'Remove exercise',
  'templates.addExercise': '+ Add exercise',
  'templates.save': 'Save template',
  'templates.exerciseHeading': 'Exercise',
  'clients.eyebrow': 'Client onboarding',
  'clients.title': 'Add client',
  'clients.hint': 'Capture details to keep programmes in sync.',
  'clients.nameLabel': 'Client name',
  'clients.emailLabel': 'Client email (optional)',
  'clients.add': 'Add client',
  'assignment.eyebrow': 'Assignment',
  'assignment.title': 'Assign template',
  'assignment.hint': 'Pair a template with a client.',
  'assignment.clientLabel': 'Client',
  'assignment.templateLabel': 'Template',
  'assignment.needClient': 'Add a client to enable assignments.',
  'assignment.needTemplate': 'Create at least one template.',
  'assignment.clientPlaceholder': 'Select client',
  'assignment.templatePlaceholder': 'Select template',
  'assignment.submit': 'Assign template',
  'coaching.eyebrow': 'Coaching',
  'coaching.title': 'Clients & customised workouts',
  'coaching.hint': 'Adjust workouts inline and keep progress up to date.',
  'coaching.noClients': 'No clients yet.',
  'coaching.addClientPrompt': 'Add a client to start planning workouts.',
  'coaching.noWorkouts': 'No workouts assigned yet.',
  'client.noEmail': 'No email on file',
  'client.tabs.overview': 'Overview',
  'client.tabs.workouts': 'Workouts',
  'client.tabs.messages': 'Messages',
  'client.tabs.metrics': 'Metrics',
  'client.tabs.ariaLabel': 'Client navigation',
  'client.overview.activeWorkouts': 'Active workouts',
  'client.overview.lastWorkout': 'Last workout',
  'client.overview.nextStep': 'Next step',
  'client.overview.nextStepHint': 'Schedule adjustments or review metrics.',
  'client.messages.emptyLine1': 'No messages recorded yet.',
  'client.messages.emptyLine2': 'Use this space for weekly check-ins and feedback.',
  'client.metrics.emptyLine1': 'Custom metrics coming soon.',
  'client.metrics.emptyLine2': 'Combine body weight, measurements, and visual progress.',
  'workout.nameLabel': 'Workout name',
  'workout.descriptionLabel': 'Description',
  'workout.scheduleLabel': 'Schedule workout',
  'workout.schedulePlaceholder': 'No date set',
  'workout.addExercise': '+ Add exercise',
  'workout.save': 'Save workout',
  'calendar.eyebrow': 'Schedule',
  'calendar.title': 'Weekly calendar view',
  'calendar.hint': 'Spread workouts across the week to see load at a glance.',
  'calendar.empty': 'No workout scheduled.',
  'calendar.days.monday': 'Monday',
  'calendar.days.tuesday': 'Tuesday',
  'calendar.days.wednesday': 'Wednesday',
  'calendar.days.thursday': 'Thursday',
  'calendar.days.friday': 'Friday',
  'calendar.days.saturday': 'Saturday',
  'calendar.days.sunday': 'Sunday',
  'calendar.unscheduled': 'Unscheduled',
  'fab.newTemplate': 'New template',
  'fab.newClient': 'New client',
  'fab.logProgress': 'Log progress',
  'fab.ariaLabel': 'Quick actions',
  'fab.menuLabel': 'Quick shortcuts',
  'auth.notLoggedTitle': 'Dashboard',
  'auth.notLoggedMessage': 'You are not logged in.',
  'auth.goToLogin': 'Go to login',
  'auth.hero.tagline': 'Personal trainer OS',
  'auth.hero.loginTitle': 'Welcome back, coach',
  'auth.hero.loginBody': 'Sign in to plan workouts, assign templates, and keep every client progressing.',
  'auth.hero.registerTitle': 'Create your coaching hub',
  'auth.hero.registerBody': 'Set up your account to craft templates, organise clients, and deliver personalised programmes.',
  'auth.languageLabel': 'Language',
  'auth.language.pt': 'Portuguese (BR)',
  'auth.language.en': 'English (UK)',
  'auth.login.title': 'Sign in',
  'auth.login.subtitle': 'Use your coach account to continue.',
  'auth.login.submit': 'Sign in',
  'auth.login.loading': 'Signing in…',
  'auth.login.switchPrefix': 'New here?',
  'auth.login.switchLink': 'Create an account',
  'auth.register.title': 'Register',
  'auth.register.subtitle': 'Start building smarter training plans today.',
  'auth.register.submit': 'Create account',
  'auth.register.loading': 'Creating account…',
  'auth.register.switchPrefix': 'Already have an account?',
  'auth.register.switchLink': 'Log in',
  'auth.fields.username': 'Username',
  'auth.fields.password': 'Password',
  'auth.errors.missingFields': 'Please enter both username and password.',
  'auth.errors.invalidCredentials': 'Invalid username or password.',
  'auth.errors.generic': 'Unable to complete request. Please try again.',
} as const;

const translations: Record<Language, Record<TranslationKey, string>> = {
  pt: translationPt,
  en: translationEn,
};

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3001';

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const { user, updateUserLanguage } = useAuth();
  const [language, setLanguageState] = useState<Language>(() => {
    if (user?.language && isLanguage(user.language)) {
      return user.language;
    }
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguage(stored)) {
        return stored;
      }
    }
    return browserLanguage();
  });

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    if (user?.language && isLanguage(user.language) && user.language !== language) {
      setLanguageState(user.language);
      localStorage.setItem(LANGUAGE_STORAGE_KEY, user.language);
    }
    if (!user && typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (isLanguage(stored) && stored !== language) {
        setLanguageState(stored);
      }
    }
  }, [user, language]);

  const persistLanguage = async (nextLanguage: Language) => {
    if (nextLanguage === language) {
      return;
    }
    setLanguageState(nextLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);

    if (user) {
      try {
        await fetch(`${API_BASE_URL}/users/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': String(user.id),
          },
          body: JSON.stringify({ language: nextLanguage }),
        });
        updateUserLanguage(nextLanguage);
      } catch (error) {
        console.error('Failed to update language preference', error);
      }
    }
  };

  const value = useMemo(() => ({
    language,
    setLanguage: persistLanguage,
    t: (key: TranslationKey) => translations[language][key] ?? key,
  }), [language]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18nContext = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within an I18nProvider');
  }
  return context;
};
