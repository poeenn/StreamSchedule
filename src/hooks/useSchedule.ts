import { useState, useEffect, useCallback } from 'react';
import { ScheduleData, ScheduleItem, WeeklySchedule } from '../types/schedule';
import { DEFAULT_SCHEDULE_DATA } from '../constants/default-schedule';
import { advanceToNextWeek, formatWeekPeriod } from '../core/date-utils';

export const STORAGE_KEY_SCHEDULE = 'stream_schedule_data_v1';

/**
 * 週間スケジュール状態を管理・LocalStorageと自動同期するカスタムフック
 */
export function useSchedule(initialData?: ScheduleData) {
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    if (initialData) return initialData;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_SCHEDULE);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.items) && parsed.items.length === 7) {
            return {
              ...DEFAULT_SCHEDULE_DATA,
              ...parsed,
            };
          }
        }
      } catch (err) {
        console.warn('Failed to load schedule from localStorage:', err);
      }
    }
    return DEFAULT_SCHEDULE_DATA;
  });

  // スケジュール変更時にLocalStorageへ自動保存
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
      } catch (err) {
        console.warn('Failed to save schedule to localStorage:', err);
      }
    }
  }, [schedule]);

  // 全体または部分フィールド更新
  const updateSchedule = useCallback((partial: Partial<WeeklySchedule>) => {
    setSchedule((prev) => ({
      ...prev,
      ...partial,
    }));
  }, []);

  // 日別の枠更新
  const updateItem = useCallback((index: number, partial: Partial<ScheduleItem>) => {
    setSchedule((prev) => {
      const nextItems = [...prev.items];
      if (index >= 0 && index < nextItems.length) {
        nextItems[index] = {
          ...nextItems[index],
          ...partial,
        };
      }
      return {
        ...prev,
        items: nextItems,
      };
    });
  }, []);

  // 翌週繰り越し（全日付 +7日 & 期間テキスト更新）
  const advanceWeek = useCallback(() => {
    setSchedule((prev) => {
      const currentDates = prev.items.map((item) => item.dateString);
      const nextDates = advanceToNextWeek(currentDates);

      const nextItems = prev.items.map((item, index) => ({
        ...item,
        dateString: nextDates[index] ?? item.dateString,
      }));

      // 新しい月曜日から期間テキストを生成
      const [mStr, dStr] = nextDates[0].split('/');
      const month = parseInt(mStr, 10) - 1;
      const day = parseInt(dStr, 10);
      const currentYear = new Date().getFullYear();
      const nextMondayDate = new Date(currentYear, month, day);
      const nextPeriodText = formatWeekPeriod(nextMondayDate);

      return {
        ...prev,
        weekPeriodText: nextPeriodText,
        items: nextItems,
      };
    });
  }, []);

  // 初期値にリセット
  const resetSchedule = useCallback(() => {
    setSchedule(DEFAULT_SCHEDULE_DATA);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY_SCHEDULE);
      } catch (err) {
        console.warn('Failed to remove schedule from localStorage:', err);
      }
    }
  }, []);

  return {
    schedule,
    setSchedule,
    updateSchedule,
    updateItem,
    advanceWeek,
    resetSchedule,
  };
}
