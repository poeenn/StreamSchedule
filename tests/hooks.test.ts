import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  STORAGE_KEY_SCHEDULE,
  loadScheduleFromStorage,
  saveScheduleToStorage,
  createClearedItemsSchedule,
} from '../src/hooks/useSchedule';
import { DEFAULT_SCHEDULE_DATA } from '../src/constants/default-schedule';
import {
  DEFAULT_AVATAR_CONFIG,
  STORAGE_KEY_AVATAR_CONFIG,
  serializeAvatarConfig,
  loadAvatarConfigFromStorage,
  saveAvatarConfigToStorage,
} from '../src/hooks/useAvatarImage';
import {
  exportSettingsToJson,
  parseImportedSettingsJson,
} from '../src/hooks/useSettingsPresets';
import { advanceToNextWeek, formatWeekPeriod } from '../src/core/date-utils';

function createMemoryStorage(throwOnLargeData = false): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      if (throwOnLargeData && value.includes('data:image/png;base64,HUGE_DATA')) {
        throw new Error('QuotaExceededError');
      }
      store.set(key, value);
    },
  };
}

describe('useSchedule, useAvatarImage, and useSettingsPresets logic tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Schedule management constants and persistence logic', () => {
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

    it('saves and loads schedule including Phase 4 fields from storage', () => {
      const storage = createMemoryStorage();
      const customSchedule = {
        ...DEFAULT_SCHEDULE_DATA,
        streamerName: 'テストVTuber',
        themeId: 'sakura-wa',
        layoutType: 'left-avatar' as const,
        fontStyle: 'serif' as const,
        customAccentColor: '#ff6b9d',
        fanMark: '🌸🎮',
        platforms: ['YouTube', 'Twitch'],
      };

      expect(saveScheduleToStorage(customSchedule, storage)).toBe(true);
      const loaded = loadScheduleFromStorage(storage);
      expect(loaded.streamerName).toBe('テストVTuber');
      expect(loaded.themeId).toBe('sakura-wa');
      expect(loaded.layoutType).toBe('left-avatar');
      expect(loaded.fontStyle).toBe('serif');
      expect(loaded.customAccentColor).toBe('#ff6b9d');
      expect(loaded.fanMark).toBe('🌸🎮');
      expect(loaded.platforms).toEqual(['YouTube', 'Twitch']);
      expect(loaded.hashtag).toBe('#配信スケジュール');
    });

    it('automatically strips legacy default hashtag when loading from localStorage', () => {
      const storage = createMemoryStorage();
      const legacySchedule = {
        ...DEFAULT_SCHEDULE_DATA,
        hashtag: '#配信スケジュール #\u307d\u3048\u3089\u3044\u3076',
      };
      saveScheduleToStorage(legacySchedule, storage);
      const loaded = loadScheduleFromStorage(storage);
      expect(loaded.hashtag).toBe('#配信スケジュール');
    });

    it('gracefully falls back when customBgDataUrl exceeds storage quota', () => {
      const storage = createMemoryStorage(true);
      const scheduleWithHugeBg = {
        ...DEFAULT_SCHEDULE_DATA,
        streamerName: '容量テスト配信者',
        customBgDataUrl: 'data:image/png;base64,HUGE_DATA',
      };

      expect(saveScheduleToStorage(scheduleWithHugeBg, storage)).toBe(true);
      const loaded = loadScheduleFromStorage(storage);
      expect(loaded.streamerName).toBe('容量テスト配信者');
      expect(loaded.customBgDataUrl).toBeNull();
    });

    it('createClearedItemsSchedule preserves profile and design settings while clearing 7 day titles', () => {
      const customized = {
        ...DEFAULT_SCHEDULE_DATA,
        streamerName: '固定プロフィール名',
        streamerHandle: '@fixed_id',
        themeId: 'starlight-galaxy',
        layoutType: 'left-avatar' as const,
        customAccentColor: '#eab308',
      };

      const cleared = createClearedItemsSchedule(customized);
      expect(cleared.streamerName).toBe('固定プロフィール名');
      expect(cleared.streamerHandle).toBe('@fixed_id');
      expect(cleared.themeId).toBe('starlight-galaxy');
      expect(cleared.layoutType).toBe('left-avatar');
      expect(cleared.customAccentColor).toBe('#eab308');

      for (let i = 0; i < 7; i++) {
        expect(cleared.items[i].dateString).toBe(customized.items[i].dateString);
        expect(cleared.items[i].dayOfWeek).toBe(customized.items[i].dayOfWeek);
        expect(cleared.items[i].title).toBe('');
        expect(cleared.items[i].isOff).toBe(false);
        expect(cleared.items[i].badgeText).toBe('');
      }
    });

    it('advances week items by 7 days correctly', () => {
      const currentDates = DEFAULT_SCHEDULE_DATA.items.map((i) => i.dateString);
      const nextDates = advanceToNextWeek(currentDates, 2026);
      expect(nextDates).toHaveLength(7);
      expect(nextDates[0]).toBe('10/26');
      expect(nextDates[6]).toBe('11/01');

      const [mStr, dStr] = nextDates[0].split('/');
      const nextMonday = new Date(2026, parseInt(mStr, 10) - 1, parseInt(dStr, 10));
      const period = formatWeekPeriod(nextMonday);
      expect(period).toBe('2026.10.26 - 11.01');
    });
  });

  describe('Avatar config defaults, clamping, and LocalStorage persistence', () => {
    it('provides correct default avatar configuration', () => {
      expect(STORAGE_KEY_AVATAR_CONFIG).toBe('stream_schedule_avatar_config_v1');
      expect(DEFAULT_AVATAR_CONFIG.scale).toBe(1.0);
      expect(DEFAULT_AVATAR_CONFIG.offsetX).toBe(0);
      expect(DEFAULT_AVATAR_CONFIG.offsetY).toBe(0);
      expect(DEFAULT_AVATAR_CONFIG.flipHorizontal).toBe(false);
      expect(DEFAULT_AVATAR_CONFIG.opacity).toBe(1.0);
      expect(DEFAULT_AVATAR_CONFIG.alignment).toBe('right');
    });

    it('saves and restores avatar config including dataUrl and transform parameters', () => {
      const storage = createMemoryStorage();
      const avatarConfig = {
        ...DEFAULT_AVATAR_CONFIG,
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA',
        scale: 1.35,
        offsetX: -80,
        offsetY: 40,
        flipHorizontal: true,
        opacity: 0.9,
      };

      expect(saveAvatarConfigToStorage(avatarConfig, storage)).toBe(true);
      const restored = loadAvatarConfigFromStorage(storage);
      expect(restored.dataUrl).toBe('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA');
      expect(restored.scale).toBe(1.35);
      expect(restored.offsetX).toBe(-80);
      expect(restored.offsetY).toBe(40);
      expect(restored.flipHorizontal).toBe(true);
      expect(restored.opacity).toBe(0.9);
    });

    it('preserves transform settings when avatar dataUrl triggers QuotaExceededError', () => {
      const storage = createMemoryStorage(true);
      const hugeAvatar = {
        ...DEFAULT_AVATAR_CONFIG,
        dataUrl: 'data:image/png;base64,HUGE_DATA',
        scale: 1.5,
        offsetX: 120,
        offsetY: -50,
        flipHorizontal: true,
        opacity: 0.8,
      };

      expect(saveAvatarConfigToStorage(hugeAvatar, storage)).toBe(true);
      const restored = loadAvatarConfigFromStorage(storage);
      expect(restored.dataUrl).toBeNull();
      expect(restored.scale).toBe(1.5);
      expect(restored.offsetX).toBe(120);
      expect(restored.offsetY).toBe(-50);
      expect(restored.flipHorizontal).toBe(true);
      expect(restored.opacity).toBe(0.8);
    });

    it('serializeAvatarConfig strips HTMLImageElement and keeps serializable fields', () => {
      const serialized = serializeAvatarConfig({
        ...DEFAULT_AVATAR_CONFIG,
        imageElement: {} as HTMLImageElement,
        dataUrl: 'data:image/png;base64,test',
        scale: 1.2,
      });
      expect('imageElement' in serialized).toBe(false);
      expect(serialized.dataUrl).toBe('data:image/png;base64,test');
      expect(serialized.scale).toBe(1.2);
    });
  });

  describe('JSON Backup Export and Import', () => {
    it('exports settings to JSON and parses them back accurately', () => {
      const customSchedule = {
        ...DEFAULT_SCHEDULE_DATA,
        streamerName: 'バックアップ配信者',
        themeId: 'pop-comic',
        layoutType: 'left-avatar' as const,
      };
      const customAvatar = {
        ...DEFAULT_AVATAR_CONFIG,
        dataUrl: 'data:image/png;base64,avatar123',
        scale: 1.4,
        offsetX: 50,
        flipHorizontal: true,
      };

      const jsonStr = exportSettingsToJson(customSchedule, customAvatar);
      const parsed = parseImportedSettingsJson(jsonStr);

      expect(parsed.isValid).toBe(true);
      expect(parsed.schedule?.streamerName).toBe('バックアップ配信者');
      expect(parsed.schedule?.themeId).toBe('pop-comic');
      expect(parsed.schedule?.layoutType).toBe('left-avatar');
      expect(parsed.avatarConfig?.dataUrl).toBe('data:image/png;base64,avatar123');
      expect(parsed.avatarConfig?.scale).toBe(1.4);
      expect(parsed.avatarConfig?.offsetX).toBe(50);
      expect(parsed.avatarConfig?.flipHorizontal).toBe(true);
    });

    it('rejects malformed or incomplete JSON input safely', () => {
      expect(parseImportedSettingsJson('').isValid).toBe(false);
      expect(parseImportedSettingsJson('{ invalid json').isValid).toBe(false);
      expect(parseImportedSettingsJson('{"schedule": {"items": []}}').isValid).toBe(false);
    });
  });
});
