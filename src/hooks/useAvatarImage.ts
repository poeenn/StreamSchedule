import { useState, useCallback } from 'react';
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
 * 立ち絵画像の読み込み・変形パラメータ（スケール、オフセット、反転、透明度）を管理するカスタムフック
 */
export function useAvatarImage(initialConfig?: Partial<AvatarConfig>) {
  const [config, setConfig] = useState<AvatarConfig>(() => ({
    ...DEFAULT_AVATAR_CONFIG,
    ...initialConfig,
  }));

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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

  // URLから画像を読み込む
  const loadFromUrl = useCallback((url: string) => {
    setIsLoading(true);
    setError(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
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
  }, []);

  return {
    config,
    isLoading,
    error,
    loadFromFile,
    loadFromUrl,
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
