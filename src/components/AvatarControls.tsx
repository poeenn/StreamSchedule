import React, { useRef, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  FlipHorizontal,
  ZoomIn,
  Move,
  Eye,
} from 'lucide-react';
import { AvatarConfig } from '../types/schedule';

interface AvatarControlsProps {
  avatarConfig: AvatarConfig;
  isLoading?: boolean;
  error?: string | null;
  onLoadFromFile: (file: File) => void;
  onSetScale: (scale: number) => void;
  onSetOffsetX: (offsetX: number) => void;
  onSetOffsetY: (offsetY: number) => void;
  onToggleFlipHorizontal: () => void;
  onSetOpacity: (opacity: number) => void;
  onResetTransform: () => void;
  onClearAvatar: () => void;
}

export const AvatarControls: React.FC<AvatarControlsProps> = ({
  avatarConfig,
  isLoading = false,
  error = null,
  onLoadFromFile,
  onSetScale,
  onSetOffsetX,
  onSetOffsetY,
  onToggleFlipHorizontal,
  onSetOpacity,
  onResetTransform,
  onClearAvatar,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadFromFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onLoadFromFile(file);
    }
  };

  const hasImage = Boolean(avatarConfig.imageElement || avatarConfig.dataUrl);

  return (
    <div className="avatar-controls-panel editor-card">
      <div className="panel-header">
        <div className="section-title">
          <ImageIcon size={18} className="text-accent" />
          <span>立ち絵・アバター合成設定</span>
        </div>

        {hasImage && (
          <div className="panel-actions">
            <button
              type="button"
              className="btn btn-ghost btn-xs text-muted"
              onClick={onResetTransform}
              title="配置・サイズを初期位置に戻す"
            >
              <RotateCcw size={14} />
              <span>位置リセット</span>
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-xs text-danger"
              onClick={onClearAvatar}
              title="立ち絵画像を削除する"
            >
              <Trash2 size={14} />
              <span>削除</span>
            </button>
          </div>
        )}
      </div>

      <div className="panel-body mt-3">
        {/* アップロードドロップゾーン */}
        {!hasImage ? (
          <div
            className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Upload size={32} className="dropzone-icon" />
            <p className="dropzone-main-text">
              {isLoading ? '画像を読み込み中...' : '立ち絵画像を選択 または ドロップ'}
            </p>
            <p className="dropzone-sub-text">PNG / WebP / JPEG（背景透過PNG推奨）</p>
          </div>
        ) : (
          <div className="avatar-loaded-view">
            {/* サムネイルと画像変更ボタン */}
            <div className="avatar-thumb-strip">
              <div className="avatar-thumb-wrapper">
                {avatarConfig.dataUrl && (
                  <img
                    src={avatarConfig.dataUrl}
                    alt="立ち絵プレビュー"
                    className="avatar-thumb-img"
                    style={{
                      transform: avatarConfig.flipHorizontal ? 'scaleX(-1)' : 'none',
                      opacity: avatarConfig.opacity,
                    }}
                  />
                )}
              </div>
              <div className="avatar-thumb-info">
                <span className="badge badge-success">立ち絵適用中</span>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs mt-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={12} />
                  <span>画像を変更</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {/* 変形調整スライダー群 */}
            <div className="avatar-sliders-grid mt-4">
              {/* スケール */}
              <div className="slider-control">
                <div className="slider-header">
                  <span className="slider-label">
                    <ZoomIn size={14} /> 拡大縮小
                  </span>
                  <span className="slider-value">{Math.round(avatarConfig.scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  className="slider-input"
                  value={avatarConfig.scale}
                  onChange={(e) => onSetScale(parseFloat(e.target.value))}
                />
              </div>

              {/* X 位置オフセット */}
              <div className="slider-control">
                <div className="slider-header">
                  <span className="slider-label">
                    <Move size={14} /> 左右位置 (X)
                  </span>
                  <span className="slider-value">{avatarConfig.offsetX} px</span>
                </div>
                <input
                  type="range"
                  min="-600"
                  max="600"
                  step="10"
                  className="slider-input"
                  value={avatarConfig.offsetX}
                  onChange={(e) => onSetOffsetX(parseInt(e.target.value, 10))}
                />
              </div>

              {/* Y 位置オフセット */}
              <div className="slider-control">
                <div className="slider-header">
                  <span className="slider-label">
                    <Move size={14} /> 上下位置 (Y)
                  </span>
                  <span className="slider-value">{avatarConfig.offsetY} px</span>
                </div>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  step="10"
                  className="slider-input"
                  value={avatarConfig.offsetY}
                  onChange={(e) => onSetOffsetY(parseInt(e.target.value, 10))}
                />
              </div>

              {/* 不透明度 */}
              <div className="slider-control">
                <div className="slider-header">
                  <span className="slider-label">
                    <Eye size={14} /> 不透明度
                  </span>
                  <span className="slider-value">{Math.round(avatarConfig.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  className="slider-input"
                  value={avatarConfig.opacity}
                  onChange={(e) => onSetOpacity(parseFloat(e.target.value))}
                />
              </div>

              {/* 左右反転トグル */}
              <div className="toggle-control mt-2">
                <button
                  type="button"
                  className={`btn btn-sm ${avatarConfig.flipHorizontal ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={onToggleFlipHorizontal}
                >
                  <FlipHorizontal size={16} />
                  <span>左右反転: {avatarConfig.flipHorizontal ? 'ON (反転中)' : 'OFF (通常)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {error && <div className="form-error mt-2">{error}</div>}
      </div>
    </div>
  );
};
