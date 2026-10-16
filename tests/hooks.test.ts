import { describe, it, expect, vi, beforeEach } from 'vitest';
import { STORAGE_KEY_SCHEDULE } from '../src/hooks/useSchedule';
import { DEFAULT_SCHEDULE_DATA } from '../src/constants/default-schedule';
import { DEFAULT_AVATAR_CONFIG } from '../src/hooks/useAvatarImage';
import { advanceToNextWeek, formatWeekPeriod } from '../src/core/date-utils';

describe('useSchedule and useAvatarImage logic tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Schedule management constants and logic', () => {
    it('defines storage key correctly', () => {
      expect(STORAGE_KEY_SCHEDULE).toBe('stream_schedule_data_v1');
    });

    it('has valid default schedule items for all 7 days', () => {
      expect(DEFAULT_SCHEDULE_DATA.items).toHaveLength(7);
      const expectedDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      DEFAULT_SCHEDULE_DATA.items.forEach((item, idx) => {
        expect(item.dayOfWeek).toBe(expectedDays[idx]);
        expect(item.dateString).toBeTruthy();
      });
    });

    it('advances week items by 7 days correctly', () => {
      const currentDates = DEFAULT_SCHEDULE_DATA.items.map((i) => i.dateString);
      const nextDates = advanceToNextWeek(currentDates, 2026);
      expect(nextDates).toHaveLength(7);
      expect(nextDates[0]).toBe('10/26');
      expect(nextDates[6]).toBe('11/01');

      // 期間テキストフォーマット
      const [mStr, dStr] = nextDates[0].split('/');
      const nextMonday = new Date(2026, parseInt(mStr, 10) - 1, parseInt(dStr, 10));
      const period = formatWeekPeriod(nextMonday);
      expect(period).toBe('2026.10.26 - 11.01');
    });
  });

  describe('Avatar config defaults and clamping logic', () => {
    it('provides correct default avatar configuration', () => {
      expect(DEFAULT_AVATAR_CONFIG.scale).toBe(1.0);
      expect(DEFAULT_AVATAR_CONFIG.offsetX).toBe(0);
      expect(DEFAULT_AVATAR_CONFIG.offsetY).toBe(0);
      expect(DEFAULT_AVATAR_CONFIG.flipHorizontal).toBe(false);
      expect(DEFAULT_AVATAR_CONFIG.opacity).toBe(1.0);
      expect(DEFAULT_AVATAR_CONFIG.alignment).toBe('right');
    });

    it('clamps scale between 0.5 and 2.0', () => {
      const clampScale = (s: number) => Math.max(0.5, Math.min(2.0, s));
      expect(clampScale(0.1)).toBe(0.5);
      expect(clampScale(3.5)).toBe(2.0);
      expect(clampScale(1.4)).toBe(1.4);
    });

    it('clamps offsets within boundaries', () => {
      const clampX = (x: number) => Math.max(-600, Math.min(600, x));
      const clampY = (y: number) => Math.max(-400, Math.min(400, y));

      expect(clampX(-800)).toBe(-600);
      expect(clampX(900)).toBe(600);
      expect(clampX(150)).toBe(150);

      expect(clampY(-500)).toBe(-400);
      expect(clampY(600)).toBe(400);
      expect(clampY(-120)).toBe(-120);
    });

    it('clamps opacity between 0.1 and 1.0', () => {
      const clampOpacity = (o: number) => Math.max(0.1, Math.min(1.0, o));
      expect(clampOpacity(0.05)).toBe(0.1);
      expect(clampOpacity(1.5)).toBe(1.0);
      expect(clampOpacity(0.85)).toBe(0.85);
    });
  });
});
