import { DayOfWeek } from '../types/schedule';

const JS_DAY_TO_DAY_OF_WEEK: DayOfWeek[] = [
  'SUN',
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
];

/**
 * Date オブジェクトから DayOfWeek ('MON' 〜 'SUN') を取得
 */
export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  return JS_DAY_TO_DAY_OF_WEEK[date.getDay()] ?? 'MON';
}

/**
 * 指定日を含む週の月曜日を取得（00:00:00）
 * 週の起算日は月曜日、日曜日はその週の最終日（7日目）として扱います。
 */
export function getWeekMonday(date: Date = new Date()): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay(); // 0: 日, 1: 月, ..., 6: 土
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

/**
 * 指定日を含む週の日曜日（日曜始まり）を取得（00:00:00）
 */
export function getWeekSunday(date: Date = new Date()): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay(); // 0: 日, 1: 月, ..., 6: 土
  result.setDate(result.getDate() - day);
  return result;
}

/**
 * Date オブジェクトを 'MM/DD' 形式の文字列にフォーマット
 */
export function formatDisplayDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}/${d}`;
}

/**
 * 開始日から始まる7日分の日付配列（'MM/DD'）を生成
 */
export function generateWeekDates(startDate: Date): string[] {
  const dates: string[] = [];
  const base = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  for (let i = 0; i < 7; i++) {
    const current = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    dates.push(formatDisplayDate(current));
  }

  return dates;
}

/**
 * 任意の開始日から7日間の期間テキストをフォーマット (例: '2026.10.19 - 10.25')
 */
export function formatAny7DaysPeriod(startDate: Date): string {
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);

  const startYear = start.getFullYear();
  const startMonth = String(start.getMonth() + 1).padStart(2, '0');
  const startDay = String(start.getDate()).padStart(2, '0');

  const endYear = end.getFullYear();
  const endMonth = String(end.getMonth() + 1).padStart(2, '0');
  const endDay = String(end.getDate()).padStart(2, '0');

  if (startYear !== endYear) {
    return `${startYear}.${startMonth}.${startDay} - ${endYear}.${endMonth}.${endDay}`;
  }

  return `${startYear}.${startMonth}.${startDay} - ${endMonth}.${endDay}`;
}

/**
 * 任意の基準日（月曜始まり・日曜始まり・今日から等）から7日分の曜日・日付・期間テキストを一括生成
 */
export function generate7DayScheduleMeta(startDate: Date): {
  periodText: string;
  days: { dayOfWeek: DayOfWeek; dateString: string }[];
} {
  const base = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const days: { dayOfWeek: DayOfWeek; dateString: string }[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    days.push({
      dayOfWeek: getDayOfWeekFromDate(current),
      dateString: formatDisplayDate(current),
    });
  }

  return {
    periodText: formatAny7DaysPeriod(base),
    days,
  };
}

/**
 * 1クリック翌週繰り越し計算
 * 現在の日付文字列配列（'MM/DD'）を受け取り、+7日進めた7日分の日付配列を返します。
 */
export function advanceToNextWeek(currentDates: string[], referenceYear?: number): string[] {
  if (!currentDates || currentDates.length === 0) {
    const nextMon = getWeekMonday();
    nextMon.setDate(nextMon.getDate() + 7);
    return generateWeekDates(nextMon);
  }

  const [firstMonthStr, firstDayStr] = currentDates[0].split('/');
  const month = parseInt(firstMonthStr, 10) - 1; // 0-indexed
  const day = parseInt(firstDayStr, 10);
  const year = referenceYear ?? new Date().getFullYear();

  // 基準開始日を作成し、+7日進める
  const nextStart = new Date(year, month, day + 7);
  return generateWeekDates(nextStart);
}

/**
 * 週間期間テキストをフォーマット (例: '2026.10.19 - 10.25')
 */
export function formatWeekPeriod(startDate: Date): string {
  const monday = getWeekMonday(startDate);
  return formatAny7DaysPeriod(monday);
}

/**
 * 曜日の英語表記から日本語1文字を取得
 */
export function getDayOfWeekJapanese(day: DayOfWeek): string {
  const map: Record<DayOfWeek, string> = {
    MON: '月',
    TUE: '火',
    WED: '水',
    THU: '木',
    FRI: '金',
    SAT: '土',
    SUN: '日',
  };
  return map[day];
}
