import { ScheduleData, ScheduleItem } from '../types/schedule';
import { getDayOfWeekJapanese } from './date-utils';

export type TweetTemplateType = 'vtuber-compact' | 'vtuber-framed' | 'vtuber-pickup';

export interface TweetTemplateOption {
  id: TweetTemplateType;
  label: string;
  shortLabel: string;
  description: string;
}

export const TWEET_TEMPLATE_OPTIONS: TweetTemplateOption[] = [
  {
    id: 'vtuber-compact',
    label: '📋 定番・予定リスト',
    shortLabel: '予定リスト',
    description: '各曜日の配信時間とタイトルをコンパクトに一覧化するVTuber定番スタイル',
  },
  {
    id: 'vtuber-framed',
    label: '💬 王道・画像メイン挨拶',
    shortLabel: '画像メイン挨拶',
    description: 'かわいい吹き出し枠と挨拶で、添付した予定表画像をメインに見せる王道スタイル',
  },
  {
    id: 'vtuber-pickup',
    label: '🌟 注目枠ピックアップ',
    shortLabel: '注目枠ピックアップ',
    description: '今週のコラボ・記念・週末などの注目枠を2〜3件ピックアップして紹介するスタイル',
  },
];

export interface ExportTextOptions {
  template?: TweetTemplateType;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * X (旧Twitter) 通常アカウントの上限ウェイト（全角140文字 = 280ウェイト）
 */
export const MAX_STANDARD_TWEET_WEIGHT = 280;

/**
 * X (Twitter) 公式仕様に準拠したウェイト計算
 * - ASCII文字 (U+0000 〜 U+007F、半角英数・記号・改行): 1ウェイト
 * - それ以外の文字 (日本語・全角記号・絵文字・サロゲートペア1文字): 2ウェイト
 */
export function calculateTweetWeight(text: string): number {
  if (!text) return 0;
  let weight = 0;
  for (const char of text) {
    const code = char.codePointAt(0) ?? 0;
    // 異体字セレクタ (FE0E, FE0F) や ZWJ (200D) は直前の絵文字の一部として0ウェイト扱いではなく
    // Xの文字数上限を絶対に超えないよう安全側でカウントしつつ、FE0E/FE0Fのみ0とする
    if (code === 0xfe0e || code === 0xfe0f) {
      continue;
    }
    weight += code <= 0x007f ? 1 : 2;
  }
  return weight;
}

/**
 * 日本語ユーザー向けの「全角140文字換算」の文字数を算出
 * (上限 140 文字 = 280 ウェイト)
 */
export function calculateTweetCharCount(text: string): number {
  return Math.ceil(calculateTweetWeight(text) / 2);
}

/**
 * 指定された最大ウェイト以下に文字列を切り詰める（超過時は末尾に「…」を付与）
 */
export function truncateByWeight(text: string, maxWeight: number): string {
  const trimmed = text.trim();
  if (calculateTweetWeight(trimmed) <= maxWeight) {
    return trimmed;
  }
  if (maxWeight < 2) {
    return '';
  }

  const ellipsis = '…';
  const targetWeight = maxWeight - calculateTweetWeight(ellipsis);
  let currentWeight = 0;
  let result = '';

  for (const char of trimmed) {
    const charWeight = calculateTweetWeight(char);
    if (currentWeight + charWeight > targetWeight) {
      break;
    }
    result += char;
    currentWeight += charWeight;
  }

  return `${result}${ellipsis}`;
}

/**
 * 配信時刻表記をコンパクト化 (例: "21:00〜" -> "21:00", "20:00 START" -> "20:00")
 */
function compactTimeString(timeString: string): string {
  if (!timeString) return '';
  const cleaned = timeString
    .replace(/(?:〜|~|～|\s*START|\s*start|\s*から)+$/gi, '')
    .trim();
  if (cleaned === '—' || cleaned === '-' || cleaned === 'ー') {
    return '';
  }
  return cleaned;
}

/**
 * スケジュールからコンパクトな期間表記を生成 (例: "10/19〜10/25")
 */
function getCompactPeriodText(schedule: ScheduleData, withDayOfWeek = false): string {
  const validItems = (schedule.items ?? []).filter(
    (item) => item.dateString && item.dateString.trim().length > 0
  );
  if (validItems.length >= 2) {
    const first = validItems[0];
    const last = validItems[validItems.length - 1];
    if (withDayOfWeek) {
      const firstDay = getDayOfWeekJapanese(first.dayOfWeek);
      const lastDay = getDayOfWeekJapanese(last.dayOfWeek);
      return `${first.dateString.trim()}(${firstDay}) 〜 ${last.dateString.trim()}(${lastDay})`;
    }
    return `${first.dateString.trim()}〜${last.dateString.trim()}`;
  }
  return (schedule.weekPeriodText ?? '').trim();
}

/**
 * ハッシュタグ文字列を正規化
 */
function getNormalizedHashtag(schedule: ScheduleData): string {
  const raw = (schedule.hashtag ?? '').trim();
  if (!raw) return '#配信スケジュール';
  // 異常に長いハッシュタグが設定された場合も安全に収めるため最大60ウェイト程度に制限
  return truncateByWeight(raw, 60);
}

/**
 * 1. VTuber定番・コンパクト予定リスト ('vtuber-compact')
 */
function generateCompactTemplate(schedule: ScheduleData): string {
  const period = getCompactPeriodText(schedule, false);
  const header = period
    ? `📅今週の配信予定（${period}）✨`
    : `📅今週の配信予定✨`;
  const hashtag = getNormalizedHashtag(schedule);
  const footerGreeting = '今週もよろしくね🙌';

  const activeItems = (schedule.items ?? []).filter((item) => !item.isOff);

  if (activeItems.length === 0) {
    const body = '今週はゆっくり充電＆準備期間です🍵';
    const text = `${header}\n\n${body}\n\n${footerGreeting}\n${hashtag}`;
    return truncateByWeight(text, MAX_STANDARD_TWEET_WEIGHT);
  }

  const buildWithTitleCap = (titleCapWeight: number, includeGreeting: boolean): string => {
    const itemLines = activeItems.map((item) => {
      const dayJp = getDayOfWeekJapanese(item.dayOfWeek);
      const time = compactTimeString(item.timeString);
      const prefix = `(${dayJp})${time ? `${time} ` : ''}`;
      const shortTitle = truncateByWeight(item.title || '配信予定', titleCapWeight);
      return `${prefix}${shortTitle}`;
    });

    const footerParts = includeGreeting ? [footerGreeting, hashtag] : [hashtag];
    return `${header}\n\n${itemLines.join('\n')}\n\n${footerParts.join('\n')}`;
  };

  // タイトル上限ウェイトを1ウェイト刻みで段階的に下げながら、280ウェイト（全角140文字）以下に収まる最大長を探す
  for (let cap = 60; cap >= 6; cap -= 1) {
    const candidate = buildWithTitleCap(cap, true);
    if (calculateTweetWeight(candidate) <= MAX_STANDARD_TWEET_WEIGHT) {
      return candidate;
    }
  }

  // 挨拶行をコンパクト化して再試行
  for (let cap = 24; cap >= 4; cap -= 1) {
    const candidate = buildWithTitleCap(cap, false);
    if (calculateTweetWeight(candidate) <= MAX_STANDARD_TWEET_WEIGHT) {
      return candidate;
    }
  }

  return truncateByWeight(buildWithTitleCap(4, false), MAX_STANDARD_TWEET_WEIGHT);
}

/**
 * 2. VTuber王道・吹き出し枠＆画像メイン告知 ('vtuber-framed')
 */
function generateFramedTemplate(schedule: ScheduleData): string {
  const periodWithDays = getCompactPeriodText(schedule, true);
  const hashtag = getNormalizedHashtag(schedule);

  const lines: string[] = [
    '╭━━━━━━━━━━━━━╮',
    '  📅 今週の配信予定表 ✨',
    '╰━━━━━━━━━━━━━╯',
  ];

  if (periodWithDays) {
    lines.push(`📍${periodWithDays}`);
  }

  lines.push(
    '',
    '今週も楽しい配信盛りだくさんでお届けします！🎮',
    'ぜひ遊びに来てね〜！🙌✨',
    '',
    hashtag
  );

  const fullText = lines.join('\n');
  if (calculateTweetWeight(fullText) <= MAX_STANDARD_TWEET_WEIGHT) {
    return fullText;
  }

  return truncateByWeight(fullText, MAX_STANDARD_TWEET_WEIGHT);
}

/**
 * 注目枠（コラボ・記念・バッジ付き・週末枠）を最大3件ピックアップ
 */
function selectPickupItems(items: ScheduleItem[], maxCount = 3): ScheduleItem[] {
  const active = items.filter((item) => !item.isOff);
  if (active.length <= maxCount) {
    return active;
  }

  // スコアリングして優先度の高い枠を選出
  const scored = active.map((item, idx) => {
    let score = 0;
    if (item.badgeText && item.badgeText.trim().length > 0) score += 10;
    if (item.category === 'collab' || item.category === 'event') score += 8;
    if (item.dayOfWeek === 'SAT' || item.dayOfWeek === 'SUN') score += 4;
    if (idx === 0) score += 2; // 週初めの枠
    return { item, idx, score };
  });

  const selectedIndices = new Set(
    scored
      .sort((a, b) => b.score - a.score || a.idx - b.idx)
      .slice(0, maxCount)
      .map((entry) => entry.idx)
  );

  // 表示順は曜日順（元の並び順）を維持
  return active.filter((_, idx) => selectedIndices.has(idx));
}

/**
 * 3. 注目枠ピックアップ＆ご挨拶 ('vtuber-pickup')
 */
function generatePickupTemplate(schedule: ScheduleData): string {
  const period = getCompactPeriodText(schedule, false);
  const header = period
    ? `📢 今週の配信スケジュール（${period}）✨`
    : `📢 今週の配信スケジュール✨`;
  const hashtag = getNormalizedHashtag(schedule);
  const pickupItems = selectPickupItems(schedule.items ?? [], 3);

  if (pickupItems.length === 0) {
    return generateFramedTemplate(schedule);
  }

  const buildPickupText = (titleCapWeight: number, maxItems: number): string => {
    const targetItems = pickupItems.slice(0, maxItems);
    const itemLines = targetItems.map((item) => {
      const dayJp = getDayOfWeekJapanese(item.dayOfWeek);
      const time = compactTimeString(item.timeString);
      const datePart = item.dateString ? `${item.dateString.trim()}(${dayJp})` : `(${dayJp})`;
      const prefix = `・${datePart} ${time ? `${time} ` : ''}`;
      const shortTitle = truncateByWeight(item.title || '配信予定', titleCapWeight);
      return `${prefix}${shortTitle}`;
    });

    return [
      header,
      '',
      '🌟今週のピックアップ🌟',
      ...itemLines,
      '',
      '詳細は画像の予定表をチェックしてね👀✨',
      '今週もよろしくお願いします！🙌',
      hashtag,
    ].join('\n');
  };

  // 3枠ピックアップでタイトル長を調整
  for (let cap = 44; cap >= 12; cap -= 2) {
    const candidate = buildPickupText(cap, 3);
    if (calculateTweetWeight(candidate) <= MAX_STANDARD_TWEET_WEIGHT) {
      return candidate;
    }
  }

  // 2枠ピックアップに絞ってタイトル長を確保
  for (let cap = 44; cap >= 8; cap -= 2) {
    const candidate = buildPickupText(cap, 2);
    if (calculateTweetWeight(candidate) <= MAX_STANDARD_TWEET_WEIGHT) {
      return candidate;
    }
  }

  return truncateByWeight(buildPickupText(8, 2), MAX_STANDARD_TWEET_WEIGHT);
}

/**
 * X (Twitter) 投稿用の告知テキストを生成
 * - ツールの宣伝文・URLは一切含めない
 * - 通常アカウントの140文字制限（280ウェイト）に必ず収まるよう自動調整
 */
export function generateTweetText(
  schedule: ScheduleData,
  options?: ExportTextOptions
): string {
  const template: TweetTemplateType = options?.template ?? 'vtuber-compact';

  switch (template) {
    case 'vtuber-framed':
      return generateFramedTemplate(schedule);
    case 'vtuber-pickup':
      return generatePickupTemplate(schedule);
    case 'vtuber-compact':
    default:
      return generateCompactTemplate(schedule);
  }
}

/**
 * X Web Intent URL の生成
 */
export function createTwitterIntentUrl(tweetText: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
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
