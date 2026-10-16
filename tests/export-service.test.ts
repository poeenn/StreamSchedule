import { describe, it, expect } from 'vitest';
import {
  generateTweetText,
  createTwitterIntentUrl,
  validateScheduleData,
} from '../src/core/export-service';
import { DEFAULT_SCHEDULE_DATA } from '../src/constants/default-schedule';

describe('export-service', () => {
  describe('generateTweetText', () => {
    it('generates well-formatted tweet text including title, dates, hashtags, and tool credit', () => {
      const tweetText = generateTweetText(DEFAULT_SCHEDULE_DATA);

      // タイトルが含まれる
      expect(tweetText).toContain('【今週の配信スケジュール】');
      // 配信者名または期間が含まれる
      expect(tweetText).toContain('2026.10.19 - 10.25');
      // 月曜日の内容が含まれる
      expect(tweetText).toContain('10/19 (月) 21:00〜 Apex Legends 参加型カスタム');
      // 水曜日の休みが含まれる
      expect(tweetText).toContain('10/21 (水) お休み');
      // ハッシュタグが含まれる
      expect(tweetText).toContain('#配信スケジュール');
      // 作者アカウント・ツール告知が含まれる (.company 規約準拠)
      expect(tweetText).toContain('@poeenn');
    });

    it('custom tool URL is respected if provided', () => {
      const customUrl = 'https://my-stream-schedule.app';
      const tweetText = generateTweetText(DEFAULT_SCHEDULE_DATA, { toolUrl: customUrl });
      expect(tweetText).toContain(customUrl);
    });
  });

  describe('createTwitterIntentUrl', () => {
    it('creates properly encoded twitter intent URL', () => {
      const text = 'テスト投稿 #配信スケジュール @poeenn\nhttps://example.com';
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
