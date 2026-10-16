import { useState, useEffect, useCallback } from 'react';
import { AvatarConfig } from '../types/schedule';

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  imageElement: null,
  dataUrl: null,
  scale: 1.0,
  offsetX: 0,
  offsetY: 0,
  flipHorizontal: false,
  opacity: 1.0,
  alignment: 'right',
};

export const STORAGE_KEY_AVATAR_CONFIG = 'stream_schedule_avatar_config_v1';

/**
 * 立ち絵設定からLocalStorage保存可能なシリアライズオブジェクトを生成する純粋関数
 */
export function serializeAvatarConfig(
  config: AvatarConfig
): Omit<AvatarConfig, 'imageElement'> {
  return {
    dataUrl: config.dataUrl ?? null,
    scale: config.scale,
    offsetX: config.offsetX,
    offsetY: config.offsetY,
    flipHorizontal: config.flipHorizontal,
    opacity: config.opacity,
    alignment: config.alignment,
  };
}

/**
 * LocalStorageから立ち絵設定を安全に復元する純粋関数
 */
export function loadAvatarConfigFromStorage(storage?: Storage): AvatarConfig {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return { ...DEFAULT_AVATAR_CONFIG };

  try {
    const raw = targetStorage.getItem(STORAGE_KEY_AVATAR_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_AVATAR_CONFIG,
          scale:
            typeof parsed.scale === 'number'
              ? Math.max(0.5, Math.min(2.0, parsed.scale))
              : DEFAULT_AVATAR_CONFIG.scale,
          offsetX:
            typeof parsed.offsetX === 'number'
              ? Math.max(-600, Math.min(600, parsed.offsetX))
              : DEFAULT_AVATAR_CONFIG.offsetX,
          offsetY:
            typeof parsed.offsetY === 'number'
              ? Math.max(-400, Math.min(400, parsed.offsetY))
              : DEFAULT_AVATAR_CONFIG.offsetY,
          flipHorizontal:
            typeof parsed.flipHorizontal === 'boolean'
              ? parsed.flipHorizontal
              : DEFAULT_AVATAR_CONFIG.flipHorizontal,
          opacity:
            typeof parsed.opacity === 'number'
              ? Math.max(0.1, Math.min(1.0, parsed.opacity))
              : DEFAULT_AVATAR_CONFIG.opacity,
          alignment:
            parsed.alignment === 'left' ||
            parsed.alignment === 'right' ||
            parsed.alignment === 'center'
              ? parsed.alignment
              : DEFAULT_AVATAR_CONFIG.alignment,
          dataUrl: typeof parsed.dataUrl === 'string' ? parsed.dataUrl : null,
          imageElement: null,
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load avatar config from localStorage:', err);
  }

  return { ...DEFAULT_AVATAR_CONFIG };
}

/**
 * LocalStorageへ立ち絵設定を自動保存する純粋関数
 * 容量超過エラー (QuotaExceededError) 発生時は dataUrl を除いた変形パラメータのみを安全に保存します。
 */
export function saveAvatarConfigToStorage(config: AvatarConfig, storage?: Storage): boolean {
  const targetStorage =
    storage ?? (typeof window !== 'undefined' ? window.localStorage : undefined);
  if (!targetStorage) return false;

  const serializable = serializeAvatarConfig(config);
  try {
    targetStorage.setItem(STORAGE_KEY_AVATAR_CONFIG, JSON.stringify(serializable));
    return true;
  } catch {
    // 画像サイズが大きすぎてLocalStorage上限を超えた場合は変形設定値のみを確実に保存
    try {
      const fallback = { ...serializable, dataUrl: null };
      targetStorage.setItem(STORAGE_KEY_AVATAR_CONFIG, JSON.stringify(fallback));
      return true;
    } catch (innerErr) {
      console.warn('Failed to save avatar config to localStorage:', innerErr);
      return false;
    }
  }
}

/**
 * 立ち絵画像の読み込み・変形パラメータ（スケール、オフセット、反転、透明度）およびLocalStorage自動復元を管理するカスタムフック
 */
export function useAvatarImage(initialConfig?: Partial<AvatarConfig>) {
  const [config, setConfig] = useState<AvatarConfig>(() => {
    if (initialConfig) {
      return {
        ...DEFAULT_AVATAR_CONFIG,
        ...initialConfig,
      };
    }
    return loadAvatarConfigFromStorage();
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // ページリロード時やプリセット復元時に dataUrl が存在し imageElement が未構築なら自動的に Image 要素を再構築
  useEffect(() => {
    if (config.dataUrl && !config.imageElement && typeof Image !== 'undefined') {
      let isCancelled = false;
      const targetUrl = config.dataUrl;
      const img = new Image();
      img.onload = () => {
        if (!isCancelled) {
          setConfig((prev) =>
            prev.dataUrl === targetUrl ? { ...prev, imageElement: img } : prev
          );
        }
      };
      img.onerror = () => {
        if (!isCancelled) {
          console.warn('Failed to reconstruct avatar image from saved dataUrl');
        }
      };
      img.src = targetUrl;

      return () => {
        isCancelled = true;
      };
    }
  }, [config.dataUrl, config.imageElement]);

  // 設定変更時に LocalStorage へ自動保存
  useEffect(() => {
    saveAvatarConfigToStorage(config);
  }, [
    config.dataUrl,
    config.scale,
    config.offsetX,
    config.offsetY,
    config.flipHorizontal,
    config.opacity,
    config.alignment,
  ]);

  // ファイル（File / Blob）から画像を読み込む
  const loadFromFile = useCallback((file: File | Blob) => {
    setIsLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsLoading(false);
        setError('ファイルの読み込みに失敗しました。');
        return;
      }

      const img = new Image();
      img.onload = () => {
        setConfig((prev) => ({
          ...prev,
          imageElement: img,
          dataUrl,
        }));
        setIsLoading(false);
      };
      img.onerror = () => {
        setIsLoading(false);
        setError('画像のデコードに失敗しました。有効な画像形式を選択してください。');
      };
      img.src = dataUrl;
    };

    reader.onerror = () => {
      setIsLoading(false);
      setError('ファイルの読み込みエラーが発生しました。');
    };

    reader.readAsDataURL(file);
  }, []);

  // URLまたはDataURLから画像を読み込む
  const loadFromUrl = useCallback((url: string) => {
    setIsLoading(true);
    setError(null);

    const img = new Image();
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      setConfig((prev) => ({
        ...prev,
        imageElement: img,
        dataUrl: url,
      }));
      setIsLoading(false);
    };
    img.onerror = () => {
      setIsLoading(false);
      setError('画像URLの読み込みに失敗しました。CORS制限または無効なURLの可能性があります。');
    };
    img.src = url;
  }, []);

  // プリセットやJSONから立ち絵設定一式を復元する
  const restoreAvatarConfig = useCallback((saved: Partial<AvatarConfig>) => {
    setError(null);
    const nextDataUrl = saved.dataUrl ?? null;

    if (nextDataUrl && typeof Image !== 'undefined') {
      const img = new Image();
      img.onload = () => {
        setConfig({
          ...DEFAULT_AVATAR_CONFIG,
          ...saved,
          dataUrl: nextDataUrl,
          imageElement: img,
        });
      };
      img.onerror = () => {
        setConfig({
          ...DEFAULT_AVATAR_CONFIG,
          ...saved,
          dataUrl: null,
          imageElement: null,
        });
      };
      img.src = nextDataUrl;
    } else {
      setConfig({
        ...DEFAULT_AVATAR_CONFIG,
        ...saved,
        dataUrl: nextDataUrl,
        imageElement: null,
      });
    }
  }, []);

  // スケール変更 (0.5 〜 2.0)
  const setScale = useCallback((scale: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, scale));
    setConfig((prev) => ({ ...prev, scale: clamped }));
  }, []);

  // Xオフセット変更 (-600 〜 +600)
  const setOffsetX = useCallback((offsetX: number) => {
    const clamped = Math.max(-600, Math.min(600, offsetX));
    setConfig((prev) => ({ ...prev, offsetX: clamped }));
  }, []);

  // Yオフセット変更 (-400 〜 +400)
  const setOffsetY = useCallback((offsetY: number) => {
    const clamped = Math.max(-400, Math.min(400, offsetY));
    setConfig((prev) => ({ ...prev, offsetY: clamped }));
  }, []);

  // 水平反転トグル / 設定
  const toggleFlipHorizontal = useCallback(() => {
    setConfig((prev) => ({ ...prev, flipHorizontal: !prev.flipHorizontal }));
  }, []);

  const setFlipHorizontal = useCallback((flip: boolean) => {
    setConfig((prev) => ({ ...prev, flipHorizontal: flip }));
  }, []);

  // 不透明度変更 (0.1 〜 1.0)
  const setOpacity = useCallback((opacity: number) => {
    const clamped = Math.max(0.1, Math.min(1.0, opacity));
    setConfig((prev) => ({ ...prev, opacity: clamped }));
  }, []);

  // 立ち絵の位置・変形パラメータのみ初期化
  const resetTransform = useCallback(() => {
    setConfig((prev) => ({
      ...prev,
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      flipHorizontal: false,
      opacity: 1.0,
    }));
  }, []);

  // 立ち絵画像を削除（全クリア）
  const clearAvatar = useCallback(() => {
    setConfig({
      ...DEFAULT_AVATAR_CONFIG,
    });
    setError(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(STORAGE_KEY_AVATAR_CONFIG);
      } catch {
        // ignore
      }
    }
  }, []);

  return {
    config,
    isLoading,
    error,
    loadFromFile,
    loadFromUrl,
    restoreAvatarConfig,
    setScale,
    setOffsetX,
    setOffsetY,
    setFlipHorizontal,
    toggleFlipHorizontal,
    setOpacity,
    resetTransform,
    clearAvatar,
    setConfig,
  };
}
