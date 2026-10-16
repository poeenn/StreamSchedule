import { useState, useEffect, useCallback } from 'react';
import { ScheduleData, ScheduleItem, WeeklySchedule } from '../types/schedule';
import { DEFAULT_SCHEDULE_DATA } from '../constants/default-schedule';
import { advanceToNextWeek, formatWeekPeriod, generate7DayScheduleMeta } from '../core/date-utils';

export const STORAGE_KEY_SCHEDULE = 'stream_schedule_data_v1';

/**
 * LocalStorageからスケジュール設定を安全に読み込む純粋ヘルパー
 */
export function loadScheduleFromStorage(storage?: Storage): WeeklySchedule {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return DEFAULT_SCHEDULE_DATA;

  try {
    const saved = targetStorage.getItem(STORAGE_KEY_SCHEDULE);
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
  return DEFAULT_SCHEDULE_DATA;
}

/**
 * LocalStorageへスケジュール設定を安全に保存する純粋ヘルパー（容量超過時はカスタム背景DataURLを除いて設定値を保護）
 */
export function saveScheduleToStorage(schedule: WeeklySchedule, storage?: Storage): boolean {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return false;

  try {
    targetStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
    return true;
  } catch (err) {
    // カスタム背景画像DataURLが大きすぎてQuotaExceededになった場合は、背景画像以外の全設定を確実に保存
    try {
      const fallbackSchedule: WeeklySchedule = {
        ...schedule,
        customBgDataUrl: null,
      };
      targetStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(fallbackSchedule));
      return true;
    } catch (innerErr) {
      console.warn('Failed to save schedule to localStorage:', err, innerErr);
      return false;
    }
  }
}

/**
 * 配信者情報・デザイン設定はすべて維持したまま、7日分の予定内容のみをクリアしたデータを返す純粋関数
 */
export function createClearedItemsSchedule(current: WeeklySchedule): WeeklySchedule {
  return {
    ...current,
    items: current.items.map((item) => ({
      ...item,
      timeString: item.isOff ? '21:00〜' : item.timeString || '21:00〜',
      title: '',
      category: 'game',
      isOff: false,
      badgeText: '',
    })),
  };
}

/**
 * 週間スケジュール状態を管理・LocalStorageと自動同期するカスタムフック
 */
export function useSchedule(initialData?: ScheduleData) {
  const [schedule, setSchedule] = useState<WeeklySchedule>(() => {
    if (initialData) return initialData;
    return loadScheduleFromStorage();
  });

  // スケジュール変更時にLocalStorageへ自動保存
  useEffect(() => {
    saveScheduleToStorage(schedule);
  }, [schedule]);

  // 明示的な手動保存トリガー
  const saveNow = useCallback((): boolean => {
    return saveScheduleToStorage(schedule);
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

  // 一括時刻セット（お休み以外の全曜日の配信時刻を一括変更）
  const applyBulkTime = useCallback((timeString: string) => {
    setSchedule((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.isOff ? item : { ...item, timeString }
      ),
    }));
  }, []);

  // 任意の基準日（開始日）から7日分の日付・曜日・期間テキストを自動計算してセット
  const applyStartDate = useCallback((startDate: Date) => {
    const meta = generate7DayScheduleMeta(startDate);
    setSchedule((prev) => ({
      ...prev,
      weekPeriodText: meta.periodText,
      items: prev.items.map((item, idx) => ({
        ...item,
        dayOfWeek: meta.days[idx]?.dayOfWeek ?? item.dayOfWeek,
        dateString: meta.days[idx]?.dateString ?? item.dateString,
      })),
    }));
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

      // 新しい開始日から期間テキストを生成
      const [mStr, dStr] = nextDates[0].split('/');
      const month = parseInt(mStr, 10) - 1;
      const day = parseInt(dStr, 10);
      const currentYear = new Date().getFullYear();
      const nextStartDate = new Date(currentYear, month, day);
      const nextPeriodText = formatWeekPeriod(nextStartDate);

      return {
        ...prev,
        weekPeriodText: nextPeriodText,
        items: nextItems,
      };
    });
  }, []);

  // スマートリセット①: 設定系（配信者名・テンプレート・立ち絵等）は維持し、7日間の予定枠のみクリア
  const clearItemsOnly = useCallback(() => {
    setSchedule((prev) => createClearedItemsSchedule(prev));
  }, []);

  // スマートリセット②: 全設定を初期値にリセット
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
    applyBulkTime,
    applyStartDate,
    advanceWeek,
    clearItemsOnly,
    resetSchedule,
    saveNow,
  };
}
