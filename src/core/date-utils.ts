import { DayOfWeek } from '../types/schedule';

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
 * Date オブジェクトを 'MM/DD' 形式の文字列にフォーマット
 */
export function formatDisplayDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}/${d}`;
}

/**
 * 月曜日から始まる7日分の日付配列（'MM/DD'）を生成
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

  // 基準月曜日を作成し、+7日進める
  const nextMonday = new Date(year, month, day + 7);
  return generateWeekDates(nextMonday);
}

/**
 * 週間期間テキストをフォーマット (例: '2026.10.19 - 10.25')
 */
export function formatWeekPeriod(startDate: Date): string {
  const monday = getWeekMonday(startDate);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);

  const startYear = monday.getFullYear();
  const startMonth = String(monday.getMonth() + 1).padStart(2, '0');
  const startDay = String(monday.getDate()).padStart(2, '0');

  const endYear = sunday.getFullYear();
  const endMonth = String(sunday.getMonth() + 1).padStart(2, '0');
  const endDay = String(sunday.getDate()).padStart(2, '0');

  if (startYear !== endYear) {
    return `${startYear}.${startMonth}.${startDay} - ${endYear}.${endMonth}.${endDay}`;
  }

  return `${startYear}.${startMonth}.${startDay} - ${endMonth}.${endDay}`;
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
