export type Language = 'pt' | 'en';

export const DEFAULT_LANGUAGE: Language = 'en';

export const LANGUAGE_STORAGE_KEY = 'trainer_app_language';

export const isLanguage = (value: string | null | undefined): value is Language => (
  value === 'pt' || value === 'en'
);

export const browserLanguage = (): Language => {
  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
  }
  return DEFAULT_LANGUAGE;
};
