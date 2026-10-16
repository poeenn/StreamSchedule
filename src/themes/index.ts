import { ScheduleTheme, ThemeId } from '../types/theme';
import { cyberNeonTheme } from './cyber-neon';
import { pastelPopTheme } from './pastel-pop';
import { simpleModernTheme } from './simple-modern';
import { darkChicTheme } from './dark-chic';

export * from './cyber-neon';
export * from './pastel-pop';
export * from './simple-modern';
export * from './dark-chic';

export const THEMES: ScheduleTheme[] = [
  cyberNeonTheme,
  pastelPopTheme,
  simpleModernTheme,
  darkChicTheme,
];

export const DEFAULT_THEME: ScheduleTheme = cyberNeonTheme;

export const THEME_MAP: Record<ThemeId, ScheduleTheme> = {
  'cyber-neon': cyberNeonTheme,
  'pastel-pop': pastelPopTheme,
  'simple-modern': simpleModernTheme,
  'dark-chic': darkChicTheme,
};

export function getThemeById(id: string): ScheduleTheme {
  const theme = THEMES.find((t) => t.id === id);
  return theme ?? DEFAULT_THEME;
}
