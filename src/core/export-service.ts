import { ScheduleData } from '../types/schedule';
import { getDayOfWeekJapanese } from './date-utils';
import { APP_LINKS } from '../constants/links';

export interface ExportTextOptions {
  toolUrl?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const DEFAULT_TOOL_URL = 'https://streamschedule.pages.dev';

/**
 * X (Twitter) 投稿用の告知テキストを生成
 */
export function generateTweetText(
  schedule: ScheduleData,
  options?: ExportTextOptions
): string {
  const toolUrl = options?.toolUrl ?? DEFAULT_TOOL_URL;
  const lines: string[] = [];

  // ヘッダー部
  lines.push(`【今週の配信スケジュール】`);
  if (schedule.weekPeriodText) {
    lines.push(`📅 期間: ${schedule.weekPeriodText}`);
  }
  lines.push(`今週もよろしくお願いします！✨`);
  lines.push('');

  // 7日分のスケジュール行
  for (const item of schedule.items) {
    const dayJp = getDayOfWeekJapanese(item.dayOfWeek);
    if (item.isOff) {
      lines.push(`${item.dateString} (${dayJp}) お休み ${item.title ? `(${item.title})` : ''}`.trim());
    } else {
      const timePart = item.timeString ? `${item.timeString} ` : '';
      lines.push(`${item.dateString} (${dayJp}) ${timePart}${item.title}`.trim());
    }
  }

  lines.push('');

  // ハッシュタグ
  if (schedule.hashtag && schedule.hashtag.trim().length > 0) {
    lines.push(schedule.hashtag.trim());
  }

  // ツール宣伝・オーサーリンク (.company/steering/author-profile.md 準拠)
  lines.push(`🗓️ 画像作成ツール: ${toolUrl} (by ${APP_LINKS.X_HANDLE})`);

  return lines.join('\n');
}

/**
 * X Web Intent URL の生成
 */
export function createTwitterIntentUrl(tweetText: string, webUrl?: string): string {
  let fullText = tweetText;
  if (webUrl && !fullText.includes(webUrl)) {
    fullText = `${fullText}\n${webUrl}`;
  }
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullText)}`;
}

/**
 * スケジュールデータの整合性バリデーション
 */
export function validateScheduleData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['スケジュールデータが無効です（オブジェクトではありません）。'],
    };
  }

  const s = data as Partial<ScheduleData>;

  // 配信者名の検証
  if (!s.streamerName || s.streamerName.trim().length === 0) {
    errors.push('配信者名を入力してください。');
  }

  // 期間タイトルの検証
  if (!s.weekTitle || s.weekTitle.trim().length === 0) {
    errors.push('週間タイトルを入力してください。');
  }

  // 解像度の検証
  if (s.resolution !== '1920x1080' && s.resolution !== '1200x675') {
    errors.push('有効な解像度（1920x1080 または 1200x675）を選択してください。');
  }

  // スケジュールアイテム（7日分）の検証
  if (!Array.isArray(s.items) || s.items.length !== 7) {
    errors.push('スケジュールアイテムは7日分（月〜日）必要です。');
  } else {
    s.items.forEach((item, index) => {
      if (!item.dateString || item.dateString.trim().length === 0) {
        errors.push(`アイテム ${index + 1} の日付が設定されていません。`);
      }
      if (!item.isOff && (!item.title || item.title.trim().length === 0)) {
        errors.push(`アイテム ${index + 1}（${item.dayOfWeek}）の配信タイトルが空です。`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
