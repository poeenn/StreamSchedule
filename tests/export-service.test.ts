import { describe, it, expect } from 'vitest';
import {
  generateTweetText,
  createTwitterIntentUrl,
  validateScheduleData,
  calculateTweetWeight,
  calculateTweetCharCount,
  MAX_STANDARD_TWEET_WEIGHT,
  TWEET_TEMPLATE_OPTIONS,
  TweetTemplateType,
} from '../src/core/export-service';
import { DEFAULT_SCHEDULE_DATA } from '../src/constants/default-schedule';
import { ScheduleData } from '../src/types/schedule';

describe('export-service', () => {
  describe('calculateTweetWeight & calculateTweetCharCount', () => {
    it('calculates ASCII as 1 weight and full-width/emoji as 2 weight', () => {
      expect(calculateTweetWeight('ABC 123\n')).toBe(8);
      expect(calculateTweetWeight('あいうえお')).toBe(10);
      expect(calculateTweetWeight('📅✨🙌')).toBe(6); // 3絵文字 = 6ウェイト
    });

    it('calculates 140 full-width characters as 280 weight and 140 char count', () => {
      const fullWidth140 = 'あ'.repeat(140);
      expect(calculateTweetWeight(fullWidth140)).toBe(280);
      expect(calculateTweetCharCount(fullWidth140)).toBe(140);
    });
  });

  describe('generateTweetText', () => {
    const templates: TweetTemplateType[] = ['vtuber-compact', 'vtuber-framed', 'vtuber-pickup'];

    it('NEVER includes tool promotional text or URLs in any template', () => {
      for (const template of templates) {
        const tweetText = generateTweetText(DEFAULT_SCHEDULE_DATA, { template });
        expect(tweetText).not.toContain('streamschedule.pages.dev');
        expect(tweetText).not.toContain('画像作成ツール');
        expect(tweetText).not.toContain('by @poeenn');
        expect(tweetText).not.toContain('http://');
        expect(tweetText).not.toContain('https://');
      }
    });

    it('exposes 3 VTuber template options for UI selection', () => {
      expect(TWEET_TEMPLATE_OPTIONS).toHaveLength(3);
      expect(TWEET_TEMPLATE_OPTIONS.map((o) => o.id)).toEqual([
        'vtuber-compact',
        'vtuber-framed',
        'vtuber-pickup',
      ]);
    });

    it('generates vtuber-compact template by default with compact times and active days within 140 chars', () => {
      const tweetText = generateTweetText(DEFAULT_SCHEDULE_DATA);

      // ヘッダーと期間
      expect(tweetText).toContain('📅今週の配信予定（10/19〜10/25）✨');
      // 時刻の「〜」や「START」がコンパクト化されて各曜日が入っている
      expect(tweetText).toContain('(月)21:00 Apex Legends 参加型');
      expect(tweetText).toContain('(火)20:00 まったり晩酌・雑談配信');
      expect(tweetText).toContain('(木)21:00 VALORANT ランク挑戦');
      // お休みの日（水曜）はコンパクトリストでは省略して文字数を節約
      expect(tweetText).not.toContain('(水)');
      // ハッシュタグが含まれる
      expect(tweetText).toContain('#配信スケジュール');
      // 140文字（280ウェイト）以内であること
      expect(calculateTweetWeight(tweetText)).toBeLessThanOrEqual(MAX_STANDARD_TWEET_WEIGHT);
      expect(calculateTweetCharCount(tweetText)).toBeLessThanOrEqual(140);
    });

    it('generates vtuber-framed template with decorative frame and greeting within 140 chars', () => {
      const tweetText = generateTweetText(DEFAULT_SCHEDULE_DATA, { template: 'vtuber-framed' });

      expect(tweetText).toContain('╭━━━━━━━━━━━━━╮');
      expect(tweetText).toContain('📅 今週の配信予定表 ✨');
      expect(tweetText).toContain('📍10/19(月) 〜 10/25(日)');
      expect(tweetText).toContain('#配信スケジュール');
      expect(calculateTweetWeight(tweetText)).toBeLessThanOrEqual(MAX_STANDARD_TWEET_WEIGHT);
      expect(calculateTweetCharCount(tweetText)).toBeLessThanOrEqual(140);
    });

    it('generates vtuber-pickup template highlighting key streams within 140 chars', () => {
      const tweetText = generateTweetText(DEFAULT_SCHEDULE_DATA, { template: 'vtuber-pickup' });

      expect(tweetText).toContain('📢 今週の配信スケジュール（10/19〜10/25）✨');
      expect(tweetText).toContain('🌟今週のピックアップ🌟');
      expect(tweetText).toContain('詳細は画像の予定表をチェックしてね👀✨');
      expect(tweetText).toContain('#配信スケジュール');
      expect(calculateTweetWeight(tweetText)).toBeLessThanOrEqual(MAX_STANDARD_TWEET_WEIGHT);
      expect(calculateTweetCharCount(tweetText)).toBeLessThanOrEqual(140);
    });

    it('strictly keeps tweet length <= 280 weight (140 full-width chars) even when all 7 days have very long 45-char titles', () => {
      const longTitleSchedule: ScheduleData = {
        ...DEFAULT_SCHEDULE_DATA,
        hashtag: '#新人VTuber #配信スケジュール #VTuber準備中 #ゲーム実況者と繋がりたい',
        items: DEFAULT_SCHEDULE_DATA.items.map((item, idx) => ({
          ...item,
          isOff: false,
          timeString: '21:00〜24:00',
          title: `【第${idx + 1}回・超大型企画】絶対に負けられない視聴者参加型フルパカスタム大会＆耐久スペシャル配信枠！`,
        })),
      };

      for (const template of templates) {
        const tweetText = generateTweetText(longTitleSchedule, { template });
        const weight = calculateTweetWeight(tweetText);
        const charCount = calculateTweetCharCount(tweetText);

        expect(weight).toBeLessThanOrEqual(MAX_STANDARD_TWEET_WEIGHT);
        expect(charCount).toBeLessThanOrEqual(140);
        expect(tweetText.length).toBeGreaterThan(20);
      }
    });

    it('handles schedule where all 7 days are off gracefully within 140 chars', () => {
      const allOffSchedule: ScheduleData = {
        ...DEFAULT_SCHEDULE_DATA,
        items: DEFAULT_SCHEDULE_DATA.items.map((item) => ({
          ...item,
          isOff: true,
        })),
      };

      for (const template of templates) {
        const tweetText = generateTweetText(allOffSchedule, { template });
        expect(calculateTweetWeight(tweetText)).toBeLessThanOrEqual(MAX_STANDARD_TWEET_WEIGHT);
      }
    });
  });

  describe('createTwitterIntentUrl', () => {
    it('creates properly encoded twitter intent URL', () => {
      const text = '📅今週の配信予定（10/19〜10/25）✨\n#配信スケジュール';
      const url = createTwitterIntentUrl(text);

      expect(url).toMatch(/^https:\/\/twitter\.com\/intent\/tweet\?text=/);
      expect(url).toContain(encodeURIComponent(text));
    });

    it('handles special characters safely', () => {
      const text = 'Special & ? / # = characters';
      const url = createTwitterIntentUrl(text);
      expect(url).toContain(encodeURIComponent(text));
    });
  });

  describe('validateScheduleData', () => {
    it('returns isValid: true for valid schedule data', () => {
      const result = validateScheduleData(DEFAULT_SCHEDULE_DATA);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error when streamerName is empty', () => {
      const invalidData = {
        ...DEFAULT_SCHEDULE_DATA,
        streamerName: '   ',
      };
      const result = validateScheduleData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('配信者名'))).toBe(true);
    });

    it('returns error when items count is not 7', () => {
      const invalidData = {
        ...DEFAULT_SCHEDULE_DATA,
        items: DEFAULT_SCHEDULE_DATA.items.slice(0, 5),
      };
      const result = validateScheduleData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('7日分'))).toBe(true);
    });

    it('returns error when resolution is invalid', () => {
      const invalidData = {
        ...DEFAULT_SCHEDULE_DATA,
        resolution: '800x600' as any,
      };
      const result = validateScheduleData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('解像度'))).toBe(true);
    });

    it('handles null or non-object input gracefully', () => {
      expect(validateScheduleData(null).isValid).toBe(false);
      expect(validateScheduleData(undefined).isValid).toBe(false);
      expect(validateScheduleData('invalid').isValid).toBe(false);
    });
  });
});

