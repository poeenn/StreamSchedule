import { useState, useEffect, useCallback } from 'react';
import {
  AvatarConfig,
  QuickTagPreset,
  ScheduleData,
  SettingsPreset,
} from '../types/schedule';
import { DEFAULT_QUICK_TAGS, DEFAULT_SCHEDULE_DATA } from '../constants/default-schedule';
import { DEFAULT_AVATAR_CONFIG, serializeAvatarConfig } from './useAvatarImage';

export const STORAGE_KEY_PRESETS = 'stream_schedule_presets_v1';
export const STORAGE_KEY_QUICK_TAGS = 'stream_schedule_quick_tags_v1';

export interface SettingsBackupPayload {
  version: number;
  exportedAt: string;
  schedule: ScheduleData;
  avatarConfig: Omit<AvatarConfig, 'imageElement'>;
  quickTags?: QuickTagPreset[];
}

export interface ParsedBackupResult {
  isValid: boolean;
  error?: string;
  schedule?: ScheduleData;
  avatarConfig?: Omit<AvatarConfig, 'imageElement'>;
  quickTags?: QuickTagPreset[];
}

/**
 * 現在の設定一式を JSON バックアップ文字列にシリアライズする純粋関数
 */
export function exportSettingsToJson(
  schedule: ScheduleData,
  avatarConfig: AvatarConfig,
  quickTags?: QuickTagPreset[]
): string {
  const payload: SettingsBackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    schedule,
    avatarConfig: serializeAvatarConfig(avatarConfig),
    quickTags,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * インポートされた JSON 文字列を検証・パースして復元用データを返す純粋関数
 */
export function parseImportedSettingsJson(jsonString: string): ParsedBackupResult {
  if (!jsonString || typeof jsonString !== 'string') {
    return { isValid: false, error: 'JSONデータが空です。' };
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, error: '有効なJSONオブジェクトではありません。' };
    }

    // schedule 単体フォーマット、または { schedule, avatarConfig } バックアップフォーマットの両対応
    const rawSchedule = parsed.schedule ?? (Array.isArray(parsed.items) ? parsed : null);
    if (!rawSchedule || !Array.isArray(rawSchedule.items) || rawSchedule.items.length !== 7) {
      return {
        isValid: false,
        error: '有効な週間スケジュール設定（7日分のアイテム）が含まれていません。',
      };
    }

    const schedule: ScheduleData = {
      ...DEFAULT_SCHEDULE_DATA,
      ...rawSchedule,
    };

    const rawAvatar = parsed.avatarConfig ?? {};
    const avatarConfig: Omit<AvatarConfig, 'imageElement'> = {
      dataUrl: typeof rawAvatar.dataUrl === 'string' ? rawAvatar.dataUrl : null,
      scale:
        typeof rawAvatar.scale === 'number'
          ? Math.max(0.5, Math.min(2.0, rawAvatar.scale))
          : DEFAULT_AVATAR_CONFIG.scale,
      offsetX:
        typeof rawAvatar.offsetX === 'number'
          ? Math.max(-600, Math.min(600, rawAvatar.offsetX))
          : DEFAULT_AVATAR_CONFIG.offsetX,
      offsetY:
        typeof rawAvatar.offsetY === 'number'
          ? Math.max(-400, Math.min(400, rawAvatar.offsetY))
          : DEFAULT_AVATAR_CONFIG.offsetY,
      flipHorizontal:
        typeof rawAvatar.flipHorizontal === 'boolean'
          ? rawAvatar.flipHorizontal
          : DEFAULT_AVATAR_CONFIG.flipHorizontal,
      opacity:
        typeof rawAvatar.opacity === 'number'
          ? Math.max(0.1, Math.min(1.0, rawAvatar.opacity))
          : DEFAULT_AVATAR_CONFIG.opacity,
      alignment:
        rawAvatar.alignment === 'left' ||
        rawAvatar.alignment === 'right' ||
        rawAvatar.alignment === 'center'
          ? rawAvatar.alignment
          : DEFAULT_AVATAR_CONFIG.alignment,
    };

    const quickTags = Array.isArray(parsed.quickTags) ? parsed.quickTags : undefined;

    return {
      isValid: true,
      schedule,
      avatarConfig,
      quickTags,
    };
  } catch {
    return {
      isValid: false,
      error: 'JSONファイルの解析に失敗しました。ファイル形式を確認してください。',
    };
  }
}

/**
 * 名前付き「マイ設定プリセット」および「マイ定番枠（クイック入力タグ）」を管理するカスタムフック
 */
export function useSettingsPresets() {
  const [presets, setPresets] = useState<SettingsPreset[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_PRESETS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load presets from localStorage:', err);
      }
    }
    return [];
  });

  const [quickTags, setQuickTags] = useState<QuickTagPreset[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_QUICK_TAGS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to load quick tags from localStorage:', err);
      }
    }
    return DEFAULT_QUICK_TAGS;
  });

  // プリセット変更時に LocalStorage へ保存（容量超過時は画像DataURLを軽量化して保存）
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(presets));
      } catch {
        try {
          const lightweightPresets = presets.map((p) => ({
            ...p,
            schedule: { ...p.schedule, customBgDataUrl: null },
            avatarConfig: { ...p.avatarConfig, dataUrl: null },
          }));
          window.localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(lightweightPresets));
        } catch (err) {
          console.warn('Failed to save presets to localStorage:', err);
        }
      }
    }
  }, [presets]);

  // クイックタグ変更時に LocalStorage へ保存
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_QUICK_TAGS, JSON.stringify(quickTags));
      } catch (err) {
        console.warn('Failed to save quick tags to localStorage:', err);
      }
    }
  }, [quickTags]);

  // 現在の設定を名前付きプリセットとして新規保存
  const savePreset = useCallback(
    (name: string, schedule: ScheduleData, avatarConfig: AvatarConfig): SettingsPreset => {
      const trimmedName = name.trim() || `マイ設定 ${presets.length + 1}`;
      const newPreset: SettingsPreset = {
        id: `preset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: trimmedName,
        createdAt: new Date().toISOString(),
        schedule: { ...schedule, items: schedule.items.map((item) => ({ ...item })) },
        avatarConfig: serializeAvatarConfig(avatarConfig),
      };

      setPresets((prev) => [newPreset, ...prev]);
      return newPreset;
    },
    [presets.length]
  );

  // 既存プリセットを現在の設定で上書き更新
  const overwritePreset = useCallback(
    (id: string, schedule: ScheduleData, avatarConfig: AvatarConfig) => {
      setPresets((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                createdAt: new Date().toISOString(),
                schedule: { ...schedule, items: schedule.items.map((item) => ({ ...item })) },
                avatarConfig: serializeAvatarConfig(avatarConfig),
              }
            : p
        )
      );
    },
    []
  );

  // プリセット削除
  const deletePreset = useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // マイ定番枠（クイックタグ）を追加
  const addQuickTag = useCallback((tag: Omit<QuickTagPreset, 'id'>): QuickTagPreset => {
    const newTag: QuickTagPreset = {
      ...tag,
      id: `qt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setQuickTags((prev) => [...prev, newTag]);
    return newTag;
  }, []);

  // マイ定番枠を削除
  const removeQuickTag = useCallback((id: string) => {
    setQuickTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // マイ定番枠をデフォルトに戻す
  const resetQuickTags = useCallback(() => {
    setQuickTags(DEFAULT_QUICK_TAGS);
  }, []);

  return {
    presets,
    quickTags,
    savePreset,
    overwritePreset,
    deletePreset,
    addQuickTag,
    removeQuickTag,
    resetQuickTags,
    setQuickTags,
  };
}
