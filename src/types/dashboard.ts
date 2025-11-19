export interface WorkoutSet {
  id?: number;
  setNumber: number;
  weight: number;
  reps: number;
}

export interface Exercise {
  id?: number;
  name: string;
  muscleGroup: string;
  difficultyLevel: string;
  position?: number;
  sets: WorkoutSet[];
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  description: string;
  createdAt?: string;
  userId?: number;
  exercises: Exercise[];
}

export interface ClientWorkout {
  id: number;
  clientId: number;
  templateId: number | null;
  name: string;
  description: string;
  createdAt?: string;
  exercises: Exercise[];
}

export interface ClientRecord {
  id: number;
  name: string;
  email?: string | null;
  workouts: ClientWorkout[];
}

export interface TemplateFormState {
  name: string;
  description: string;
  exercises: Exercise[];
}

export interface ClientFormState {
  name: string;
  email: string;
}

export interface AssignmentFormState {
  clientId: string;
  templateId: string;
}

export interface ClientMessage {
  id: number;
  clientId: number;
  content: string;
  createdAt: string;
}

export interface ClientMetric {
  id: number;
  clientId: number;
  name: string;
  value: number;
  unit?: string | null;
  recordedAt: string;
  createdAt: string;
}
