import { ScheduleTheme, ThemeId } from '../types/theme';
import { cyberNeonTheme } from './cyber-neon';
import { pastelPopTheme } from './pastel-pop';
import { simpleModernTheme } from './simple-modern';
import { darkChicTheme } from './dark-chic';
import { sakuraWaTheme } from './sakura-wa';
import { starlightGalaxyTheme } from './starlight-galaxy';
import { cafeNaturalTheme } from './cafe-natural';
import { popComicTheme } from './pop-comic';

export * from './cyber-neon';
export * from './pastel-pop';
export * from './simple-modern';
export * from './dark-chic';
export * from './sakura-wa';
export * from './starlight-galaxy';
export * from './cafe-natural';
export * from './pop-comic';

export const THEMES: ScheduleTheme[] = [
  cyberNeonTheme,
  pastelPopTheme,
  simpleModernTheme,
  darkChicTheme,
  sakuraWaTheme,
  starlightGalaxyTheme,
  cafeNaturalTheme,
  popComicTheme,
];

export const DEFAULT_THEME: ScheduleTheme = cyberNeonTheme;

export const THEME_MAP: Record<ThemeId, ScheduleTheme> = {
  'cyber-neon': cyberNeonTheme,
  'pastel-pop': pastelPopTheme,
  'simple-modern': simpleModernTheme,
  'dark-chic': darkChicTheme,
  'sakura-wa': sakuraWaTheme,
  'starlight-galaxy': starlightGalaxyTheme,
  'cafe-natural': cafeNaturalTheme,
  'pop-comic': popComicTheme,
};

export function getThemeById(id: string): ScheduleTheme {
  const theme = THEMES.find((t) => t.id === id);
  return theme ?? DEFAULT_THEME;
}
