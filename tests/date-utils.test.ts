import { describe, it, expect } from 'vitest';
import {
  getWeekMonday,
  generateWeekDates,
  advanceToNextWeek,
  formatDisplayDate,
  formatWeekPeriod,
  getDayOfWeekJapanese,
} from '../src/core/date-utils';

describe('date-utils', () => {
  describe('getWeekMonday', () => {
    it('returns the same date when given date is Monday', () => {
      // 2026-10-19 is Monday
      const monday = new Date(2026, 9, 19, 12, 0, 0); // Month is 0-indexed: 9 = October
      const result = getWeekMonday(monday);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9);
      expect(result.getDate()).toBe(19);
    });

    it('returns Monday of the current week when given date is Wednesday', () => {
      // 2026-10-21 is Wednesday
      const wednesday = new Date(2026, 9, 21, 15, 30, 0);
      const result = getWeekMonday(wednesday);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9);
      expect(result.getDate()).toBe(19);
    });

    it('returns Monday of the current week when given date is Sunday', () => {
      // 2026-10-25 is Sunday (end of week)
      const sunday = new Date(2026, 9, 25, 23, 59, 59);
      const result = getWeekMonday(sunday);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9);
      expect(result.getDate()).toBe(19);
    });

    it('handles month transitions correctly', () => {
      // 2026-11-01 is Sunday -> Monday was 2026-10-26
      const nov1 = new Date(2026, 10, 1, 10, 0, 0);
      const result = getWeekMonday(nov1);
      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(9); // October
      expect(result.getDate()).toBe(26);
    });
  });

  describe('generateWeekDates', () => {
    it('generates 7 dates starting from Monday in MM/DD format', () => {
      const monday = new Date(2026, 9, 19);
      const dates = generateWeekDates(monday);
      expect(dates).toHaveLength(7);
      expect(dates).toEqual(['10/19', '10/20', '10/21', '10/22', '10/23', '10/24', '10/25']);
    });

    it('handles month rollover in dates', () => {
      const monday = new Date(2026, 9, 26);
      const dates = generateWeekDates(monday);
      expect(dates).toEqual(['10/26', '10/27', '10/28', '10/29', '10/30', '10/31', '11/01']);
    });
  });

  describe('advanceToNextWeek', () => {
    it('advances date strings by 7 days', () => {
      const current = ['10/19', '10/20', '10/21', '10/22', '10/23', '10/24', '10/25'];
      const nextWeek = advanceToNextWeek(current, 2026);
      expect(nextWeek).toEqual(['10/26', '10/27', '10/28', '10/29', '10/30', '10/31', '11/01']);
    });

    it('advances date across year boundary if provided with year rollover', () => {
      const current = ['12/28', '12/29', '12/30', '12/31', '01/01', '01/02', '01/03'];
      const nextWeek = advanceToNextWeek(current, 2026);
      expect(nextWeek).toEqual(['01/04', '01/05', '01/06', '01/07', '01/08', '01/09', '01/10']);
    });
  });

  describe('formatDisplayDate and helpers', () => {
    it('formats Date object to MM/DD', () => {
      const d = new Date(2026, 9, 5);
      expect(formatDisplayDate(d)).toBe('10/05');
    });

    it('formats week period text', () => {
      const start = new Date(2026, 9, 19);
      const period = formatWeekPeriod(start);
      expect(period).toBe('2026.10.19 - 10.25');
    });

    it('returns correct Japanese day of week', () => {
      expect(getDayOfWeekJapanese('MON')).toBe('月');
      expect(getDayOfWeekJapanese('FRI')).toBe('金');
      expect(getDayOfWeekJapanese('SUN')).toBe('日');
    });
  });
});
