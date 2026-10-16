import { describe, it, expect } from 'vitest';
import { THEMES, DEFAULT_THEME, getThemeById, THEME_MAP } from '../src/themes';
import { StreamCategory } from '../src/types/schedule';

describe('Theme Definitions and Registry', () => {
  const expectedThemeIds = ['cyber-neon', 'pastel-pop', 'simple-modern', 'dark-chic'] as const;
  const allCategories: StreamCategory[] = ['game', 'chat', 'sing', 'collab', 'event', 'holiday', 'other'];

  it('contains all 4 major themes', () => {
    expect(THEMES).toHaveLength(4);
    const ids = THEMES.map((t) => t.id);
    for (const id of expectedThemeIds) {
      expect(ids).toContain(id);
    }
  });

  it('has DEFAULT_THEME set to cyber-neon', () => {
    expect(DEFAULT_THEME.id).toBe('cyber-neon');
  });

  it('getThemeById retrieves correct theme for valid IDs', () => {
    for (const id of expectedThemeIds) {
      const theme = getThemeById(id);
      expect(theme).toBeDefined();
      expect(theme.id).toBe(id);
    }
  });

  it('getThemeById returns DEFAULT_THEME for unknown ID', () => {
    const unknown = getThemeById('non-existent-theme');
    expect(unknown).toBe(DEFAULT_THEME);
  });

  it('THEME_MAP contains key for each theme id', () => {
    for (const id of expectedThemeIds) {
      expect(THEME_MAP[id]).toBeDefined();
      expect(THEME_MAP[id].id).toBe(id);
    }
  });

  describe.each(THEMES)('Theme properties: $name ($id)', (theme) => {
    it('has valid string metadata', () => {
      expect(theme.id).toBeTruthy();
      expect(theme.name).toBeTruthy();
      expect(theme.description).toBeTruthy();
      expect(theme.previewThumbnail).toBeTruthy();
    });

    it('has complete color palette', () => {
      const c = theme.colors;
      expect(c.background).toBeTruthy();
      expect(c.cardBg).toBeTruthy();
      expect(c.cardBorder).toBeTruthy();
      expect(c.textPrimary).toBeTruthy();
      expect(c.textSecondary).toBeTruthy();
      expect(c.accentPrimary).toBeTruthy();
      expect(c.accentSecondary).toBeTruthy();
      expect(c.timeBadgeBg).toBeTruthy();
      expect(c.timeBadgeText).toBeTruthy();
      expect(c.offDayBadgeBg).toBeTruthy();
      expect(c.offDayBadgeText).toBeTruthy();
      expect(c.headerAccent).toBeTruthy();
      expect(c.creditText).toBeTruthy();
    });

    it('defines colors for all 7 stream categories', () => {
      for (const cat of allCategories) {
        const catColor = theme.colors.categoryBadgeColors[cat];
        expect(catColor, `Category ${cat} in ${theme.id} should be defined`).toBeDefined();
        expect(catColor.bg).toBeTruthy();
        expect(catColor.text).toBeTruthy();
      }
    });

    it('has typography definitions', () => {
      expect(theme.typography.titleFont).toBeTruthy();
      expect(theme.typography.dayFont).toBeTruthy();
      expect(theme.typography.bodyFont).toBeTruthy();
    });

    it('has decoration settings within valid ranges', () => {
      expect(['dots', 'grid', 'stripes', 'none']).toContain(theme.decorations.patternType);
      expect(theme.decorations.patternOpacity).toBeGreaterThanOrEqual(0);
      expect(theme.decorations.patternOpacity).toBeLessThanOrEqual(1);
      expect(theme.decorations.cardCornerRadius).toBeGreaterThan(0);
      expect(typeof theme.decorations.cardGlow).toBe('boolean');
    });
  });
});
